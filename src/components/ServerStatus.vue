<template>
  <div class="server-status" :class="{ connected }">
    <span class="status-dot"></span>
    <span class="status-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  connected: boolean
  address: string
}>()

const text = computed(() => {
  if (props.connected && props.address) return props.address
  return '未连接服务器'
})
</script>

<style scoped>
.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background-color: #2d2d44;
  font-size: 0.85rem;
  color: #888;
  transition: all 0.3s;
}

.server-status.connected {
  background-color: #1a4d1a;
  color: #4caf50;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #888;
  transition: background-color 0.3s;
}

.server-status.connected .status-dot {
  background-color: #4caf50;
  box-shadow: 0 0 8px #4caf50;
}

.status-text {
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
