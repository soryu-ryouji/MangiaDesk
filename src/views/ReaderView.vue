<template>
  <div class="reader">
    <!-- 阅读工具栏 -->
    <div class="reader-toolbar" :class="{ 'hidden': !showToolbar && !isHoveringToolbar }">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="goBack">
          ← 返回
        </button>
        <span class="chapter-name">{{ chapterName }}</span>
      </div>
      <div class="toolbar-right">
        <span class="page-indicator">{{ pageIndicator }}</span>
      </div>
    </div>

    <!-- 阅读区域 -->
    <div
      class="reader-content"
      @click="handleClick"
      :class="[readingMode, { 'double-page': isDoublePageMode }]"
    >
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载章节中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>加载失败: {{ error }}</p>
        <button @click="loadChapter" class="retry-btn">重试</button>
      </div>

      <div v-else-if="chapterDetail" class="pages-container">
        <!-- 翻页模式 -->
        <template v-if="readingMode === 'page'">
          <div class="page-wrapper" :class="{ 'double': isDoublePageMode }">
            <!-- 双页模式 -->
            <template v-if="isDoublePageMode">
              <div class="double-page-container">
                <!-- 左页 (偶数页在当前页右边) -->
                <div v-if="showLeftPage" class="page-slot left" :class="{ 'loading': isImageLoading(leftPageImage) }">
                  <img
                    v-if="leftPageImage"
                    :src="leftPageImage"
                    alt="Left Page"
                    class="manga-page"
                    @load="onImageLoad(leftPageImage)"
                    @error="onImageError"
                  />
                  <div v-if="isImageLoading(leftPageImage)" class="image-loading">
                    <div class="spinner small"></div>
                  </div>
                </div>
                <div v-else class="page-slot left placeholder"></div>

                <!-- 右页 (奇数页) -->
                <div v-if="showRightPage" class="page-slot right" :class="{ 'loading': isImageLoading(rightPageImage) }">
                  <img
                    v-if="rightPageImage"
                    :src="rightPageImage"
                    alt="Right Page"
                    class="manga-page"
                    @load="onImageLoad(rightPageImage)"
                    @error="onImageError"
                  />
                  <div v-if="isImageLoading(rightPageImage)" class="image-loading">
                    <div class="spinner small"></div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 单页模式 -->
            <template v-else>
              <div class="single-page-container" :class="{ 'loading': isImageLoading(currentPageImage) }">
                <img
                  v-if="currentPageImage"
                  :src="currentPageImage"
                  :alt="`Page ${currentPage}`"
                  class="manga-page single"
                  @load="onImageLoad(currentPageImage)"
                  @error="onImageError"
                />
                <div v-if="isImageLoading(currentPageImage)" class="image-loading">
                  <div class="spinner small"></div>
                </div>
              </div>
            </template>
          </div>

          <!-- 翻页导航 -->
          <div class="page-navigation" :class="{ 'hidden': !showToolbar }">
            <button
              class="nav-btn prev"
              :disabled="!canGoPrev"
              @click.stop="prevPage"
            >
              ← 上一页
            </button>

            <!-- 页面跳转 -->
            <div class="page-jumper">
              <input
                v-model.number="jumpPage"
                type="number"
                min="1"
                :max="totalPages"
                class="page-input"
                @keyup.enter="goToPage"
              />
              <span class="page-separator">/</span>
              <span class="total-pages">{{ totalPages }}</span>
              <button class="go-btn" @click.stop="goToPage">GO</button>
            </div>

            <button
              class="nav-btn next"
              :disabled="!canGoNext"
              @click.stop="nextPage"
            >
              下一页 →
            </button>
          </div>
        </template>

        <!-- 条漫模式 -->
        <template v-else-if="readingMode === 'webtoon'">
          <div class="webtoon-container">
            <div
              v-for="(url, index) in visibleWebtoonPages"
              :key="index"
              class="webtoon-item"
              :data-index="index"
            >
              <LazyImage
                :src="url"
                :alt="`Page ${index + 1}`"
                :aspect-ratio="'auto'"
                img-class="manga-page webtoon"
                :eager="index < 3"
                @loaded="onWebtoonImageLoaded(index)"
              />
            </div>
            <div ref="webtoonSentinel" class="webtoon-sentinel"></div>
          </div>
          <div class="webtoon-end">
            <p>— 本章完 —</p>
            <button class="back-btn" @click="goBack">返回目录</button>
          </div>
        </template>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="reader-settings" :class="{ 'hidden': !showSettings }">
      <h3>⚙️ 阅读设置</h3>

      <div class="setting-group">
        <div class="setting-item">
          <label>阅读模式</label>
          <select v-model="readingMode">
            <option value="page">翻页模式</option>
            <option value="webtoon">条漫模式</option>
          </select>
        </div>

        <div class="setting-item" v-if="readingMode === 'page'">
          <label>页面排列</label>
          <select v-model="pageLayout">
            <option value="single">单页</option>
            <option value="double">双页</option>
          </select>
        </div>

        <div class="setting-item">
          <label>点击区域导航</label>
          <input type="checkbox" v-model="clickNavigation" />
        </div>

        <div class="setting-item">
          <label>显示操作提示</label>
          <input type="checkbox" v-model="showKeyboardHint" />
        </div>

        <div class="setting-item">
          <label>图片适应</label>
          <select v-model="fitMode">
            <option value="height">适应高度</option>
            <option value="width">适应宽度</option>
            <option value="original">原始大小</option>
          </select>
        </div>

        <div class="setting-item">
          <label>预加载页数</label>
          <select v-model="preloadCount">
            <option :value="2">2 页</option>
            <option :value="3">3 页</option>
            <option :value="5">5 页</option>
            <option :value="10">10 页</option>
          </select>
        </div>
      </div>

      <div class="setting-divider"></div>

      <div class="keyboard-shortcuts">
        <h4>⌨️ 快捷键</h4>
        <div class="shortcut-list">
          <div class="shortcut">
            <kbd>←</kbd>
            <span>上一页</span>
          </div>
          <div class="shortcut">
            <kbd>→</kbd> <kbd>Space</kbd>
            <span>下一页</span>
          </div>
          <div class="shortcut">
            <kbd>F</kbd>
            <span>全屏</span>
          </div>
          <div class="shortcut">
            <kbd>S</kbd>
            <span>设置</span>
          </div>
          <div class="shortcut">
            <kbd>ESC</kbd>
            <span>退出/返回</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置按钮 -->
    <button class="settings-toggle" @click="showSettings = !showSettings">
      ⚙️
    </button>

    <!-- 页面导航按钮 (悬浮) -->
    <div v-if="readingMode === 'page'" class="floating-nav">
      <button
        class="float-btn prev"
        :class="{ 'hidden': !showToolbar }"
        :disabled="!canGoPrev"
        @click="prevPage"
      >
        ‹
      </button>
      <button
        class="float-btn next"
        :class="{ 'hidden': !showToolbar }"
        :disabled="!canGoNext"
        @click="nextPage"
      >
        ›
      </button>
    </div>

    <!-- 操作提示 -->
    <div class="keyboard-hint" :class="{ 'hidden': !showKeyboardHint || !showToolbar }">
      <span>← →</span> 翻页
      <span class="separator">|</span>
      <span>点击中间</span> 显示/隐藏工具栏
      <span class="separator">|</span>
      <span>ESC</span> 设置
    </div>

    <!-- 阅读进度条 -->
    <div class="progress-bar" :class="{ 'hidden': !showToolbar }">
      <div
        class="progress-fill"
        :style="{ width: readingProgress + '%' }"
      ></div>
    </div>

    <!-- 预加载进度指示器 -->
    <div class="preload-indicator" v-if="preloadProgress < 1 && preloadProgress > 0">
      <div class="preload-bar">
        <div class="preload-fill" :style="{ width: preloadProgress * 100 + '%' }"></div>
      </div>
      <span class="preload-text">预加载中 {{ Math.round(preloadProgress * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getChapterDetail } from '../api/manga'
import { SmartPreloader } from '../utils/imageLoader.js'
import LazyImage from '../components/LazyImage.vue'

const props = defineProps({
  mangaName: {
    type: String,
    required: true
  },
  chapterName: {
    type: String,
    required: true
  }
})

const router = useRouter()
const chapterDetail = ref(null)
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const showToolbar = ref(true)
const showSettings = ref(false)
const isHoveringToolbar = ref(false)
const readingMode = ref('page') // 'page' 或 'webtoon'
const pageLayout = ref('single') // 'single' 或 'double'
const clickNavigation = ref(true)
const showKeyboardHint = ref(true)
const fitMode = ref('height')
const jumpPage = ref(1)
const preloadCount = ref(5)

// 图片预加载器
const preloader = new SmartPreloader({
  cacheSize: 15,
  preloadAhead: preloadCount.value,
  preloadBehind: 1
})

// 图片加载状态跟踪
const imageLoadingStates = ref(new Map())

// 条漫模式相关
const webtoonVisibleRange = ref({ start: 0, end: 5 })
const webtoonSentinel = ref(null)
let webtoonObserver = null

const isDoublePageMode = computed(() => readingMode.value === 'page' && pageLayout.value === 'double')

const totalPages = computed(() => {
  return chapterDetail.value?.page_urls?.length || 0
})

const pageUrls = computed(() => {
  return chapterDetail.value?.page_urls || []
})

// 当前页面图片（单页模式）
const currentPageImage = computed(() => {
  if (!pageUrls.value.length) return null
  return pageUrls.value[currentPage.value - 1]
})

// 双页模式：左页（偶数页）
const leftPageImage = computed(() => {
  if (!pageUrls.value.length) return null
  const leftIndex = currentPage.value % 2 === 1
    ? currentPage.value
    : currentPage.value - 1
  return pageUrls.value[leftIndex]
})

// 双页模式：右页（奇数页）
const rightPageImage = computed(() => {
  if (!pageUrls.value.length) return null
  const rightIndex = currentPage.value % 2 === 1
    ? currentPage.value - 1
    : currentPage.value - 2
  return pageUrls.value[rightIndex]
})

// 是否显示左页
const showLeftPage = computed(() => {
  if (isDoublePageMode.value) {
    const leftIndex = currentPage.value % 2 === 1 ? currentPage.value : currentPage.value - 1
    return leftIndex >= 0 && leftIndex < totalPages.value
  }
  return false
})

// 是否显示右页
const showRightPage = computed(() => {
  const rightIndex = currentPage.value % 2 === 1 ? currentPage.value - 1 : currentPage.value - 2
  return rightIndex >= 0 && rightIndex < totalPages.value
})

const canGoPrev = computed(() => {
  if (isDoublePageMode.value) {
    return currentPage.value > 2
  }
  return currentPage.value > 1
})

const canGoNext = computed(() => {
  return currentPage.value < totalPages.value
})

const pageIndicator = computed(() => {
  if (isDoublePageMode.value) {
    const left = currentPage.value % 2 === 1 ? currentPage.value : currentPage.value - 1
    const right = currentPage.value % 2 === 1 ? currentPage.value - 1 : currentPage.value - 2
    const pages = []
    if (right >= 0 && right < totalPages.value) pages.push(right + 1)
    if (left >= 0 && left < totalPages.value) pages.push(left + 1)
    return pages.sort((a, b) => a - b).join('-') + ' / ' + totalPages.value
  }
  return currentPage.value + ' / ' + totalPages.value
})

const readingProgress = computed(() => {
  if (totalPages.value === 0) return 0
  return (currentPage.value / totalPages.value) * 100
})

// 预加载进度
const preloadProgress = computed(() => {
  const cached = preloader.cache.size
  const total = Math.min(pageUrls.value.length, preloadCount.value * 2)
  return total > 0 ? Math.min(cached / total, 1) : 1
})

// 条漫模式可见页面
const visibleWebtoonPages = computed(() => {
  const { start, end } = webtoonVisibleRange.value
  return pageUrls.value.slice(start, end)
})

// 检查图片是否正在加载
const isImageLoading = (url) => {
  if (!url) return false
  if (preloader.cache.has(url)) return false
  return imageLoadingStates.value.get(url) !== false
}

// 加载章节
const loadChapter = async () => {
  loading.value = true
  error.value = null
  preloader.clear()
  imageLoadingStates.value.clear()

  try {
    chapterDetail.value = await getChapterDetail(props.mangaName, props.chapterName)
    currentPage.value = 1
    jumpPage.value = 1

    // 初始预加载
    nextTick(() => {
      updatePreload()
    })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// 更新预加载
const updatePreload = () => {
  if (readingMode.value !== 'page' || !pageUrls.value.length) return

  // 更新预加载器配置
  preloader.preloadAhead = preloadCount.value

  const currentIndex = currentPage.value - 1
  preloader.preloadRange(pageUrls.value, currentIndex)

  // 标记当前页面为加载中
  const currentUrl = pageUrls.value[currentIndex]
  if (currentUrl && !preloader.cache.has(currentUrl)) {
    imageLoadingStates.value.set(currentUrl, true)
  }
}

// 图片加载完成
const onImageLoad = (url) => {
  imageLoadingStates.value.set(url, false)
}

// 图片加载失败
const onImageError = (e) => {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect fill="%23333" width="100" height="140"/><text fill="%23888" x="50" y="70" text-anchor="middle" font-size="12">加载失败</text></svg>'
}

// 条漫图片加载完成
const onWebtoonImageLoaded = (index) => {
  // 可以在这里更新加载状态
}

// 设置条漫模式的 Intersection Observer
const setupWebtoonObserver = () => {
  if (readingMode.value !== 'webtoon' || !webtoonSentinel.value) return

  if (webtoonObserver) {
    webtoonObserver.disconnect()
  }

  webtoonObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 加载更多图片
        const newEnd = Math.min(webtoonVisibleRange.value.end + 3, pageUrls.value.length)
        if (newEnd > webtoonVisibleRange.value.end) {
          webtoonVisibleRange.value.end = newEnd
        }
      }
    })
  }, {
    rootMargin: '200px',
    threshold: 0
  })

  webtoonObserver.observe(webtoonSentinel.value)
}

