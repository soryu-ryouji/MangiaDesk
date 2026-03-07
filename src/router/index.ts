import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MangaDetailView from '../views/MangaDetailView.vue'
import ReaderView from '../views/ReaderView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/manga/:mangaName',
    name: 'MangaDetail',
    component: MangaDetailView,
    props: true
  },
  {
    path: '/manga/:mangaName/:chapterName',
    name: 'Reader',
    component: ReaderView,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
