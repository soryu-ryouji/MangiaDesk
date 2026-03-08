<!-- filepath: e:\Projects\MangiaDesk\src\components\reader\modes\DoublePageMode.vue -->
<template>
  <div class="double-page-container">
    <div v-if="showLeftPage" class="page-slot left" :class="{ loading: isImageLoading(leftPageImage) }">
      <img
        v-if="leftPageImage"
        :src="leftPageImage"
        alt="Left Page"
        class="manga-page"
        @load="$emit('image-load', leftPageImage)"
        @error="$emit('image-error', $event)"
      />
      <div v-if="isImageLoading(leftPageImage)" class="image-loading">
        <div class="spinner small"></div>
      </div>
    </div>
    <div v-else class="page-slot left placeholder"></div>

    <div v-if="showRightPage" class="page-slot right" :class="{ loading: isImageLoading(rightPageImage) }">
      <img
        v-if="rightPageImage"
        :src="rightPageImage"
        alt="Right Page"
        class="manga-page"
        @load="$emit('image-load', rightPageImage)"
        @error="$emit('image-error', $event)"
      />
      <div v-if="isImageLoading(rightPageImage)" class="image-loading">
        <div class="spinner small"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showLeftPage: { type: Boolean, required: true },
  showRightPage: { type: Boolean, required: true },
  leftPageImage: { type: String, default: null },
  rightPageImage: { type: String, default: null },
  isImageLoading: { type: Function, required: true }
})

defineEmits(['image-load', 'image-error'])
</script>

<style scoped>
.double-page-container { display: flex; justify-content: center; align-items: center; gap: 4px; max-width: 95vw; height: 100%; max-height: calc(100vh - 160px); }
.page-slot { flex: 0 0 auto; display: flex; justify-content: center; align-items: center; position: relative; height: 100%; }
.page-slot.loading::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 4px; }
.page-slot.placeholder { width: 40vw; max-width: 350px; height: 100%; max-height: calc(100vh - 160px); aspect-ratio: 3/4; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 4px; }
.page-slot .manga-page { max-height: calc(100vh - 160px); max-width: 46vw; width: auto; object-fit: contain; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
.image-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1; }
.spinner.small { width: 30px; height: 30px; border: 2px solid #333; border-top-color: #e94560; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
