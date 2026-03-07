<template>
  <div class="hero-banner">
    <div class="hero-content">
      <h1 class="hero-title">Mangia Web</h1>
      <p class="hero-subtitle">享受沉浸式漫画阅读体验</p>

      <div class="search-box">
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          type="text"
          placeholder="搜索漫画..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>
    <div class="hero-gradient"></div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: String
})
defineEmits(['update:searchQuery'])
</script>

<style scoped>
.hero-banner {
  position: relative;
  padding: 60px 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #888;
  margin-bottom: 30px;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(233, 69, 96, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(15, 52, 96, 0.3) 0%, transparent 50%);
  pointer-events: none;
}

.search-box {
  position: relative;
  max-width: 400px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 15px 50px 15px 20px;
  font-size: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  color: #fff;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(233, 69, 96, 0.5);
}

.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .hero-banner {
    padding: 40px 20px;
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
