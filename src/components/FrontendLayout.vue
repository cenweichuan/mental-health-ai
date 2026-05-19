<template>
  <div class="frontend-layout">
    <header class="navbar-wrapper">
      <div class="navbar-container">
        <div class="brand-section">
          <el-image :src="iconUrl" class="brand-logo" alt="心理健康AI助手" style="width: 50px; height: 50px;" />
          <h1 class="brand-name">心理健康AI助手</h1>
        </div>

        <nav class="nav-section">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/consultation" class="nav-link" v-if="isLoginedIn">AI咨询</router-link>
          <router-link to="/emotionDiary" class="nav-link" v-if="isLoginedIn">情绪日记</router-link>
          <router-link to="/frontendKnowledge" class="nav-link">知识库</router-link>
          <el-button v-if="isLoginedIn" class="logout-btn" @click="handleLogout">退出登录</el-button>
          <template v-else>
            <router-link to="/auth/login" class="nav-link">登录</router-link>
            <router-link to="/auth/register" class="nav-link">
              <el-button type="primary">注册</el-button>
            </router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="main-container">
      <router-view />
    </main>

    <footer class="footer-container">
      <div class="footer-bottom">&copy; 2026 心理健康AI助手. All rights reserved.</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '@/api/admin'

const router = useRouter()

const iconUrl = new URL('@/assets/images/机器人.png', import.meta.url).href

const isLoginedIn = ref(false)

onMounted(() => {
  isLoginedIn.value = localStorage.getItem('token') !== null
})

// 退出登录
const handleLogout = () => {
  logout().then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/auth/login')
  })
}
</script>

<style lang="scss" scoped>
.frontend-layout {
  background-color: #fff;

  .navbar-container {
    max-width: 1200px;
    height: 100%;
    margin: 0 auto;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .brand-section {
      display: flex;
      align-items: center;

      .brand-name {
        margin-left: 10px;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }
    }

    .nav-section {
      display: flex;
      align-items: center;
      gap: 40px;

      .nav-link {
        color: #4b5563;
        font-size: 16px;
        font-weight: 500;

        &:hover {
          color: #4A90E2;
        }
      }
    }
  }

  .footer-container {
    background: #1f2937;
    color: white;
    padding: 15px 0;
    margin-top: auto;

    .footer-bottom {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 10px;
      text-align: center;
    }
  }
}
</style>