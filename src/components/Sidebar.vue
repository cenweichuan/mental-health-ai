<template>
  <el-aside :width="isCollapse ? '64px' : '264px'">

    <el-menu
      router
      :collapse="isCollapse"
      :collapse-transition="false"
      :default-active="$route.path"
      class="menu-style"
    >

      <!-- logo -->
      <div class="brand">
        <el-image
          :src="iconURL"
          style="width:50px;height:50px;margin-right:10px;"
        />

        <div v-show="!isCollapse">
          <h3>心理AI助手</h3>
          <p>管理后台</p>
        </div>
      </div>

      <!-- menu -->
      <el-menu-item index="/back/dashboard">
        <el-icon><PieChart /></el-icon>
        <span>数据分析</span>
      </el-menu-item>

      <el-menu-item index="/back/knowledge">
        <el-icon><ChatLineSquare /></el-icon>
        <span>知识文章</span>
      </el-menu-item>

      <el-menu-item index="/back/consultations">
        <el-icon><Message /></el-icon>
        <span>咨询记录</span>
      </el-menu-item>

      <el-menu-item index="/back/emotional">
        <el-icon><User /></el-icon>
        <span>情绪日志</span>
      </el-menu-item>

    </el-menu>

  </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

import {
  PieChart,
  ChatLineSquare,
  Message,
  User
} from '@element-plus/icons-vue'

const route = useRoute()
const adminStore = useAdminStore()

const isCollapse = computed(() => adminStore.isCollapse)

const iconURL = new URL('@/assets/images/机器人.png', import.meta.url).href
</script>

<style scoped>
.menu-style {
  height: 100vh;
}

.brand {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
</style>