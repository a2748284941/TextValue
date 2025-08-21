<template>
  <div class="model-monitor">
    <el-card class="monitor-card">
      <template #header>
        <div class="card-header">
          <span>模型性能监控</span>
          <div class="header-actions">
            <el-switch
              v-model="autoRefresh"
              active-text="自动刷新"
              inactive-text="手动刷新"
              @change="handleAutoRefreshChange"
            />
            <el-button type="primary" size="small" @click="refreshData" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div class="monitor-content">
        <!-- 总览统计 -->
        <div class="stats-overview">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-value">{{ totalModels }}</div>
                  <div class="stat-label">总模型数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-value">{{ availableModels }}</div>
                  <div class="stat-label">可用模型</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-value">{{ activeModels }}</div>
                  <div class="stat-label">活跃模型</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-value">{{ avgResponseTime }}ms</div>
                  <div class="stat-label">平均响应时间</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 模型状态列表 -->
        <div class="model-status-list">
          <h3>模型状态详情</h3>
          <el-table :data="modelStatusList" style="width: 100%" v-loading="loading">
            <el-table-column prop="name" label="模型名称" width="200" />
            <el-table-column prop="platform" label="平台" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="responseTime" label="响应时间" width="120">
              <template #default="{ row }">
                <span v-if="row.responseTime">{{ row.responseTime }}ms</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="lastTest" label="最后测试" width="180">
              <template #default="{ row }">
                <span v-if="row.lastTest">{{ formatTime(row.lastTest) }}</span>
                <span v-else>未测试</span>
              </template>
            </el-table-column>
            <el-table-column prop="errorCount" label="错误次数" width="100" />
            <el-table-column prop="successRate" label="成功率" width="100">
              <template #default="{ row }">
                <span v-if="row.successRate !== undefined">{{ row.successRate }}%</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="testModel(row)" :loading="row.testing">
                  测试
                </el-button>
                <el-button size="small" type="info" @click="viewDetails(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 性能图表 -->
        <div class="performance-charts">
          <h3>性能趋势</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header>
                  <span>响应时间趋势</span>
                </template>
                <div class="chart-container" ref="responseTimeChart"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header>
                  <span>成功率统计</span>
                </template>
                <div class="chart-container" ref="successRateChart"></div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 模型详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="模型详情" width="800px">
      <div v-if="selectedModel" class="model-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模型名称">{{ selectedModel.name }}</el-descriptions-item>
          <el-descriptions-item label="模型ID">{{ selectedModel.id }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ selectedModel.platform }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedModel.status)">
              {{ getStatusText(selectedModel.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="响应时间">{{ selectedModel.responseTime || '-' }}ms</el-descriptions-item>
          <el-descriptions-item label="成功率">{{ selectedModel.successRate || '-' }}%</el-descriptions-item>
          <el-descriptions-item label="错误次数">{{ selectedModel.errorCount }}</el-descriptions-item>
          <el-descriptions-item label="最后测试">{{ selectedModel.lastTest ? formatTime(selectedModel.lastTest) : '未测试' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="test-history" style="margin-top: 20px;">
          <h4>测试历史</h4>
          <el-table :data="selectedModel.testHistory || []" size="small">
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="responseTime" label="响应时间" width="120">
              <template #default="{ row }">
                {{ row.responseTime }}ms
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'
import type { AIModel } from '@/types/ai'

interface ModelStatus {
  id: string
  name: string
  platform: string
  status: 'available' | 'unavailable' | 'testing' | 'unknown'
  responseTime?: number
  lastTest?: Date
  errorCount: number
  successRate?: number
  testing?: boolean
  testHistory?: Array<{
    timestamp: Date
    status: 'success' | 'error'
    responseTime: number
    error?: string
  }>
}

const aiConfigStore = useAIConfigStore()
const loading = ref(false)
const autoRefresh = ref(false)
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const modelStatusList = ref<ModelStatus[]>([])
const showDetailsDialog = ref(false)
const selectedModel = ref<ModelStatus | null>(null)

// 计算属性
const totalModels = computed(() => modelStatusList.value.length)
const availableModels = computed(() => 
  modelStatusList.value.filter(model => model.status === 'available').length
)
const activeModels = computed(() => 
  modelStatusList.value.filter(model => model.status !== 'unavailable').length
)
const avgResponseTime = computed(() => {
  const validTimes = modelStatusList.value
    .filter(model => model.responseTime)
    .map(model => model.responseTime!)
  return validTimes.length > 0 
    ? Math.round(validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length)
    : 0
})

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

const formatTime = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const handleAutoRefreshChange = (value: boolean) => {
  if (value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  refreshInterval.value = setInterval(() => {
    refreshData()
  }, 30000) // 30秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    // 获取所有配置的模型
    const allModels: ModelStatus[] = []
    
    for (const config of aiConfigStore.configs) {
      try {
        const models = await aiConfigStore.loadModels(config.id)
        if (models) {
          const statusModels = models.map(model => ({
            id: model.id,
            name: model.name || model.id,
            platform: config.name,
            status: model.status as ModelStatus['status'] || 'unknown',
            responseTime: undefined,
            lastTest: undefined,
            errorCount: 0,
            successRate: undefined,
            testHistory: []
          }))
          allModels.push(...statusModels)
        }
      } catch (error) {
        console.error(`获取平台 ${config.name} 的模型失败:`, error)
      }
    }
    
    modelStatusList.value = allModels
  } catch (error) {
    ElMessage.error('刷新数据失败')
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

const testModel = async (model: ModelStatus) => {
  model.testing = true
  const startTime = Date.now()
  
  try {
    const config = aiConfigStore.configs.find(c => c.name === model.platform)
    if (config) {
      const result = await aiService.testModel(config, model.id)
      const responseTime = Date.now() - startTime
      
      model.responseTime = responseTime
      model.lastTest = new Date()
      
      if (result) {
        model.status = 'available'
        model.successRate = Math.min(100, (model.successRate || 0) + 10)
        ElMessage.success(`模型 ${model.name} 测试成功`)
      } else {
        model.status = 'unavailable'
        model.errorCount += 1
        model.successRate = Math.max(0, (model.successRate || 100) - 10)
        ElMessage.error(`模型 ${model.name} 测试失败`)
      }
      
      // 添加测试历史
      if (!model.testHistory) {
        model.testHistory = []
      }
      model.testHistory.unshift({
        timestamp: new Date(),
        status: result ? 'success' : 'error',
        responseTime,
        error: result ? undefined : '测试失败'
      })
      
      // 保持最近10条记录
      if (model.testHistory.length > 10) {
        model.testHistory = model.testHistory.slice(0, 10)
      }
    }
  } catch (error) {
    model.status = 'unavailable'
    model.errorCount += 1
    model.lastTest = new Date()
    ElMessage.error(`模型 ${model.name} 测试异常`)
    console.error('模型测试失败:', error)
  } finally {
    model.testing = false
  }
}

const viewDetails = (model: ModelStatus) => {
  selectedModel.value = model
  showDetailsDialog.value = true
}

onMounted(() => {
  refreshData()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.model-monitor {
  padding: 20px;
}

.monitor-card {
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
  gap: 10px;
}

.stats-overview {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  padding: 10px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.model-status-list {
  margin-bottom: 30px;
}

.model-status-list h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.performance-charts h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.chart-card {
  height: 300px;
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  background: #f5f5f5;
  border-radius: 4px;
}

.model-details {
  max-height: 500px;
  overflow-y: auto;
}

.test-history h4 {
  margin-bottom: 10px;
  color: #2c3e50;
}
</style>