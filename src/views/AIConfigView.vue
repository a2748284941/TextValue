<template>
  <div class="ai-config-view">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="平台配置" name="config">
        <AIConfigManager />
      </el-tab-pane>
      <el-tab-pane label="模型管理" name="models">
        <ModelManager />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AIConfigManager from '@/components/AIConfig/AIConfigManager.vue'
import ModelManager from '@/components/AIConfig/ModelManager.vue'

const activeTab = ref('config')
</script>

<style scoped>
.ai-config-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>