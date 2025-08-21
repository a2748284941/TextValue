<template>
  <div class="model-statistics">
    <el-card class="statistics-card">
      <template #header>
        <div class="card-header">
          <span>模型使用统计</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
              style="margin-right: 10px"
            />
            <el-button type="primary" @click="refreshStatistics" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新统计
            </el-button>
            <el-button @click="exportStatistics">
              <el-icon><Download /></el-icon>
              导出报告
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计概览 -->
      <div class="statistics-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="总调用次数" :value="overviewStats.totalCalls" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="成功调用" :value="overviewStats.successCalls" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="平均响应时间" :value="overviewStats.avgResponseTime" suffix="ms" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="成功率" :value="overviewStats.successRate" suffix="%" :precision="2" />
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>调用趋势</span>
              </template>
              <div ref="callTrendChart" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>模型使用分布</span>
              </template>
              <div ref="modelDistributionChart" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>响应时间分布</span>
              </template>
              <div ref="responseTimeChart" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>错误类型统计</span>
              </template>
              <div ref="errorTypeChart" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 详细统计表格 -->
      <div class="detailed-statistics">
        <el-card class="table-card">
          <template #header>
            <span>模型详细统计</span>
          </template>
          <el-table :data="modelStats" stripe style="width: 100%">
            <el-table-column prop="modelName" label="模型名称" width="200" />
            <el-table-column prop="platform" label="平台" width="120" />
            <el-table-column prop="totalCalls" label="总调用" width="100" sortable />
            <el-table-column prop="successCalls" label="成功调用" width="100" sortable />
            <el-table-column prop="failedCalls" label="失败调用" width="100" sortable />
            <el-table-column prop="successRate" label="成功率" width="100" sortable>
              <template #default="{ row }">
                <el-tag :type="getSuccessRateType(row.successRate)">
                  {{ row.successRate.toFixed(2) }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="avgResponseTime" label="平均响应时间" width="140" sortable>
              <template #default="{ row }">
                {{ row.avgResponseTime }}ms
              </template>
            </el-table-column>
            <el-table-column prop="lastUsed" label="最后使用" width="160" sortable />
            <el-table-column prop="totalTokens" label="总Token数" width="120" sortable />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="viewModelDetails(row)">详情</el-button>
                <el-button size="small" type="primary" @click="exportModelStats(row)">导出</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-card>

    <!-- 模型详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="模型使用详情" width="80%">
      <div v-if="selectedModelDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模型名称">{{ selectedModelDetail.modelName }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ selectedModelDetail.platform }}</el-descriptions-item>
          <el-descriptions-item label="总调用次数">{{ selectedModelDetail.totalCalls }}</el-descriptions-item>
          <el-descriptions-item label="成功率">{{ selectedModelDetail.successRate.toFixed(2) }}%</el-descriptions-item>
          <el-descriptions-item label="平均响应时间">{{ selectedModelDetail.avgResponseTime }}ms</el-descriptions-item>
          <el-descriptions-item label="最后使用时间">{{ selectedModelDetail.lastUsed }}</el-descriptions-item>
        </el-descriptions>

        <!-- 使用历史图表 -->
        <div style="margin-top: 20px">
          <h4>使用历史趋势</h4>
          <div ref="modelHistoryChart" class="chart-container"></div>
        </div>

        <!-- 错误日志 -->
        <div style="margin-top: 20px">
          <h4>最近错误日志</h4>
          <el-table :data="selectedModelDetail.recentErrors" max-height="300">
            <el-table-column prop="timestamp" label="时间" width="160" />
            <el-table-column prop="errorType" label="错误类型" width="120" />
            <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

interface OverviewStats {
  totalCalls: number
  successCalls: number
  avgResponseTime: number
  successRate: number
}

interface ModelStat {
  modelName: string
  platform: string
  totalCalls: number
  successCalls: number
  failedCalls: number
  successRate: number
  avgResponseTime: number
  lastUsed: string
  totalTokens: number
  recentErrors: Array<{
    timestamp: string
    errorType: string
    errorMessage: string
  }>
}

const loading = ref(false)
const dateRange = ref<[string, string]>()
const detailDialogVisible = ref(false)
const selectedModelDetail = ref<ModelStat | null>(null)

// 图表引用
const callTrendChart = ref<HTMLElement>()
const modelDistributionChart = ref<HTMLElement>()
const responseTimeChart = ref<HTMLElement>()
const errorTypeChart = ref<HTMLElement>()
const modelHistoryChart = ref<HTMLElement>()

// 统计数据
const overviewStats = ref<OverviewStats>({
  totalCalls: 1250,
  successCalls: 1180,
  avgResponseTime: 850,
  successRate: 94.4
})

