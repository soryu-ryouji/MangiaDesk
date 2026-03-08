<!-- filepath: e:\Projects\MangiaDesk\src\components\reader\ReaderSettings.vue -->
<template>
  <div class="reader-settings" :class="{ hidden: !showSettings }">
    <h3>⚙️ 阅读设置</h3>

    <div class="setting-group">

      <div class="setting-item">
        <label>页面排列</label>
        <select v-model="pageLayoutModel">
          <option value="single">单页</option>
          <option value="double">双页</option>
        </select>
      </div>

      <div class="setting-item">
        <label>点击区域导航</label>
        <input type="checkbox" v-model="clickNavigationModel" />
      </div>

      <div class="setting-item">
        <label>显示操作提示</label>
        <input type="checkbox" v-model="showKeyboardHintModel" />
      </div>

      <div class="setting-item">
        <label>图片适应</label>
        <select v-model="fitModeModel">
          <option value="height">适应高度</option>
          <option value="width">适应宽度</option>
          <option value="original">原始大小</option>
        </select>
      </div>

      <div class="setting-item">
        <label>预加载页数</label>
        <select v-model.number="preloadCountModel">
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
        <div class="shortcut"><kbd>←</kbd><span>上一页</span></div>
        <div class="shortcut"><kbd>→</kbd> <kbd>Space</kbd><span>下一页</span></div>
        <div class="shortcut"><kbd>F</kbd><span>全屏</span></div>
        <div class="shortcut"><kbd>S</kbd><span>设置</span></div>
        <div class="shortcut"><kbd>ESC</kbd><span>退出/返回</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  showSettings: { type: Boolean, default: false },
  pageLayout: { type: String, required: true },
  clickNavigation: { type: Boolean, required: true },
  showKeyboardHint: { type: Boolean, required: true },
  fitMode: { type: String, required: true },
  preloadCount: { type: Number, required: true }
})

const emit = defineEmits([
  'update:pageLayout',
  'update:clickNavigation',
  'update:showKeyboardHint',
  'update:fitMode',
  'update:preloadCount'
])
const pageLayoutModel = computed({
  get: () => props.pageLayout,
  set: (v) => emit('update:pageLayout', v)
})
const clickNavigationModel = computed({
  get: () => props.clickNavigation,
  set: (v) => emit('update:clickNavigation', v)
})
const showKeyboardHintModel = computed({
  get: () => props.showKeyboardHint,
  set: (v) => emit('update:showKeyboardHint', v)
})
const fitModeModel = computed({
  get: () => props.fitMode,
  set: (v) => emit('update:fitMode', v)
})
const preloadCountModel = computed({
  get: () => props.preloadCount,
  set: (v) => emit('update:preloadCount', Number(v))
})
</script>

<style scoped>
.reader-settings { position: fixed; top: 70px; right: 20px; width: 280px; max-height: calc(100vh - 100px); overflow-y: auto; background-color: rgba(22, 33, 62, 0.98); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; z-index: 101; transition: opacity 0.3s, transform 0.3s; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4); }
.reader-settings.hidden { opacity: 0; pointer-events: none; transform: translateY(-10px); }
.reader-settings h3 { margin-bottom: 20px; color: #e94560; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
.setting-group { display: flex; flex-direction: column; gap: 15px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; }
.setting-item label { color: #ccc; font-size: 0.9rem; }
.setting-item select { padding: 8px 12px; background-color: #0f3460; color: #eee; border: 1px solid transparent; border-radius: 6px; cursor: pointer; font-size: 0.9rem; min-width: 100px; }
.setting-item select:focus { outline: none; border-color: #e94560; }
.setting-item input[type="checkbox"] { width: 22px; height: 22px; cursor: pointer; accent-color: #e94560; }
.setting-divider { height: 1px; background-color: rgba(255, 255, 255, 0.1); margin: 20px 0; }
.keyboard-shortcuts h4 { color: #888; font-size: 0.9rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
.shortcut-list { display: flex; flex-direction: column; gap: 10px; }
.shortcut { display: flex; align-items: center; gap: 12px; }
.shortcut kbd { padding: 4px 10px; background-color: #0f3460; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #eee; border: 1px solid rgba(255, 255, 255, 0.1); }
.shortcut span { color: #888; font-size: 0.85rem; }

@media (max-width: 768px) {
  .reader-settings { right: 10px; left: 10px; width: auto; top: 65px; }
}
</style>
