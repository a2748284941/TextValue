<template>
  <div class="model-batch-operations">
    <el-card class="batch-card">
      <template #header>
        <div class="card-header">
          <span>模型批量操作</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              @click="selectAll" 
              :disabled="!hasModels"
              size="small"
            >
              全选
            </el-button>
            <el-button 
              @click="clearSelection" 
              :disabled="selectedModels.length === 0"
              size="small"
            >
              清空选择
            </el-button>
          </div>
        </div>
      </template>

      <!-- 批量操作工具栏 -->
      <div class="batch-toolbar" v-if="selectedModels.length > 0">
        <el-alert
          :title="`已选择 ${selectedModels.length} 个模型`"
          type="info"
          :closable="false"
          show-icon
        />
        
        <div class="batch-actions">
          <el-button 
            type="primary" 
            @click="batchTest" 
            :loading="batchTesting"
            :disabled="selectedModels.length === 0"
          >
            <el-icon><CircleCheck /></el-icon>
            批量测试
          </el-button>
          
          <el-button 
            type="success" 
            @click="batchEnable" 
            :disabled="selectedModels.length === 0"
          >
            <el-icon><Check /></el-icon>
            批量启用
          </el-button>
          
          <el-button 
            type="warning" 
            @click="batchDisable" 
            :disabled="selectedModels.length === 0"
          >
            <el-icon><Close /></el-icon>
            批量禁用
          </el-button>
          
          <el-button 
            type="info" 
            @click="exportSelected" 
            :disabled="selectedModels.length === 0"
          >
            <el-icon><Download /></el-icon>
            导出配置
          </el-button>
          
          <el-button 
            type="danger" 
            @click="batchDelete" 
            :disabled="selectedModels.length === 0"
          >
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
        </div>
      </div>

      <!-- 模型列表 -->
      <div class="model-list">
        <el-table 
          :data="filteredModels" 
          @selection-change="handleSelectionChange"
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column prop="name" label="模型名称" min-width="200">
            <template #default="{ row }">
              <div class="model-info">
                <span class="model-name">{{ row.name || row.id }}</span>
                <el-tag v-if="row.featured" type="warning" size="small">推荐</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="platform" label="平台" width="120">
            <template #default="{ row }">
              <el-tag :type="getPlatformTagType(row.platform)">{{ row.platform }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="enabled" label="启用状态" width="100">
            <template #default="{ row }">
              <el-switch 
                v-model="row.enabled" 
                @change="toggleModelEnabled(row)"
                :disabled="row.status === 'unavailable'"
              />
            </template>
          </el-table-column>
          
          <el-table-column prop="lastTest" label="最后测试" width="150">
            <template #default="{ row }">
              <span v-if="row.lastTest">{{ formatTime(row.lastTest) }}</span>
              <span v-else class="text-muted">未测试</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="responseTime" label="响应时间" width="120">
            <template #default="{ row }">
              <span v-if="row.responseTime">
                <el-tag 
                  :type="getResponseTimeTagType(row.responseTime)" 
                  size="small"
                >
                  {{ row.responseTime }}ms
                </el-tag>
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                size="small" 
                @click="testSingleModel(row)" 
                :loading="row.testing"
              >
                测试
              </el-button>
              
              <el-button 
                size="small" 
                type="primary" 
                @click="editModel(row)"
              >
                编辑
              </el-button>
              
              <el-dropdown @command="handleModelAction">
                <el-button size="small" type="info">
                  更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'clone', model: row }">
                      <el-icon><DocumentCopy /></el-icon>
                      克隆配置
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'export', model: row }">
                      <el-icon><Download /></el-icon>
                      导出配置
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', model: row }" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 批量测试进度 -->
      <el-dialog v-model="showBatchTestDialog" title="批量测试进度" width="600px">
        <div class="batch-test-progress">
          <el-progress 
            :percentage="testProgress" 
            :status="testProgressStatus"
            :stroke-width="8"
          />
          
          <div class="test-results" style="margin-top: 20px;">
            <el-table :data="testResults" size="small" max-height="300">
              <el-table-column prop="modelName" label="模型" width="200" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.status === 'success' ? 'success' : row.status === 'error' ? 'danger' : 'info'"
                    size="small"
                  >
                    {{ row.status === 'success' ? '成功' : row.status === 'error' ? '失败' : '测试中' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="responseTime" label="响应时间" width="120">
                <template #default="{ row }">
                  {{ row.responseTime ? row.responseTime + 'ms' : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="error" label="错误信息" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.error || '-' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        
        <template #footer>
          <el-button @click="showBatchTestDialog = false" :disabled="batchTesting">
            {{ batchTesting ? '测试中...' : '关闭' }}
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  CircleCheck, 
  Check, 
  Close, 
  Download, 
  Delete, 
  ArrowDown, 
  DocumentCopy 
} from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'
import type { AIModel } from '@/types/ai'

interface ExtendedModel extends AIModel {
  platform: string
  enabled: boolean
  testing?: boolean
  lastTest?: Date
  responseTime?: number
  featured?: boolean
}

interface TestResult {
  modelName: string
  status: 'pending' | 'success' | 'error'
  responseTime?: number
  error?: string
}

const aiConfigStore = useAIConfigStore()
const loading = ref(false)
const batchTesting = ref(false)
const selectedModels = ref<ExtendedModel[]>([])
const allModels = ref<ExtendedModel[]>([])
const showBatchTestDialog = ref(false)
const testResults = ref<TestResult[]>([])
const testProgress = ref(0)
const testProgressStatus = ref<'success' | 'exception' | undefined>()

// 计算属性
const hasModels = computed(() => allModels.value.length > 0)
const filteredModels = computed(() => allModels.value)

const getPlatformTagType = (platform: string) => {
  const typeMap: Record<string, string> = {
    'OpenAI': 'primary',
    'Claude': 'success',
    'Gemini': 'warning',
    'Custom': 'info'
  }
  return typeMap[platform] || 'info'
}

const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'text': 'primary',
    'chat': 'success',
    'embedding': 'warning',
    'image': 'info'
  }
  return typeMap[type] || 'info'
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    'available': 'success',
    'unavailable': 'danger',
    'testing': 'warning',
    'unknown': 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'available': '可用',
    'unavailable': '不可用',
    'testing': '测试中',
    'unknown': '未知'
  }
  return statusMap[status] || '未知'
}

