<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <router-link to="/" class="logo">📚 Manga Reader</router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link">首页</router-link>
        </nav>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <div class="container">
        <p>Powered by MangaServer</p>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #1a1a2e;
  color: #eee;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  background-color: #16213e;
  padding: 15px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #e94560;
  text-decoration: none;
}

.nav-link {
  color: #eee;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #0f3460;
}

.main {
  flex: 1;
  padding: 20px 0;
}

.footer {
  background-color: #16213e;
  padding: 20px 0;
  text-align: center;
  color: #888;
}
</style>
