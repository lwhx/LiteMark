<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();

const apiBaseRaw =
  (typeof window !== 'undefined'
    ? (window as { __APP_API_BASE_URL__?: string }).__APP_API_BASE_URL__
    : '') ?? '';
const apiBase = apiBaseRaw.replace(/\/$/, '');

const form = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 位', trigger: 'blur' }
  ]
};

const formRef = ref();
const loading = ref(false);

// 处理登录
async function handleLogin() {
  if (!formRef.value) return;

  // 表单验证
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }

    loading.value = true;

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || '登录失败');
      }

      const result = (await response.json()) as { token: string; username: string };
      
      // 保存 token 和用户名
      localStorage.setItem('bookmark_token', result.token);
      localStorage.setItem('bookmark_username', result.username);
      
      ElMessage.success('登录成功');
      
      // 返回登录前访问的后台页面
      const redirect = typeof route.query.redirect === 'string'
        ? route.query.redirect
        : '/admin';
      router.push(redirect);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '登录失败，请检查用户名和密码';
      ElMessage.error(errorMsg);
    } finally {
      loading.value = false;
    }
  });
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <el-card class="login-card" shadow="hover">
        <template #header>
          <div class="login-header">
            <img src="/LiteMark64.png" alt="LiteMark Logo" class="logo" />
            <h1 class="title">LiteMark</h1>
            <p class="subtitle">轻量书签管理系统</p>
          </div>
        </template>

        <p class="intro">
          轻量、快速、跨设备同步的书签管理系统。<br />
          登录后即可同步并管理你的专属云端书签。
        </p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="0"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :disabled="loading"
              clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :disabled="loading"
              show-password
              clearable
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e8f0fe 0%, #f0f2f5 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰动画 */
.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(26, 115, 232, 0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: float 20s linear infinite;
  pointer-events: none;
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(50px, 50px) rotate(360deg);
  }
}

/* 光晕效果 */
.login-page::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(26, 115, 232, 0.1) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  animation: pulse 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.login-container {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card {
  border-radius: 16px;
  border: none;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 0 8px 30px rgba(26, 115, 232, 0.15);
  background: #ffffff;
}

.login-card :deep(.el-card__header) {
  padding: 32px 32px 24px;
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  border-bottom: none;
}

.login-card :deep(.el-card__body) {
  padding: 32px;
}

.login-header {
  text-align: center;
  color: #ffffff;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.subtitle {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 400;
}

.intro {
  text-align: center;
  margin: 0 0 28px 0;
  font-size: 0.9rem;
  color: #606266;
  line-height: 1.6;
  padding: 0 8px;
}

.login-form {
  margin-top: 8px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.login-form :deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #1a73e8 inset;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4);
  background: linear-gradient(135deg, #1557b0 0%, #357ae8 100%);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    max-width: 100%;
  }

  .login-card :deep(.el-card__header) {
    padding: 24px 24px 20px;
  }

  .login-card :deep(.el-card__body) {
    padding: 24px;
  }

  .title {
    font-size: 1.75rem;
  }

  .logo {
    width: 64px;
    height: 64px;
    margin-bottom: 12px;
  }

  .intro {
    font-size: 0.85rem;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .intro {
    color: #909399;
  }
}
</style>
