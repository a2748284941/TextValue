<template>
  <div id="app">
    <ErrorBoundary>
      <el-container>
        <el-header class="app-header">
          <div class="header-content">
            <div class="logo">
              <h1>TextValue AI Writer</h1>
              <span class="subtitle">智能文章生成器</span>
            </div>
            <el-menu
              :default-active="activeIndex"
              class="header-menu"
              mode="horizontal"
              @select="handleSelect"
            >
              <el-menu-item index="/">首页</el-menu-item>
              <el-menu-item index="/ai-config">AI配置</el-menu-item>
              <el-menu-item index="/writing">智能写作</el-menu-item>
              <el-menu-item index="/content-opt">内容优化</el-menu-item>
              <el-menu-item index="/about">关于</el-menu-item>
            </el-menu>
          </div>
        </el-header>
        <el-main class="app-main">
          <Transition name="fade" mode="out-in">
            <RouterView />
          </Transition>
        </el-main>
      </el-container>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ErrorBoundary from './components/ErrorBoundary.vue'

const router = useRouter()
const route = useRoute()

const activeIndex = ref(route.path)

watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath
  }
)

const handleSelect = (key: string) => {
  router.push(key)
}
</script>

<style scoped>
#app {
  min-height: 100vh;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo h1 {
  margin: 0;
  color: #409eff;
  font-size: 24px;
  font-weight: bold;
}

.logo .subtitle {
  color: #909399;
  font-size: 12px;
}

.header-menu {
  border-bottom: none;
}

.app-main {
  padding: 0;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

:deep(.el-menu--horizontal > .el-menu-item) {
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

:deep(.el-menu--horizontal > .el-menu-item:hover) {
  background-color: #ecf5ff;
}

:deep(.el-menu--horizontal > .el-menu-item.is-active) {
  border-bottom-color: #409eff;
  background-color: #ecf5ff;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
