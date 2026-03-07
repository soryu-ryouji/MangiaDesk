<template>
  <div class="manga-list">
    <div
      v-for="manga in mangaList"
      :key="manga.title"
      class="manga-list-item"
      @click="$emit('goToManga', manga.title)"
    >
      <div class="list-cover-wrapper">
        <LazyImage
          :src="manga.cover_url"
          :alt="manga.title"
          :aspect-ratio="'3/4'"
          img-class="list-cover"
          :eager="true"
        />
      </div>
      <div class="list-info">
        <h3 class="list-title">{{ manga.title }}</h3>
        <p class="list-chapters">{{ manga.chapters?.length || 0 }} 章节</p>
        <p v-if="manga.chapters?.length > 0" class="list-latest">
          最新: {{ manga.chapters[manga.chapters.length - 1]?.title }}
        </p>
      </div>
      <div class="list-arrow">→</div>
    </div>
  </div>
</template>

<script setup>
import LazyImage from './LazyImage.vue'

defineProps({
  mangaList: Array
})
defineEmits(['goToManga'])
</script>

<style scoped>
.manga-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manga-list-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 20px;
  background-color: #16213e;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.manga-list-item:hover {
  background-color: #1e2d4d;
  transform: translateX(5px);
}

.list-cover-wrapper {
  flex-shrink: 0;
  width: 60px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.list-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-title {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-chapters {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 4px;
}

.list-latest {
  font-size: 0.8rem;
  color: #e94560;
}

.list-arrow {
  font-size: 1.5rem;
  color: #888;
  transition: color 0.3s;
}

.manga-list-item:hover .list-arrow {
  color: #e94560;
}

@media (max-width: 768px) {
  .manga-list-item {
    padding: 12px 15px;
  }

  .list-cover-wrapper {
    width: 50px;
    height: 65px;
  }

  .list-title {
    font-size: 1rem;
  }
}
</style>
