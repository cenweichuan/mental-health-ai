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
        <h2>用户注册</h2>
      </div>
    </div>

    <div class="form-container">
      <el-form 
        ref="registerForm" 
        :model="formData" 
        :rules="rules" 
        label-position="left"
        label-width="80px"
        size="default"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入昵称（可选）" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号（可选）" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="formData.confirmPassword" type="password" show-password placeholder="请再次输入密码" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="formData.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
            <el-option label="其他" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-button type="primary" class="btn" @click="handleRegister" :loading="loading">注册</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Back } from '@element-plus/icons-vue';
import { register } from '../api/admin';

const router = useRouter();
const registerForm = ref(null);
const loading = ref(false);

const formData = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  password: '',
  confirmPassword: '',
  gender: 0,
  userType: 1
});

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'));
    return;
  }
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'));
    return;
  }
  callback();
};

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度必须在 3-20 之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度必须在 6-20 之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: ['blur', 'change'] },
    { validator: validateConfirmPassword, trigger: ['blur', 'change'] }
  ]
});

// 修复：用 catch 包裹 validateField，避免未捕获的 Promise 错误
watch(
  () => formData.password,
  () => {
    if (formData.confirmPassword) {
      nextTick(() => {
        registerForm.value?.validateField('confirmPassword').catch(() => {});
      });
    }
  }
);

// 返回首页
const goHome = () => {
  router.push('/')
};

const handleRegister = async () => {
  if (!registerForm.value) return;

  try {
    loading.value = true;
    await registerForm.value.validate();
    const res = await register(formData);
    
    // 兼容字符串类型的 code
    if (res.code == 200) {
      ElMessage.success('注册成功，请登录');
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } else {
      ElMessage.error(res.msg || res.message || '注册失败');
    }
  } catch (error) {
    // 如果是表单验证失败，Element Plus 会自动显示错误信息
    // 只有其他错误才弹窗提示
    if (error?.fields === undefined && error?.message) {
      ElMessage.error(error.message || '注册失败');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.container {
  width: 450px; /* 稍微增加宽度以适应横向布局 */

  .title {
    .back-home {
      margin-bottom: 30px;
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
        font-size: 28px; /* 稍微调小标题 */
        margin-bottom: 8px;
      }

      p {
        font-size: 14px;
        color: #6b7280;
      }
    }
  }

  .form-container {
    margin-top: 30px;

    /* 调整表单项间距 */
    :deep(.el-form-item) {
      margin-bottom: 18px;
    }

    /* 调整标签样式 */
    :deep(.el-form-item__label) {
      font-size: 14px;
      color: #333;
      font-weight: 500;
      padding-right: 12px;
    }

    /* 输入框样式微调 */
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #dcdfe6 inset;
    }

    :deep(.el-input__inner) {
      font-size: 14px;
    }

    .btn {
      margin-top: 24px;
      width: 100%;
      height: 40px;
      font-size: 16px;
    }
  }
}

/* 响应式调整：小屏幕时切换为顶部标签 */
@media (max-width: 480px) {
  .container {
    width: 100%;
    padding: 0 20px;

    .form-container {
      :deep(.el-form-item) {
        display: block;
        
        .el-form-item__label {
          width: 100% !important;
          text-align: left;
          padding-bottom: 8px;
        }
        
        .el-form-item__content {
          margin-left: 0 !important;
        }
      }
    }
  }
}
</style>