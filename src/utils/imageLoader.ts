import { invoke } from '@tauri-apps/api/core'

/**
 * 兼容层：
 * - 对外保持原有函数名/类名
 * - 内部优先走 Rust 内存缓存（get_image_bytes / preload_images）
 */

type LoadPriority = 'high' | 'medium' | 'low' | 'auto'
type FetchPriority = 'high' | 'low' | 'auto'

export interface PreloadImageResult {
  blobUrl: string
  bytes: number
}

export interface PreloadImageOptions {
  priority?: LoadPriority
  signal?: AbortSignal
}

export interface PreloadImagesOptions {
  concurrency?: number
  onProgress?: (loaded: number, total: number) => void
}

export interface RustPreloadItemResult {
  url: string
  success: boolean
  local_path: string | null
  error: string | null
}

export type BrowserPreloadItemResult =
  | ({ success: true; url: string } & PreloadImageResult)
  | { success: false; url: string; error: unknown }

export type PreloadImagesResult = Array<RustPreloadItemResult | BrowserPreloadItemResult>

export interface SmartPreloaderOptions {
  cacheSize?: number
  preloadAhead?: number
  preloadBehind?: number
}

const preloadQueue = new Map<string, Promise<PreloadImageResult>>() // src -> Promise
const loadedImages = new Map<string, PreloadImageResult>() // src -> { blobUrl, bytes }

/**
 * Tauri 环境判断
 */
function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, '__TAURI_INTERNALS__')
}

function toFetchPriority(priority: LoadPriority): FetchPriority {
  if (priority === 'medium') return 'auto'
  return priority
}

function toUint8Array(payload: unknown): Uint8Array {
  if (payload instanceof Uint8Array) return payload
  if (Array.isArray(payload)) return new Uint8Array(payload)
  return new Uint8Array([])
}

function uint8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const start = u8.byteOffset
  const end = start + u8.byteLength
  return u8.buffer.slice(start, end) as ArrayBuffer
}

async function preloadViaRust(src: string): Promise<PreloadImageResult> {
  const bytes = await invoke<unknown>('get_image_bytes', { url: src })
  const u8 = toUint8Array(bytes)
  const blob = new Blob([uint8ToArrayBuffer(u8)])
  const blobUrl = URL.createObjectURL(blob)
  return { blobUrl, bytes: u8.byteLength }
}

function preloadViaBrowser(
  src: string,
  priority: LoadPriority = 'auto',
  signal?: AbortSignal
): Promise<PreloadImageResult> {
  return new Promise<PreloadImageResult>((resolve, reject) => {
    const img = new Image()

    if ('fetchPriority' in img) {
      ;(img as HTMLImageElement & { fetchPriority: FetchPriority }).fetchPriority = toFetchPriority(priority)
    }

    img.onload = () => resolve({ blobUrl: src, bytes: 0 })
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))

    if (signal) {
      signal.addEventListener('abort', () => {
        img.src = ''
        reject(new Error('Aborted'))
      })
    }

    img.src = src
  })
}

export async function preloadImage(
  src: string,
  options: PreloadImageOptions = {}
): Promise<PreloadImageResult> {
  if (!src) throw new Error('Empty image source')
  if (loadedImages.has(src)) return loadedImages.get(src)!
  if (preloadQueue.has(src)) return preloadQueue.get(src)!

  const { priority = 'auto', signal } = options

  const task = (async () => {
    const result = isTauriRuntime()
      ? await preloadViaRust(src)
      : await preloadViaBrowser(src, priority, signal)

    loadedImages.set(src, result)
    preloadQueue.delete(src)
    return result
  })().catch((e: unknown) => {
    preloadQueue.delete(src)
    throw e
  })

  preloadQueue.set(src, task)
  return task
}

