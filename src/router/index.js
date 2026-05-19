import { createRouter, createWebHistory } from 'vue-router'
import BackendLayout from '@/components/BackendLayout.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import FrontendLayout from '@/components/FrontendLayout.vue'

const routes = [
  // 前端路由（不需要登录）
  {
    path: '/',
    component: FrontendLayout,
    children: [
      {
        path: '',
        component: () => import('@/views/home.vue'),
      },
      {
        path: 'consultation',
        component: () => import('@/views/consultation.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'emotionDiary',
        component: () => import('@/views/emotionDiary.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'frontendKnowledge',
        component: () => import('@/views/frontendKnowledge.vue'),
      },{
        path: 'article/:id',
        component: () => import('@/views/articleDetail.vue'),
      }
    ]
  },

  // 后台管理路由（需要管理员权限）
  {
    path: '/back',
    component: BackendLayout,
    redirect: '/back/dashboard',
    meta: { requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard.vue'),
        meta: { title: '数据分析', icon: 'PieChart' }
      },
      {
        path: 'knowledge',
        component: () => import('@/views/knowledge.vue'),
        meta: { title: '知识文章', icon: 'ChatLineSquare' }
      },
      {
        path: 'consultations',
        component: () => import('@/views/consultations.vue'),
        meta: { title: '咨询记录', icon: 'Message' }
      },
      {
        path: 'emotional',
        component: () => import('@/views/emotional.vue'),
        meta: { title: '情绪日志', icon: 'User' }
      }
    ]
  },

  // 认证路由
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        component: () => import('@/views/login.vue')
      },
      {
        path: 'register',
        component: () => import('@/views/register.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userInfoStr = localStorage.getItem('userInfo')
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null

  // 如果要访问管理员后台
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    // 未登录
    if (!token || !userInfo) {
      return next('/auth/login')
    }
    // 已登录但不是管理员
    if (userInfo.userType !== 2) {
      // 跳转到首页或显示无权限提示
      return next('/')
    }
    // 是管理员，允许访问
    return next()
  }

  // 如果要访问需要登录的前台页面（如咨询、情绪日记）
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      return next('/auth/login')
    }
    return next()
  }

  // 其他情况正常访问
  next()
})

export default router