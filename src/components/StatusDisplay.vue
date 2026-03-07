<template>
  <div v-if="loading" class="status-container loading">
    <div class="spinner"></div>
    <p>加载中...</p>
  </div>

  <div v-else-if="error" class="status-container error">
    <p>加载失败: {{ error }}</p>
    <button @click="$emit('retry')" class="action-btn">重试</button>
  </div>

  <div v-else-if="isEmpty" class="status-container empty">
    <div class="empty-icon">📭</div>
    <p>{{ isSearching ? '没有找到匹配的漫画' : '暂无漫画' }}</p>
    <button v-if="isSearching" @click="$emit('clearSearch')" class="action-btn">清除搜索</button>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean,
  error: String,
  isEmpty: Boolean,
  isSearching: Boolean,
})
defineEmits(['retry', 'clearSearch'])
</script>

<style scoped>
.status-container {
  text-align: center;
  padding: 80px 20px;
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
  color: #e94560;
}

.action-btn {
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

.action-btn:hover {
  background-color: #c73e54;
  transform: translateY(-2px);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 15px;
  opacity: 0.5;
}
</style>