const getResponseTimeTagType = (time: number) => {
  if (time < 1000) return 'success'
  if (time < 3000) return 'warning'
  return 'danger'
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 选择操作
const handleSelectionChange = (selection: ExtendedModel[]) => {
  selectedModels.value = selection
}

const selectAll = () => {
  // 这里需要通过表格引用来全选，暂时用简单方式
  selectedModels.value = [...allModels.value]
}

const clearSelection = () => {
  selectedModels.value = []
}

// 批量操作
const batchTest = async () => {
  if (selectedModels.value.length === 0) return
  
  batchTesting.value = true
  showBatchTestDialog.value = true
  testProgress.value = 0
  testProgressStatus.value = undefined
  
  // 初始化测试结果
  testResults.value = selectedModels.value.map(model => ({
    modelName: model.name || model.id,
    status: 'pending' as const
  }))
  
  let completedCount = 0
  const totalCount = selectedModels.value.length
  
  for (let i = 0; i < selectedModels.value.length; i++) {
    const model = selectedModels.value[i]
    const resultIndex = i
    
    try {
      testResults.value[resultIndex].status = 'pending'
      
      const config = aiConfigStore.configs.find(c => c.name === model.platform)
      if (config) {
        const startTime = Date.now()
        const result = await aiService.testModel(config, model.id)
        const responseTime = Date.now() - startTime
        
        if (result) {
          testResults.value[resultIndex].status = 'success'
          testResults.value[resultIndex].responseTime = responseTime
          model.status = 'available'
          model.responseTime = responseTime
          model.lastTest = new Date()
        } else {
          testResults.value[resultIndex].status = 'error'
          testResults.value[resultIndex].error = '测试失败'
          model.status = 'unavailable'
        }
      } else {
        testResults.value[resultIndex].status = 'error'
        testResults.value[resultIndex].error = '找不到平台配置'
      }
    } catch (error) {
      testResults.value[resultIndex].status = 'error'
      testResults.value[resultIndex].error = error instanceof Error ? error.message : '未知错误'
      model.status = 'unavailable'
    }
    
    completedCount++
    testProgress.value = Math.round((completedCount / totalCount) * 100)
  }
  
  // 检查测试结果
  const successCount = testResults.value.filter(r => r.status === 'success').length
  const errorCount = testResults.value.filter(r => r.status === 'error').length
  
  if (errorCount === 0) {
    testProgressStatus.value = 'success'
    ElMessage.success(`批量测试完成，${successCount} 个模型测试成功`)
  } else {
    testProgressStatus.value = 'exception'
    ElMessage.warning(`批量测试完成，${successCount} 个成功，${errorCount} 个失败`)
  }
  
  batchTesting.value = false
}

const batchEnable = () => {
  selectedModels.value.forEach(model => {
    model.enabled = true
  })
  ElMessage.success(`已启用 ${selectedModels.value.length} 个模型`)
}

const batchDisable = () => {
  selectedModels.value.forEach(model => {
    model.enabled = false
  })
  ElMessage.success(`已禁用 ${selectedModels.value.length} 个模型`)
}

const exportSelected = () => {
  const exportData = {
    models: selectedModels.value.map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      platform: model.platform,
      enabled: model.enabled,
      maxTokens: model.maxTokens,
      pricing: model.pricing
    })),
    exportTime: new Date().toISOString(),
    count: selectedModels.value.length
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `models_export_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`已导出 ${selectedModels.value.length} 个模型配置`)
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedModels.value.length} 个模型吗？此操作不可撤销。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    // 从列表中移除选中的模型
    const selectedIds = selectedModels.value.map(m => m.id)
    allModels.value = allModels.value.filter(m => !selectedIds.includes(m.id))
    selectedModels.value = []
    
    ElMessage.success('批量删除成功')
  } catch {
    // 用户取消删除
  }
}

// 单个模型操作
const testSingleModel = async (model: ExtendedModel) => {
  model.testing = true
  
  try {
    const config = aiConfigStore.configs.find(c => c.name === model.platform)
    if (config) {
      const startTime = Date.now()
      const result = await aiService.testModel(config, model.id)
      const responseTime = Date.now() - startTime
      
      if (result) {
        model.status = 'available'
        model.responseTime = responseTime
        model.lastTest = new Date()
        ElMessage.success(`模型 ${model.name || model.id} 测试成功`)
      } else {
        model.status = 'unavailable'
        ElMessage.error(`模型 ${model.name || model.id} 测试失败`)
      }
    }
  } catch (error) {
    model.status = 'unavailable'
    ElMessage.error(`模型 ${model.name || model.id} 测试异常`)
    console.error('模型测试失败:', error)
  } finally {
    model.testing = false
  }
}

const toggleModelEnabled = (model: ExtendedModel) => {
  ElMessage.success(`模型 ${model.name || model.id} 已${model.enabled ? '启用' : '禁用'}`)
}

const editModel = (model: ExtendedModel) => {
  ElMessage.info('编辑功能开发中...')
}

const handleModelAction = ({ action, model }: { action: string, model: ExtendedModel }) => {
  switch (action) {
    case 'clone':
      ElMessage.info('克隆功能开发中...')
      break
    case 'export':
      exportSelected()
      break
    case 'delete':
      ElMessageBox.confirm(`确定要删除模型 ${model.name || model.id} 吗？`, '删除确认', {
        type: 'warning'
      }).then(() => {
        allModels.value = allModels.value.filter(m => m.id !== model.id)
        ElMessage.success('删除成功')
      }).catch(() => {})
      break
  }
}

// 加载数据
const loadModels = async () => {
  loading.value = true
  try {
    const models: ExtendedModel[] = []
    
    for (const config of aiConfigStore.configs) {
      try {
        const configModels = await aiConfigStore.loadModels(config.id)
        if (configModels) {
          const extendedModels = configModels.map(model => ({
            ...model,
            platform: config.name,
            enabled: true,
            featured: ['gpt-4', 'claude-3', 'gemini-pro'].some(name => 
              model.id.toLowerCase().includes(name)
            )
          }))
          models.push(...extendedModels)
        }
      } catch (error) {
        console.error(`加载平台 ${config.name} 的模型失败:`, error)
      }
    }
    
    allModels.value = models
  } catch (error) {
    ElMessage.error('加载模型列表失败')
    console.error('加载模型失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.model-batch-operations {
  padding: 20px;
}

.batch-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.batch-toolbar {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.batch-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-name {
  font-weight: 500;
}

.text-muted {
  color: #999;
}

.batch-test-progress {
  padding: 10px 0;
}

.test-results {
  border-top: 1px solid #eee;
  padding-top: 15px;
}
</style>