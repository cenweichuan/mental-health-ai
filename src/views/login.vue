<template>
  <div class="container">
    <div class="title">
      <div class="back-home" @click="goHome">
        <el-icon>
          <Back />
        </el-icon>
        <span>返回首页</span>
      </div>

      <div class="title-text">
        <h2>登录您的账户</h2>
        <p>请输入您的登录信息</p>
      </div>
    </div>

    <div class="form-container">
      <el-form
        ref="ruleFormRef"
        :model="formData"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="用户名或邮箱" prop="username">
          <el-input
            v-model="formData.username"
            size="large"
            placeholder="请输入用户名或邮箱"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            size="large"
            placeholder="请输入密码"
            type="password"
            show-password
          />
        </el-form-item>

        <el-button
          class="btn"
          type="primary"
          size="large"
          @click="submitForm"
          :loading="loading"
        >
          登录
        </el-button>
      </el-form>

      <div class="footer">
        <p>
          还没有账号？
          <router-link to="/auth/register">
            去注册
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back } from '@element-plus/icons-vue'

import { login } from '@/api/admin'

const router = useRouter()

// 表单实例
const ruleFormRef = ref()
const loading = ref(false)

// 表单数据
const formData = reactive({
  username: '',
  password: ''
})

// 表单校验规则
const rules = reactive({
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: 'blur'
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur'
    }
  ]
})

// 返回首页
const goHome = () => {
  router.push('/')
}

// 登录提交
const submitForm = async () => {
  if (!ruleFormRef.value) return

  try {
    loading.value = true
    
    // 表单校验
    await ruleFormRef.value.validate()

    // 发送登录请求
    const res = await login(formData)

    console.log('登录返回数据:', res)

    // 修复：拦截器已经返回了 data，所以 res 就是 { code, msg, data }
    // 兼容字符串类型的 code
    if (res.code != 200) {
      ElMessage.error(res.msg || res.message || '登录失败')
      return
    }

    // token 不存在
    if (!res.data?.token) {
      ElMessage.error('登录凭证获取失败')
      return
    }

    // 保存 token
    localStorage.setItem('token', res.data.token)

    // 保存用户信息
    if (res.data.userInfo) {
      localStorage.setItem(
        'userInfo',
        JSON.stringify(res.data.userInfo)
      )
    }

    ElMessage.success('登录成功')

    // 根据用户角色跳转
    if (res.data.userInfo.userType === 2) {
      // 管理员
      router.push('/back/dashboard')
    } else {
      // 普通用户
      router.push('/')
    }

  } catch (error) {
    console.error('登录失败:', error)
    
    // 只有非表单验证错误才弹窗
    if (error?.fields === undefined) {
      ElMessage.error(error?.msg || error?.message || '登录失败，请检查用户名或密码')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 384px;

  .title {

    .back-home {
      margin-bottom: 60px;
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #666;
      transition: color 0.3s;

      &:hover {
        color: #409EFF;
      }

      span {
        margin-left: 5px;
      }
    }

    .title-text {
      text-align: center;

      h2 {
        font-size: 24px;
        margin-bottom: 10px;
        font-weight: 600;
      }

      p {
        font-size: 14px;
        color: #6b7280;
      }
    }
  }

  .form-container {
    margin-top: 30px;

    .btn {
      margin-top: 40px;
      width: 100%;
    }

    .footer {
      margin-top: 20px;
      text-align: center;

      a {
        color: #409EFF;
        text-decoration: none;
      }
    }
  }
}
</style>