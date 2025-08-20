import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/ai-config',
      name: 'ai-config',
      component: () => import('../views/AIConfigView.vue'),
    },
    {
      path: '/writing',
      name: 'writing',
      component: () => import('../views/WritingView.vue'),
    },
    {
      path: '/content-opt',
      name: 'content-opt',
      component: () => import('../views/ContentOptView.vue'),
    },
  ],
})

export default router