<template>
  <div class="model-manager">
    <!-- 管理模式切换 -->
     <el-card class="mode-card">
       <el-radio-group v-model="managementMode" @change="handleModeChange">
         <el-radio-button value="basic">基础管理</el-radio-button>
         <el-radio-button value="batch">批量操作</el-radio-button>
         <el-radio-button value="monitor">性能监控</el-radio-button>
         <el-radio-button value="statistics">使用统计</el-radio-button>
         <el-radio-button value="config">配置管理</el-radio-button>
       </el-radio-group>
     </el-card>

    <!-- 基础管理模式 -->
    <el-card class="model-card" v-show="managementMode === 'basic'">
      <template #header>
        <div class="card-header">
          <span>AI模型管理</span>
          <div class="header-actions">
            <el-select
              v-model="selectedPlatform"
              placeholder="选择平台"
              style="width: 200px; margin-right: 10px"
              @change="handlePlatformChange"
            >
              <el-option
                v-for="config in aiConfigStore.configs"
                :key="config.id"
                :label="config.name"
                :value="config.id"
              />
            </el-select>
            <el-button type="primary" @click="refreshModels" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新模型
            </el-button>
            <el-tag v-if="selectedPlatform && isUsingCache" type="info" size="small" style="margin-left: 10px">
              使用缓存
            </el-tag>
          </div>
        </div>
      </template>
      
      <div v-if="!selectedPlatform" class="empty-state">
        <el-empty description="请先选择一个AI平台" />
      </div>
      
      <div v-else>
        <el-table :data="filteredModels" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="模型ID" min-width="200" show-overflow-tooltip />
          <el-table-column prop="name" label="模型名称" width="200" />
          <el-table-column prop="type" label="模型类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getModelTypeTag(row.type)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="maxTokens" label="最大Token" width="120" />
          <el-table-column prop="pricing.input" label="输入价格" width="120">
            <template #default="{ row }">
              <span v-if="row.pricing">${{ row.pricing.input }}/1K</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="pricing.output" label="输出价格" width="120">
            <template #default="{ row }">
              <span v-if="row.pricing">${{ row.pricing.output }}/1K</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
             <template #default="{ row }">
               <el-tag :type="row.status === 'available' ? 'success' : 'danger'">
                 {{ row.status === 'available' ? '可用' : '不可用' }}
               </el-tag>
             </template>
           </el-table-column>
           <el-table-column label="操作" width="150">
             <template #default="{ row }">
               <el-button size="small" @click="testModel(row)">测试</el-button>
               <el-button
                 size="small"
                 :type="row.enabled ? 'danger' : 'primary'"
                 @click="toggleModel(row)"
               >
                 {{ row.enabled ? '禁用' : '启用' }}
               </el-button>
             </template>
           </el-table-column>
         </el-table>
       </div>
     </el-card>

     <!-- 批量操作模式 -->
     <div v-show="managementMode === 'batch'">
       <ModelBatchOperations />
     </div>

     <!-- 性能监控模式 -->
      <div v-show="managementMode === 'monitor'">
        <ModelMonitor />
      </div>

      <!-- 使用统计模式 -->
      <div v-show="managementMode === 'statistics'">
        <ModelStatistics />
      </div>

      <!-- 配置管理模式 -->
      <div v-show="managementMode === 'config'">
        <ModelConfigManager />
      </div>
    </div>
  </template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'
import type { AIModel } from '@/types/ai'
import ModelBatchOperations from './ModelBatchOperations.vue'
import ModelMonitor from './ModelMonitor.vue'
import ModelStatistics from './ModelStatistics.vue'
import ModelConfigManager from './ModelConfigManager.vue'

const aiConfigStore = useAIConfigStore()
const managementMode = ref<string>('basic')
const selectedPlatform = ref<string>('')
const models = ref<AIModel[]>([])
const loading = ref(false)

const handleModeChange = (mode: string) => {
  managementMode.value = mode
}

// 检查是否使用缓存
const isUsingCache = computed(() => {
  if (!selectedPlatform.value) return false
  return aiConfigStore.getModelsFromCache(selectedPlatform.value) !== null
})

const filteredModels = computed(() => {
  return models.value.filter(model => model.platformId === selectedPlatform.value)
})

const getModelTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    'text': 'primary',
    'chat': 'success',
    'embedding': 'warning',
    'image': 'info'
  }
  return typeMap[type] || 'info'
}

const handlePlatformChange = async () => {
  if (selectedPlatform.value) {
    // 选择平台时自动加载模型（使用缓存）
    await loadModels()
  }
}

const loadModels = async () => {
  if (!selectedPlatform.value) return
  
  loading.value = true
  try {
    const platformConfig = aiConfigStore.configs.find(c => c.id === selectedPlatform.value)
    if (platformConfig) {
      // 使用store的loadModels方法，会自动处理缓存
       const fetchedModels = await aiConfigStore.loadModels(selectedPlatform.value)
       if (fetchedModels) {
         models.value = fetchedModels.map(model => ({
           ...model,
           platformId: selectedPlatform.value,
           enabled: true
         }))
         
         // 显示加载结果
         const cacheStatus = aiConfigStore.getModelsFromCache(selectedPlatform.value) ? '（使用缓存）' : '（从服务器获取）'
         ElMessage.success(`模型列表加载成功 ${cacheStatus}`)
       }
    }
  } catch (error) {
    ElMessage.error('获取模型列表失败')
    console.error('获取模型失败:', error)
  } finally {
    loading.value = false
  }
}

const refreshModels = async () => {
  if (!selectedPlatform.value) return
  
  loading.value = true
  try {
    const platformConfig = aiConfigStore.configs.find(c => c.id === selectedPlatform.value)
    if (platformConfig) {
      // 使用store的refreshModels方法，会清空缓存并重新加载
      const fetchedModels = await aiConfigStore.refreshModels(selectedPlatform.value)
      if (fetchedModels) {
        models.value = fetchedModels.map(model => ({
          ...model,
          platformId: selectedPlatform.value,
          enabled: true
        }))
        ElMessage.success('模型列表刷新成功')
      }
    }
  } catch (error) {
    ElMessage.error('获取模型列表失败')
    console.error('获取模型失败:', error)
  } finally {
    loading.value = false
  }
}

const testModel = async (model: AIModel) => {
  try {
    const platformConfig = aiConfigStore.configs.find(c => c.id === selectedPlatform.value)
    if (platformConfig) {
      const result = await aiService.testModel(platformConfig, model.id)
      if (result) {
        ElMessage.success('模型测试成功')
      } else {
        ElMessage.error('模型测试失败')
      }
    }
  } catch (error) {
    ElMessage.error('模型测试异常')
    console.error('模型测试失败:', error)
  }
}

const toggleModel = (model: AIModel) => {
  model.enabled = !model.enabled
  ElMessage.success(`模型已${model.enabled ? '启用' : '禁用'}`)
}

onMounted(() => {
  aiConfigStore.loadConfigs()
})
</script>

<style scoped>
.model-manager {
  padding: 20px;
}

.mode-card {
  margin-bottom: 20px;
  text-align: center;
}

.mode-card :deep(.el-card__body) {
  padding: 15px;
}

.model-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}
</style>