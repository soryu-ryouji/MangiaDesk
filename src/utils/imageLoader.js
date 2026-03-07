/**
 * 图片预加载工具模块
 * 提供图片预加载、加载队列管理等功能
 */

// 预加载队列
const preloadQueue = new Set()
const loadedImages = new Map() // 缓存已加载的图片

/**
 * 预加载单张图片
 * @param {string} src - 图片URL
 * @param {object} options - 配置选项
 * @returns {Promise} - 加载完成的Promise
 */
export function preloadImage(src, options = {}) {
  if (!src) return Promise.reject(new Error('Empty image source'))

  // 如果已经在缓存中，直接返回
  if (loadedImages.has(src)) {
    return Promise.resolve(loadedImages.get(src))
  }

  // 如果已经在加载队列中，返回现有的promise
  if (preloadQueue.has(src)) {
    return loadedImages.get(src + '_promise')
  }

  const { priority = 'auto', signal } = options

  const promise = new Promise((resolve, reject) => {
    const img = new Image()

    // 设置加载优先级（如果浏览器支持）
    if ('fetchPriority' in img) {
      img.fetchPriority = priority
    }

    img.onload = () => {
      loadedImages.set(src, img)
      preloadQueue.delete(src)
      resolve(img)
    }

    img.onerror = () => {
      preloadQueue.delete(src)
      reject(new Error(`Failed to load image: ${src}`))
    }

    // 支持取消加载
    if (signal) {
      signal.addEventListener('abort', () => {
        img.src = ''
        preloadQueue.delete(src)
        reject(new Error('Aborted'))
      })
    }

    img.src = src
  })

  // 存储promise以便复用
  loadedImages.set(src + '_promise', promise)
  preloadQueue.add(src)

  return promise
}

/**
 * 批量预加载图片（带并发控制）
 * @param {string[]} urls - 图片URL数组
 * @param {object} options - 配置选项
 * @returns {Promise} - 全部加载完成的Promise
 */
export function preloadImages(urls, options = {}) {
  const {
    concurrency = 3,  // 并发数
    onProgress,       // 进度回调 (loaded, total)
    signal            // 用于取消加载
  } = options

  if (!urls || urls.length === 0) return Promise.resolve([])

  let loaded = 0
  const total = urls.length
  const results = new Array(total)
  const queue = [...urls]
  const active = new Set()

  return new Promise((resolve, reject) => {
    const checkComplete = () => {
      if (loaded === total) {
        resolve(results)
      }
    }

    const loadNext = async (index) => {
      if (signal?.aborted) {
        reject(new Error('Aborted'))
        return
      }

      const url = queue.shift()
      if (!url) return

      try {
        const img = await preloadImage(url, { signal })
        results[index] = { success: true, img, url }
        loaded++
        onProgress?.(loaded, total)
        active.delete(index)

        // 继续加载队列中的下一个
        if (queue.length > 0) {
          loadNext(total - queue.length - 1)
        }

        checkComplete()
      } catch (error) {
        results[index] = { success: false, error, url }
        loaded++
        onProgress?.(loaded, total)
        active.delete(index)

        if (queue.length > 0) {
          loadNext(total - queue.length - 1)
        }

        checkComplete()
      }
    }

    // 启动初始并发
    const initialCount = Math.min(concurrency, total)
    for (let i = 0; i < initialCount; i++) {
      active.add(i)
      loadNext(i)
    }
  })
}

/**
 * 智能预加载策略（用于漫画阅读器）
 * 优先加载当前页，然后预加载后面的页面
 */
export class SmartPreloader {
  constructor(options = {}) {
    this.cacheSize = options.cacheSize || 10  // 缓存图片数量
    this.preloadAhead = options.preloadAhead || 3  // 提前预加载的页数
    this.preloadBehind = options.preloadBehind || 1  // 向后保留的页数
    this.abortControllers = new Map()
    this.cache = new Map()  // LRU缓存
  }

  /**
   * 获取图片（优先从缓存，否则加载）
   */
  async getImage(url, priority = 'high') {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    // 取消之前的加载（如果是低优先级）
    if (this.abortControllers.has(url)) {
      this.abortControllers.get(url).abort()
    }

    const controller = new AbortController()
    this.abortControllers.set(url, controller)

    try {
      const img = await preloadImage(url, {
        priority,
        signal: controller.signal
      })
      this.addToCache(url, img)
      return img
    } finally {
      this.abortControllers.delete(url)
    }
  }

  /**
   * 预加载指定范围的图片
   */
  preloadRange(urls, currentIndex) {
    const start = Math.max(0, currentIndex - this.preloadBehind)
    const end = Math.min(urls.length, currentIndex + this.preloadAhead + 1)

    // 高优先级：当前页
    if (urls[currentIndex]) {
      this.getImage(urls[currentIndex], 'high')
    }

    // 中优先级：后面的页面
    for (let i = currentIndex + 1; i < end; i++) {
      if (urls[i] && !this.cache.has(urls[i])) {
        this.getImage(urls[i], 'medium').catch(() => {})
      }
    }

    // 低优先级：前面的页面
    for (let i = start; i < currentIndex; i++) {
      if (urls[i] && !this.cache.has(urls[i])) {
        this.getImage(urls[i], 'low').catch(() => {})
      }
    }

    // 清理缓存
    this.cleanupCache(urls, currentIndex)
  }

  addToCache(url, img) {
    // LRU策略：如果缓存满了，删除最早的
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(url, img)
  }

  cleanupCache(urls, currentIndex) {
    const keepUrls = new Set()
    const start = Math.max(0, currentIndex - this.preloadBehind)
    const end = Math.min(urls.length, currentIndex + this.preloadAhead + 1)

    for (let i = start; i < end; i++) {
      if (urls[i]) keepUrls.add(urls[i])
    }

    // 删除不在范围内的缓存
    for (const [url] of this.cache) {
      if (!keepUrls.has(url)) {
        this.cache.delete(url)
      }
    }
  }

  clear() {
    this.cache.clear()
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
  }
}

/**
 * 检查图片是否已缓存
 */
export function isImageCached(src) {
  return loadedImages.has(src)
}

/**
 * 获取加载进度（0-1）
 */
export function getImageLoadProgress(urls) {
  if (!urls || urls.length === 0) return 1
  const cached = urls.filter(url => isImageCached(url)).length
  return cached / urls.length
}

/**
 * 延迟加载图片（使用 Intersection Observer）
 */
export function lazyLoadImage(imgElement, options = {}) {
  return new Promise((resolve) => {
    if (!('IntersectionObserver' in window)) {
      // 如果不支持，直接加载
      imgElement.loading = 'eager'
      resolve()
      return
    }

    const { rootMargin = '50px', threshold = 0.01 } = options

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          imgElement.loading = 'eager'
          observer.unobserve(imgElement)
          resolve()
        }
      })
    }, { rootMargin, threshold })

    observer.observe(imgElement)
  })
}
