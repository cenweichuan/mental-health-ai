<template>
  <div class="backend-layout">
    <el-container class="main-container">

      <Sidebar />

      <el-container>
        <el-header>
          <Navbar />
        </el-header>

        <el-main class="content-container">
          <router-view />
        </el-main>

      </el-container>

    </el-container>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.content-container {
  padding: 20px;
  background: #f5f7fa;
  height: calc(100vh - 74px);
}
</style>