export async function preloadImages(
  urls: string[],
  options: PreloadImagesOptions = {}
): Promise<PreloadImagesResult> {
  const { concurrency = 3, onProgress } = options
  if (!urls?.length) return []

  // Tauri: 直接让 Rust 并发预加载
  if (isTauriRuntime()) {
    const result = await invoke<RustPreloadItemResult[]>('preload_images', {
      req: { urls, concurrency }
    })
    let loaded = 0
    for (const _ of result) {
      loaded++
      onProgress?.(loaded, urls.length)
    }
    return result
  }

  // Browser fallback
  let loaded = 0
  const results: BrowserPreloadItemResult[] = []

  for (const url of urls) {
    try {
      const data = await preloadImage(url)
      results.push({ success: true, url, ...data })
    } catch (error: unknown) {
      results.push({ success: false, url, error })
    } finally {
      loaded++
      onProgress?.(loaded, urls.length)
    }
  }

  return results
}

export class SmartPreloader {
  cacheSize: number
  preloadAhead: number
  preloadBehind: number
  cache: Map<string, PreloadImageResult>
  abortControllers: Map<string, AbortController>

  constructor(options: SmartPreloaderOptions = {}) {
    this.cacheSize = options.cacheSize || 10
    this.preloadAhead = options.preloadAhead || 3
    this.preloadBehind = options.preloadBehind || 1
    this.cache = new Map<string, PreloadImageResult>() // url -> { blobUrl, bytes }
    this.abortControllers = new Map<string, AbortController>()
  }

  async getImage(url: string, priority: LoadPriority = 'high'): Promise<PreloadImageResult> {
    if (this.cache.has(url)) return this.cache.get(url)!

    if (this.abortControllers.has(url)) {
      this.abortControllers.get(url)!.abort()
    }

    const controller = new AbortController()
    this.abortControllers.set(url, controller)

    try {
      const data = await preloadImage(url, { priority, signal: controller.signal })
      this.addToCache(url, data)
      return data
    } finally {
      this.abortControllers.delete(url)
    }
  }

  preloadRange(urls: string[], currentIndex: number): void {
    const start = Math.max(0, currentIndex - this.preloadBehind)
    const end = Math.min(urls.length, currentIndex + this.preloadAhead + 1)

    if (urls[currentIndex]) this.getImage(urls[currentIndex], 'high').catch(() => {})

    for (let i = currentIndex + 1; i < end; i++) {
      if (urls[i] && !this.cache.has(urls[i])) this.getImage(urls[i], 'medium').catch(() => {})
    }

    for (let i = start; i < currentIndex; i++) {
      if (urls[i] && !this.cache.has(urls[i])) this.getImage(urls[i], 'low').catch(() => {})
    }

    this.cleanupCache(urls, currentIndex)
  }

  addToCache(url: string, data: PreloadImageResult): void {
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value as string | undefined
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(url, data)
  }

  cleanupCache(urls: string[], currentIndex: number): void {
    const keepUrls = new Set<string>()
    const start = Math.max(0, currentIndex - this.preloadBehind)
    const end = Math.min(urls.length, currentIndex + this.preloadAhead + 1)

    for (let i = start; i < end; i++) if (urls[i]) keepUrls.add(urls[i])

    for (const [url] of this.cache) {
      if (!keepUrls.has(url)) this.cache.delete(url)
    }
  }

  clear(): void {
    this.cache.clear()
    for (const controller of this.abortControllers.values()) controller.abort()
    this.abortControllers.clear()
  }
}

export function isImageCached(src: string): boolean {
  return loadedImages.has(src)
}

export function getImageLoadProgress(urls: string[]): number {
  if (!urls?.length) return 1
  const cached = urls.filter((url: string) => isImageCached(url)).length
  return cached / urls.length
}

export function lazyLoadImage(
  imgElement: HTMLImageElement,
  options: { rootMargin?: string; threshold?: number } = {}
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!('IntersectionObserver' in window)) {
      imgElement.loading = 'eager'
      resolve()
      return
    }

    const { rootMargin = '50px', threshold = 0.01 } = options
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
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
