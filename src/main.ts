import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 全局错误处理
window.addEventListener('error', (e) => {
  if (e.message.includes('ResizeObserver loop completed')) {
    e.stopImmediatePropagation()
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
