import { createApp } from 'vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// 只创建一个实例
const app = createApp(App)

// 创建 Pinia 实例
const pinia = createPinia()

// 注册路由
app.use(router)

// 注册 Pinia
app.use(pinia)

// 注册 Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 最后挂载
app.mount('#app')