const goBack = () => {
  router.push(`/manga/${encodeURIComponent(props.mangaName)}`)
}

const prevPage = () => {
  if (isDoublePageMode.value) {
    currentPage.value = Math.max(1, currentPage.value - 2)
  } else {
    if (currentPage.value > 1) currentPage.value--
  }
}

const nextPage = () => {
  if (isDoublePageMode.value) {
    currentPage.value = Math.min(totalPages.value, currentPage.value + 2)
  } else {
    if (currentPage.value < totalPages.value) currentPage.value++
  }
}

const goToPage = () => {
  const page = Math.max(1, Math.min(totalPages.value, jumpPage.value))
  currentPage.value = page
  jumpPage.value = page
}

const handleClick = (e) => {
  if (!clickNavigation.value || readingMode.value === 'webtoon') return

  // 阻止默认行为，防止图片被选中变蓝
  e.preventDefault()

  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const width = rect.width

  // 左侧 25% 区域 - 上一页
  if (x < width * 0.25) {
    prevPage()
  }
  // 右侧 25% 区域 - 下一页
  else if (x > width * 0.75) {
    nextPage()
  }
  // 中间 50% 区域 - 显示/隐藏工具栏
  else {
    showToolbar.value = !showToolbar.value
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

// 键盘快捷键
const handleKeydown = (e) => {
  switch (e.key) {
    case 'ArrowLeft':
      prevPage()
      break
    case 'ArrowRight':
    case ' ':
      e.preventDefault()
      nextPage()
      break
    case 'Escape':
      if (showSettings.value) {
        showSettings.value = false
      } else {
        goBack()
      }
      break
    case 'f':
    case 'F':
      toggleFullscreen()
      break
    case 's':
    case 'S':
      showSettings.value = !showSettings.value
      break
  }
}

// 监听页码变化，触发预加载
watch(currentPage, () => {
  updatePreload()
})

// 监听预加载数量变化
watch(preloadCount, () => {
  updatePreload()
})

// 监听阅读模式变化
watch(readingMode, (mode) => {
  if (mode === 'webtoon') {
    webtoonVisibleRange.value = { start: 0, end: 5 }
    nextTick(() => {
      setupWebtoonObserver()
    })
  }
})

// 同步跳转页码
watch(currentPage, (newVal) => {
  jumpPage.value = newVal
})

onMounted(() => {
  loadChapter()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  preloader.clear()
  if (webtoonObserver) {
    webtoonObserver.disconnect()
  }
})
</script>

<style scoped>
.reader {
  height: 100vh;
  background-color: #0d0d0d;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  user-select: none;          /* 禁止整个阅读器文本选中 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;  /* 移除移动端点击高亮 */
}

/* 工具栏 */
.reader-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: rgba(22, 33, 62, 0.98);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  z-index: 100;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.reader-toolbar.hidden {
  transform: translateY(-100%);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toolbar-btn {
  padding: 8px 18px;
  background-color: rgba(233, 69, 96, 0.2);
  color: #e94560;
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.toolbar-btn:hover {
  background-color: #e94560;
  color: white;
}

.chapter-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
}

.page-indicator {
  color: #888;
  font-size: 0.95rem;
  font-family: monospace;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 6px 14px;
  border-radius: 20px;
}

/* 阅读内容区 */
.reader-content {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.reader-content.webtoon {
  overflow-y: auto;
  top: 0;
  padding-top: 60px;
}

.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #333;
  border-top-color: #e94560;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.spinner.small {
  width: 30px;
  height: 30px;
  border-width: 2px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #e94560;
}

.retry-btn {
  margin-top: 20px;
  padding: 12px 30px;
  background-color: #e94560;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.retry-btn:hover {
  background-color: #c73e54;
  transform: translateY(-2px);
}

.pages-container {
  width: 100%;
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
}

/* 页面包装器 */
.page-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.page-wrapper.double {
  padding: 10px;
}

/* 单页容器 */
.single-page-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  max-height: calc(100vh - 160px);
}

.single-page-container.loading::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 4px;
}

/* 双页容器 */
.double-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  max-width: 95vw;
  height: 100%;
  max-height: calc(100vh - 160px);
}

