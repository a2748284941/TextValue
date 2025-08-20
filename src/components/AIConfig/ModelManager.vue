<template>
  <div class="model-manager">
    <el-card class="model-card">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'
import type { AIModel } from '@/types/ai'

const aiConfigStore = useAIConfigStore()
const selectedPlatform = ref<string>('')
const models = ref<AIModel[]>([])
const loading = ref(false)

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
    await refreshModels()
  }
}

const refreshModels = async () => {
  if (!selectedPlatform.value) return
  
  loading.value = true
  try {
    const platformConfig = aiConfigStore.configs.find(c => c.id === selectedPlatform.value)
    if (platformConfig) {
      const fetchedModels = await aiService.getAvailableModels(platformConfig)
      models.value = fetchedModels.map(model => ({
        ...model,
        platformId: selectedPlatform.value,
        enabled: true
      }))
      ElMessage.success('模型列表刷新成功')
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