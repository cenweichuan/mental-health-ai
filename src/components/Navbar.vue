<template>
  <div class="navbar">
    <div class="flex-box">
        <el-button @click="handleCollapse">
            <el-icon><Expand /></el-icon>
        </el-button>
        <p class="page-title">{{route.meta.title}}</p>
    </div>
    <div class="flex-box">
        <el-dropdown @command="handleCommand">
            <div class="flex-box">
                <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
                <p class="user-name">admin</p>
                <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useRouter, useRoute } from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'  // ✅ 修改这里
import { logout } from '@/api/admin'

const router = useRouter()
const route = useRoute()

const handleCommand=(command)=>{
    console.log(command)
    if(command==='logout'){
        //处理登出逻辑
        ElMessageBox.confirm('确定退出登录吗？', '提示', {  // ✅ 修改这里
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            logout().then(() => {
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                router.push('/auth/login')
            })
        }).catch(() => {
            // 用户点击取消的处理（可选）
        })
    }
}

const handleCollapse=()=>{
    useAdminStore().toggleCollapse()
}
</script>

<style lang="scss" scoped>
.navbar {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    background-color: #f5f7fa;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid #e4e7ed;
    .flex-box {
        display: flex;
        align-items: center;
        justify-content: center;
        .page-title {
            font-size: 26px;
            margin-left: 20px;
            font-weight: bold;
            color: #1f2937;
        }
    }
}
</style>