<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <el-icon class="error-icon" size="64"><WarningFilled /></el-icon>
      <h2>出现了一些问题</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <el-button type="primary" @click="retry">重试</el-button>
        <el-button @click="goHome">返回首页</el-button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((error: Error) => {
  console.error('ErrorBoundary caught an error:', error)
  hasError.value = true
  errorMessage.value = error.message || '未知错误'
  
  ElMessage.error({
    message: '页面出现错误，请稍后重试',
    duration: 3000
  })
  
  return false
})

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  // 重新加载当前路由
  router.go(0)
}

const goHome = () => {
  hasError.value = false
  errorMessage.value = ''
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-content h2 {
  color: #2c3e50;
  margin-bottom: 16px;
  font-size: 24px;
}

.error-message {
  color: #7f8c8d;
  margin-bottom: 24px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>