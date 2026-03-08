<template>
  <div class="lazy-image" :class="{ 'is-loading': isLoading, 'is-loaded': !isLoading && !hasError }">
    <!-- 骨架屏/加载占位 -->
    <div v-if="isLoading && showSkeleton" class="skeleton" :style="skeletonStyle">
      <div class="skeleton-shimmer"></div>
    </div>

    <!-- 纯色占位（不显示骨架动画时） -->
    <div v-else-if="isLoading && !showSkeleton" class="placeholder-solid" :style="skeletonStyle"></div>

    <!-- 加载失败占位 -->
    <div v-else-if="hasError" class="error-placeholder" :style="placeholderStyle">
      <slot name="error">
        <span class="error-icon">📷</span>
        <span class="error-text">加载失败</span>
      </slot>
    </div>

    <!-- 实际图片 -->
    <img
      v-if="src"
      ref="imgRef"
      :src="actualSrc"
      :alt="alt"
      :class="['lazy-img', imgClass]"
      :style="imgStyle"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { lazyLoadImage, preloadImage } from '../utils/imageLoader.js'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  imgClass: {
    type: String,
    default: ''
  },
  // 是否立即加载（不延迟）
  eager: {
    type: Boolean,
    default: false
  },
  // 是否预加载
  preload: {
    type: Boolean,
    default: false
  },
  // 图片比例（用于骨架屏）
  aspectRatio: {
    type: String,
    default: '3/4' // 漫画封面默认比例
  },
  // 背景色
  bgColor: {
    type: String,
    default: '#16213e'
  },
  // 是否显示骨架屏动画
  showSkeleton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['load', 'error', 'loaded'])

const imgRef = ref(null)
const isLoading = ref(true)
const hasError = ref(false)
const actualSrc = ref('')
const observer = ref(null)

const skeletonStyle = computed(() => ({
  aspectRatio: props.aspectRatio,
  backgroundColor: props.bgColor
}))

const placeholderStyle = computed(() => ({
  aspectRatio: props.aspectRatio,
  backgroundColor: props.bgColor
}))

const imgStyle = computed(() => ({
  opacity: isLoading.value ? 0 : 1,
  transition: 'opacity 0.3s ease'
}))

const onLoad = () => {
  isLoading.value = false
  hasError.value = false
  emit('load')
  emit('loaded', props.src)
}

const onError = () => {
  isLoading.value = false
  hasError.value = true
  emit('error', props.src)
}

// 开始加载图片
const startLoading = async () => {
  if (!props.src) {
    hasError.value = true
    isLoading.value = false
    return
  }

  isLoading.value = true
  hasError.value = false

  try {
    if (props.preload) {
      const result = await preloadImage(props.src)
      actualSrc.value = result?.blobUrl || props.src
    } else {
      actualSrc.value = props.src
    }
  } catch {
    actualSrc.value = props.src
  }
}

// 设置 Intersection Observer
const setupObserver = () => {
  if (props.eager || !('IntersectionObserver' in window)) {
    startLoading()
    return
  }

  observer.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startLoading()
        observer.value?.unobserve(entry.target)
      }
    })
  }, {
    rootMargin: '50px', // 提前50px开始加载
    threshold: 0.01
  })

  if (imgRef.value?.parentElement) {
    observer.value.observe(imgRef.value.parentElement)
  }
}

// 监听 src 变化
watch(() => props.src, (newSrc, oldSrc) => {
  if (newSrc !== oldSrc) {
    isLoading.value = true
    hasError.value = false
    actualSrc.value = ''
    startLoading()
  }
})

onMounted(() => {
  if (props.eager) {
    startLoading()
  } else {
    setupObserver()
  }
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.lazy-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.lazy-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  user-select: none;          /* 禁止文本选中 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 骨架屏 */
.skeleton {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  z-index: 1;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 纯色占位 */
.placeholder-solid {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 1;
}

/* 错误占位 */
.error-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #666;
}

.error-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.error-text {
  font-size: 0.85rem;
}

/* 加载完成状态 */
.is-loaded .lazy-img {
  opacity: 1;
}
</style>
