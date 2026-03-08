<!-- filepath: e:\Projects\MangiaDesk\src\components\reader\modes\SinglePageMode.vue -->
<template>
  <div class="single-page-container" :class="{ loading: isImageLoading(currentPageImage) }">
    <img
      v-if="currentPageImage"
      :src="currentPageImage"
      :alt="`Page ${currentPage}`"
      class="manga-page single"
      @load="$emit('image-load', currentPageImage)"
      @error="$emit('image-error', $event)"
    />
    <div v-if="isImageLoading(currentPageImage)" class="image-loading">
      <div class="spinner small"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentPageImage: { type: String, default: null },
  currentPage: { type: Number, required: true },
  isImageLoading: { type: Function, required: true }
})

defineEmits(['image-load', 'image-error'])
</script>

<style scoped>
.single-page-container { position: relative; display: flex; justify-content: center; align-items: center; height: 100%; max-height: calc(100vh - 160px); }
.single-page-container.loading::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 4px; }
.manga-page.single { max-height: calc(100vh - 160px); max-width: 95vw; width: auto; object-fit: contain; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
.image-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1; }
.spinner.small { width: 30px; height: 30px; border: 2px solid #333; border-top-color: #e94560; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
