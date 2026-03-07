<template>
  <div class="manga-card" @click="$emit('click')">
    <div class="cover-wrapper">
      <LazyImage
        :src="manga.cover_url"
        :alt="manga.title"
        :aspect-ratio="'3/4'"
        img-class="cover"
        :eager="true"
        @loaded="onImageLoaded"
        @error="onImageError"
      />
      <!-- 底部渐变遮罩 -->
      <div class="cover-overlay"></div>

      <!-- 章节数量角标 -->
      <div v-if="manga.chapters?.length" class="chapter-badge">
        {{ manga.chapters.length }} 章
      </div>
    </div>
    <!-- 名称放在底部 -->
    <div class="info-section">
      <h3 class="title">{{ manga.title }}</h3>
      <p class="chapter-count">{{ manga.chapters?.length || 0 }} 章节</p>
    </div>
  </div>
</template>

<script setup>
import LazyImage from './LazyImage.vue'

defineProps({
  manga: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const onImageLoaded = () => {
  // 图片加载完成
}

const onImageError = () => {
  // 图片加载失败
}
</script>

<style scoped>
.manga-card {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 12px;
  overflow: hidden;
  background-color: #16213e;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.manga-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

.cover-wrapper {
  position: relative;
  aspect-ratio: 3/4;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* 封面图片通过 LazyImage 组件处理 */
:deep(.cover) {
  transition: transform 0.3s;
}

.manga-card:hover :deep(.cover) {
  transform: scale(1.05);
}

/* 底部渐变遮罩 */
.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(
    to top,
    rgba(22, 33, 62, 1) 0%,
    rgba(22, 33, 62, 0.8) 30%,
    rgba(22, 33, 62, 0.4) 60%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* 章节角标 */
.chapter-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  background-color: rgba(233, 69, 96, 0.9);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
  z-index: 2;
  backdrop-filter: blur(4px);
}

/* 信息区域 - 放在封面底部 */
.info-section {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 12px 12px;
  z-index: 2;
}

.title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.chapter-count {
  font-size: 0.8rem;
  color: #aaa;
}
</style>
