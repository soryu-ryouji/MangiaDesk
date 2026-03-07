<template>
  <div class="home">
    <HeroBanner v-model:searchQuery="searchQuery" />

    <div class="container">
      <div class="stats-bar" v-if="!loading && !error && mangaList.length > 0">
        <div class="stat-item">
          <span class="stat-number">{{ mangaList.length }}</span>
          <span class="stat-label">部漫画</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ totalChapters }}</span>
          <span class="stat-label">个章节</span>
        </div>
      </div>

      <StatusDisplay
        :loading="loading"
        :error="error"
        :is-empty="filteredMangaList.length === 0"
        :is-searching="!!searchQuery"
        @retry="loadMangaList"
        @clear-search="searchQuery = ''"
      />

      <div v-if="!loading && !error && filteredMangaList.length > 0" class="manga-section">
        <div class="section-header">
          <h2 class="section-title">
            {{ searchQuery ? `搜索结果 (${filteredMangaList.length})` : '全部漫画' }}
          </h2>
          <div class="view-toggle">
            <button
              :class="['view-btn', { active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
              title="网格视图"
            >
              ⊞
            </button>
            <button
              :class="['view-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
              title="列表视图"
            >
              ☰
            </button>
          </div>
        </div>

        <div v-if="viewMode === 'grid'" class="manga-grid">
          <MangaCard
            v-for="manga in filteredMangaList"
            :key="manga.title"
            :manga="manga"
            @click="goToManga(manga.title)"
          />
        </div>

        <MangaListView v-else :manga-list="filteredMangaList" @go-to-manga="goToManga" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMangaList } from '../api/manga'
import MangaCard from '../components/MangaCard.vue'
import HeroBanner from '../components/HeroBanner.vue'
import MangaListView from '../components/MangaListView.vue'
import StatusDisplay from '../components/StatusDisplay.vue'

const router = useRouter()
const mangaList = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const viewMode = ref('grid')

const filteredMangaList = computed(() => {
  if (!searchQuery.value.trim()) return mangaList.value
  const query = searchQuery.value.toLowerCase()
  return mangaList.value.filter(manga =>
    manga.title.toLowerCase().includes(query)
  )
})

const totalChapters = computed(() => {
  return mangaList.value.reduce((sum, manga) => sum + (manga.chapters?.length || 0), 0)
})

const loadMangaList = async () => {
  loading.value = true
  error.value = null
  try {
    mangaList.value = await getMangaList()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const goToManga = (title) => {
  router.push(`/manga/${encodeURIComponent(title)}`)
}

onMounted(loadMangaList)
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.container {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 25px;
  margin: 20px 0 30px;
  background-color: #16213e;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #e94560;
}

.stat-label {
  font-size: 0.9rem;
  color: #888;
}

/* 内容区域 */
.manga-section {
  padding-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-title {
  font-size: 1.4rem;
  color: #fff;
}

.view-toggle {
  display: flex;
  gap: 8px;
  background-color: #16213e;
  padding: 4px;
  border-radius: 8px;
}

.view-btn {
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #888;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn:hover {
  color: #fff;
}

.view-btn.active {
  background-color: #e94560;
  color: #fff;
}

/* 网格视图 */
.manga-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 25px;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-bar {
    gap: 30px;
    padding: 20px;
  }

  .stat-number {
    font-size: 1.6rem;
  }

  .manga-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