.page-slot {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 100%;
}

.page-slot.loading::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 4px;
}

.page-slot.placeholder {
  width: 40vw;
  max-width: 350px;
  height: 100%;
  max-height: calc(100vh - 160px);
  aspect-ratio: 3/4;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 4px;
}

.image-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

/* 漫画图片 */
.manga-page {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  user-select: none;          /* 禁止文本选中变蓝 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.manga-page.single {
  max-height: calc(100vh - 160px);
  max-width: 95vw;
  width: auto;
}

.page-slot .manga-page {
  max-height: calc(100vh - 160px);
  max-width: 46vw;
  width: auto;
}

.manga-page.webtoon {
  max-height: none;
  width: 100%;
  max-width: 800px;
  display: block;
  margin: 0 auto;
  box-shadow: none;
}

/* 页面导航 */
.page-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 15px 25px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(22, 33, 62, 0.98);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
  z-index: 99;
  height: 60px;
  box-sizing: border-box;
}

.page-navigation.hidden {
  transform: translateY(100%);
}

.nav-btn {
  padding: 10px 24px;
  background-color: #0f3460;
  color: #eee;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;
}

.nav-btn:hover:not(:disabled) {
  background-color: #e94560;
  transform: translateY(-2px);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 页面跳转 */
.page-jumper {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
}

.page-input {
  width: 50px;
  padding: 6px 8px;
  background-color: #0f3460;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 0.95rem;
}

.page-input:focus {
  outline: none;
  border-color: #e94560;
}

.page-separator {
  color: #666;
}

.total-pages {
  color: #888;
  font-size: 0.9rem;
}

.go-btn {
  padding: 6px 12px;
  background-color: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.go-btn:hover {
  background-color: #c73e54;
}

/* 条漫容器 */
.webtoon-container {
  padding: 20px;
  min-height: 100%;
}

.webtoon-item {
  margin-bottom: 0;
}

.webtoon-sentinel {
  height: 50px;
  margin-top: 20px;
}

.webtoon-end {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.webtoon-end p {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.back-btn {
  padding: 12px 30px;
  background-color: #0f3460;
  color: #eee;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.back-btn:hover {
  background-color: #e94560;
}

/* 设置面板 */
.reader-settings {
  position: fixed;
  top: 70px;
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  background-color: rgba(22, 33, 62, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  z-index: 101;
  transition: opacity 0.3s, transform 0.3s;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.reader-settings.hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px);
}

.reader-settings h3 {
  margin-bottom: 20px;
  color: #e94560;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-item label {
  color: #ccc;
  font-size: 0.9rem;
}

.setting-item select {
  padding: 8px 12px;
  background-color: #0f3460;
  color: #eee;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 100px;
}

.setting-item select:focus {
  outline: none;
  border-color: #e94560;
}

.setting-item input[type="checkbox"] {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #e94560;
}

.setting-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 20px 0;
}

.keyboard-shortcuts h4 {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shortcut {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortcut kbd {
  padding: 4px 10px;
  background-color: #0f3460;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #eee;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.shortcut span {
  color: #888;
  font-size: 0.85rem;
}

/* 设置按钮 */
.settings-toggle {
  position: absolute;
  bottom: 80px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #e94560;
  color: white;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  z-index: 101;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}

.settings-toggle:hover {
  transform: scale(1.1) rotate(30deg);
}

/* 悬浮导航按钮 */
.floating-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;
  z-index: 98;
}

.float-btn {
  width: 50px;
  height: 80px;
  background-color: rgba(22, 33, 62, 0.8);
  backdrop-filter: blur(5px);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

.float-btn:hover:not(:disabled) {
  background-color: #e94560;
  opacity: 1;
}

.float-btn:disabled {
  opacity: 0.1;
  cursor: not-allowed;
}

.float-btn.hidden {
  opacity: 0;
  pointer-events: none;
}

/* 操作提示 */
.keyboard-hint {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  color: #888;
  border-radius: 25px;
  font-size: 0.85rem;
  transition: opacity 0.3s;
  z-index: 97;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.keyboard-hint span:not(.separator) {
  color: #e94560;
  font-weight: 500;
}

.keyboard-hint .separator {
  opacity: 0.3;
}

.keyboard-hint.hidden {
  opacity: 0;
}

/* 进度条 */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.1);
  z-index: 102;
  transition: opacity 0.3s;
}

.progress-bar.hidden {
  opacity: 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  transition: width 0.3s ease;
}

/* 预加载指示器 */
.preload-indicator {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 20px;
  z-index: 103;
}

.preload-bar {
  width: 100px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.preload-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  transition: width 0.3s ease;
}

.preload-text {
  font-size: 0.75rem;
  color: #888;
}

/* 响应式 */
@media (max-width: 768px) {
  .reader-toolbar {
    padding: 0 15px;
    height: 55px;
  }

  .chapter-name {
    display: none;
  }

  .page-wrapper {
    min-height: calc(100vh - 120px);
    padding: 10px;
  }

  .double-page-container {
    gap: 2px;
  }

  .page-slot .manga-page {
    max-height: calc(100vh - 130px);
    max-width: 48vw;
  }

  .page-navigation {
    padding: 10px 15px;
    gap: 10px;
  }

  .nav-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  .page-jumper {
    padding: 4px 8px;
  }

  .page-input {
    width: 40px;
    padding: 4px;
  }

  .float-btn {
    width: 40px;
    height: 60px;
    font-size: 1.5rem;
  }

  .reader-settings {
    right: 10px;
    left: 10px;
    width: auto;
    top: 65px;
  }

  .keyboard-hint {
    font-size: 0.75rem;
    padding: 8px 16px;
    bottom: 60px;
  }

  .settings-toggle {
    bottom: 70px;
    right: 15px;
    width: 45px;
    height: 45px;
  }

  .preload-indicator {
    bottom: 130px;
    padding: 6px 12px;
  }

  .preload-bar {
    width: 60px;
  }

  .preload-text {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .keyboard-hint {
    display: none;
  }
}
</style>
