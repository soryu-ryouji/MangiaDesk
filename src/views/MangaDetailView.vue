<template>
  <div class="manga-detail">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>加载失败: {{ error }}</p>
        <button @click="loadMangaInfo" class="retry-btn">重试</button>
      </div>

      <div v-else-if="mangaInfo" class="manga-content">
        <div class="manga-header">
          <div class="cover-section">
            <img
              v-if="mangaInfo.cover_url"
              :src="mangaInfo.cover_url"
              :alt="mangaInfo.title"
              class="cover"
            />
            <div v-else class="cover-placeholder">
              <span class="placeholder-icon">📖</span>
            </div>
          </div>

          <div class="info-section">
            <h1 class="manga-title">{{ mangaInfo.title }}</h1>
            <p class="manga-meta">
              共 {{ mangaInfo.chapters?.length || 0 }} 章节
            </p>
            <p v-if="mangaInfo.chapters?.length > 0" class="latest-chapter">
              最新: {{ mangaInfo.chapters[mangaInfo.chapters.length - 1]?.title }}
            </p>
          </div>
        </div>

        <div class="chapters-section">
          <h2 class="section-title">章节列表</h2>

          <div v-if="mangaInfo.chapters?.length === 0" class="empty-chapters">
            暂无章节
          </div>

          <div v-else class="chapters-grid">
            <button
              v-for="chapter in sortedChapters"
              :key="chapter.title"
              class="chapter-btn"
              @click="readChapter(chapter.title)"
            >
              {{ chapter.title }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMangaInfo } from '../api/manga'

const props = defineProps({
  mangaName: {
    type: String,
    required: true
  }
})

const router = useRouter()
const mangaInfo = ref(null)
const loading = ref(false)
const error = ref(null)

const sortedChapters = computed(() => {
  if (!mangaInfo.value?.chapters) return []
  return [...mangaInfo.value.chapters].sort((a, b) => {
    // 尝试按数字排序
    const numA = parseFloat(a.title.match(/\d+\.?\d*/)?.[0] || 0)
    const numB = parseFloat(b.title.match(/\d+\.?\d*/)?.[0] || 0)
    if (numA && numB) return numA - numB
    return a.title.localeCompare(b.title)
  })
})

const loadMangaInfo = async () => {
  loading.value = true
  error.value = null
  try {
    mangaInfo.value = await getMangaInfo(props.mangaName)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const readChapter = (chapterTitle) => {
  router.push(`/manga/${encodeURIComponent(props.mangaName)}/${encodeURIComponent(chapterTitle)}`)
}

onMounted(loadMangaInfo)
</script>

<style scoped>
.manga-detail {
  padding: 20px 0;
}

.loading {
  text-align: center;
  padding: 60px 20px;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 60px 20px;
  color: #e94560;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 30px;
  background-color: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.manga-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.manga-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  padding: 30px;
  background-color: #16213e;
  border-radius: 12px;
}

.cover-section {
  flex-shrink: 0;
}

.cover {
  width: 200px;
  height: 280px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.cover-placeholder {
  width: 200px;
  height: 280px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.info-section {
  flex: 1;
}

.manga-title {
  font-size: 2rem;
  margin-bottom: 15px;
  color: #fff;
}

.manga-meta {
  color: #888;
  margin-bottom: 10px;
}

.latest-chapter {
  color: #e94560;
  font-size: 0.95rem;
}

.chapters-section {
  padding: 30px;
  background-color: #16213e;
  border-radius: 12px;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: #fff;
}

.empty-chapters {
  text-align: center;
  padding: 40px;
  color: #888;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.chapter-btn {
  padding: 12px 16px;
  background-color: #0f3460;
  color: #eee;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s, transform 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-btn:hover {
  background-color: #e94560;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .manga-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .cover, .cover-placeholder {
    width: 150px;
    height: 210px;
  }

  .manga-title {
    font-size: 1.5rem;
  }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