const modelStats = ref<ModelStat[]>([
  {
    modelName: 'gpt-3.5-turbo',
    platform: 'OpenAI',
    totalCalls: 450,
    successCalls: 435,
    failedCalls: 15,
    successRate: 96.67,
    avgResponseTime: 750,
    lastUsed: '2024-01-15 14:30:25',
    totalTokens: 125000,
    recentErrors: [
      {
        timestamp: '2024-01-15 10:15:30',
        errorType: 'Rate Limit',
        errorMessage: 'API rate limit exceeded'
      }
    ]
  },
  {
    modelName: 'claude-3-sonnet',
    platform: 'Anthropic',
    totalCalls: 320,
    successCalls: 305,
    failedCalls: 15,
    successRate: 95.31,
    avgResponseTime: 920,
    lastUsed: '2024-01-15 13:45:12',
    totalTokens: 98000,
    recentErrors: []
  },
  {
    modelName: 'llama2-70b',
    platform: 'Ollama',
    totalCalls: 280,
    successCalls: 260,
    failedCalls: 20,
    successRate: 92.86,
    avgResponseTime: 1200,
    lastUsed: '2024-01-15 12:20:45',
    totalTokens: 75000,
    recentErrors: [
      {
        timestamp: '2024-01-15 09:30:15',
        errorType: 'Connection',
        errorMessage: 'Connection timeout'
      }
    ]
  },
  {
    modelName: 'gemini-pro',
    platform: 'Google',
    totalCalls: 200,
    successCalls: 180,
    failedCalls: 20,
    successRate: 90.0,
    avgResponseTime: 680,
    lastUsed: '2024-01-15 11:15:30',
    totalTokens: 52000,
    recentErrors: []
  }
])

// 初始化日期范围（最近7天）
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  dateRange.value = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
}

// 获取成功率标签类型
const getSuccessRateType = (rate: number) => {
  if (rate >= 95) return 'success'
  if (rate >= 90) return 'warning'
  return 'danger'
}

// 刷新统计数据
const refreshStatistics = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('统计数据已刷新')
    
    // 重新渲染图表
    await nextTick()
    initCharts()
  } catch (error) {
    ElMessage.error('刷新统计数据失败')
  } finally {
    loading.value = false
  }
}

// 处理日期范围变化
const handleDateRangeChange = (range: [string, string] | null) => {
  if (range) {
    refreshStatistics()
  }
}

// 导出统计报告
const exportStatistics = () => {
  // 模拟导出功能
  const data = {
    overview: overviewStats.value,
    models: modelStats.value,
    dateRange: dateRange.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `model-statistics-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('统计报告已导出')
}

// 查看模型详情
const viewModelDetails = (model: ModelStat) => {
  selectedModelDetail.value = model
  detailDialogVisible.value = true
  
  // 延迟渲染图表
  nextTick(() => {
    initModelHistoryChart()
  })
}

// 导出单个模型统计
const exportModelStats = (model: ModelStat) => {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${model.modelName}-statistics.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success(`${model.modelName} 统计数据已导出`)
}

// 初始化图表
const initCharts = () => {
  initCallTrendChart()
  initModelDistributionChart()
  initResponseTimeChart()
  initErrorTypeChart()
}

// 调用趋势图表
const initCallTrendChart = () => {
  if (!callTrendChart.value) return
  
  const chart = echarts.init(callTrendChart.value)
  const option = {
    title: { text: '最近7天调用趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '01-15']
    },
    yAxis: { type: 'value' },
    series: [{
      name: '调用次数',
      type: 'line',
      data: [120, 150, 180, 200, 160, 220, 250],
      smooth: true
    }]
  }
  chart.setOption(option)
}

// 模型分布图表
const initModelDistributionChart = () => {
  if (!modelDistributionChart.value) return
  
  const chart = echarts.init(modelDistributionChart.value)
  const option = {
    title: { text: '模型使用分布' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: modelStats.value.map(item => ({
        name: item.modelName,
        value: item.totalCalls
      }))
    }]
  }
  chart.setOption(option)
}

// 响应时间分布图表
const initResponseTimeChart = () => {
  if (!responseTimeChart.value) return
  
  const chart = echarts.init(responseTimeChart.value)
  const option = {
    title: { text: '响应时间分布' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: modelStats.value.map(item => item.modelName)
    },
    yAxis: { type: 'value', name: '响应时间(ms)' },
    series: [{
      name: '平均响应时间',
      type: 'bar',
      data: modelStats.value.map(item => item.avgResponseTime)
    }]
  }
  chart.setOption(option)
}

// 错误类型统计图表
const initErrorTypeChart = () => {
  if (!errorTypeChart.value) return
  
  const chart = echarts.init(errorTypeChart.value)
  const option = {
    title: { text: '错误类型统计' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { name: 'Rate Limit', value: 15 },
        { name: 'Connection', value: 20 },
        { name: 'Timeout', value: 10 },
        { name: 'Auth Error', value: 5 }
      ]
    }]
  }
  chart.setOption(option)
}

// 模型历史趋势图表
const initModelHistoryChart = () => {
  if (!modelHistoryChart.value) return
  
  const chart = echarts.init(modelHistoryChart.value)
  const option = {
    title: { text: '使用历史趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '01-15']
    },
    yAxis: { type: 'value' },
    series: [{
      name: '调用次数',
      type: 'line',
      data: [45, 52, 61, 58, 67, 72, 65],
      smooth: true
    }]
  }
  chart.setOption(option)
}

onMounted(() => {
  initDateRange()
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.model-statistics {
  padding: 20px;
}

.statistics-card {
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

.statistics-overview {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.detailed-statistics {
  margin-top: 20px;
}

.table-card {
  margin-bottom: 20px;
}
</style>