<template>
  <div class="duplication-checker">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>查重检测</span>
          <el-button
            v-if="checkResult"
            type="primary"
            size="small"
            @click="recheckDuplication"
            :loading="checking"
          >
            重新检测
          </el-button>
        </div>
      </template>

      <div v-if="!content" class="empty-state">
        <el-empty description="请先输入需要检测的内容" />
      </div>

      <div v-if="content && !checkResult && !checking" class="check-controls">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-select
              v-model="checkMode"
              placeholder="选择检测模式"
              style="width: 100%"
            >
              <el-option label="快速检测" value="fast" />
              <el-option label="深度检测" value="deep" />
              <el-option label="学术检测" value="academic" />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-button
              type="primary"
              @click="checkDuplication"
              style="width: 100%"
            >
              开始检测
            </el-button>
          </el-col>
        </el-row>
      </div>

      <div v-if="checking" class="checking-state">
        <div class="progress-info">
          <el-progress
            :percentage="progress"
            :status="progress === 100 ? 'success' : undefined"
          />
          <div class="progress-text">
            {{ progressText }}
          </div>
        </div>
        <el-skeleton :rows="6" animated />
      </div>

      <div v-if="checkResult" class="check-result">
        <div class="result-summary">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic
                title="总体相似度"
                :value="checkResult.similarity"
                suffix="%"
                :value-style="{ 
                  color: checkResult.similarity < 15 ? '#67c23a' : 
                         checkResult.similarity < 30 ? '#e6a23c' : '#f56c6c' 
                }"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                title="重复片段"
                :value="checkResult.duplicateSegments"
                suffix="个"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                title="检测来源"
                :value="checkResult.sources"
                suffix="个"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                title="风险等级"
                :value="checkResult.riskLevel"
                :value-style="{ 
                  color: checkResult.riskLevel === '低' ? '#67c23a' : 
                         checkResult.riskLevel === '中' ? '#e6a23c' : '#f56c6c' 
                }"
              />
            </el-col>
          </el-row>
        </div>

        <el-divider content-position="left">重复内容详情</el-divider>
        
        <div class="duplicate-details">
          <div v-if="!duplicateItems.length" class="no-duplicates">
            <el-result
              icon="success"
              title="恭喜！"
              sub-title="未发现重复内容，原创度良好"
            />
          </div>
          
          <div v-else class="duplicate-list">
            <el-collapse v-model="activeCollapse">
              <el-collapse-item
                v-for="(item, index) in duplicateItems"
                :key="index"
                :title="`重复片段 ${index + 1} - 相似度 ${item.similarity}%`"
                :name="index"
              >
                <div class="duplicate-item">
                  <div class="duplicate-content">
                    <h4>重复内容：</h4>
                    <el-input
                      :model-value="item.content"
                      type="textarea"
                      :rows="3"
                      readonly
                      class="duplicate-text"
                    />
                  </div>
                  
                  <div class="duplicate-source">
                    <h4>来源信息：</h4>
                    <el-tag type="info" class="source-tag">
                      {{ item.source }}
                    </el-tag>
                    <span class="source-url">{{ item.url }}</span>
                  </div>
                  
                  <div class="rewrite-suggestion">
                    <h4>改写建议：</h4>
                    <el-input
                      v-model="item.suggestion"
                      type="textarea"
                      :rows="3"
                      placeholder="AI改写建议将显示在这里"
                      readonly
                    />
                    <el-button
                      type="primary"
                      size="small"
                      @click="generateRewriteSuggestion(index)"
                      :loading="item.generating"
                      style="margin-top: 8px"
                    >
                      生成改写建议
                    </el-button>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>

        <div class="action-buttons">
          <el-button @click="exportReport" type="success">
            <el-icon><Document /></el-icon>
            导出报告
          </el-button>
          <el-button @click="generateRewriteAll" type="warning">
            <el-icon><Edit /></el-icon>
            批量改写
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Edit } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'

interface Props {
  content: string
}

interface DuplicateItem {
  content: string
  similarity: number
  source: string
  url: string
  suggestion: string
  generating: boolean
}

interface CheckResult {
  similarity: number
  duplicateSegments: number
  sources: number
  riskLevel: string
}

const props = defineProps<Props>()

const aiConfigStore = useAIConfigStore()

const content = computed(() => props.content)
const checkMode = ref('fast')
const checking = ref(false)
const progress = ref(0)
const progressText = ref('')
const checkResult = ref<CheckResult | null>(null)
const duplicateItems = ref<DuplicateItem[]>([])
const activeCollapse = ref<number[]>([])

const selectedConfig = computed(() => aiConfigStore.selectedConfig)

const checkDuplication = async () => {
  if (!content.value.trim()) {
    ElMessage.warning('请输入需要检测的内容')
    return
  }

  checking.value = true
  progress.value = 0
  
  try {
    // 模拟检测过程
    const steps = [
      '正在分析文本结构...',
      '正在搜索相似内容...',
      '正在比对数据库...',
      '正在计算相似度...',
      '正在生成报告...'
    ]
    
    for (let i = 0; i < steps.length; i++) {
      progressText.value = steps[i]
      progress.value = Math.round(((i + 1) / steps.length) * 100)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 模拟检测结果
    const similarity = Math.floor(Math.random() * 50) + 10
    const duplicateCount = Math.floor(Math.random() * 5)
    
    checkResult.value = {
      similarity,
      duplicateSegments: duplicateCount,
      sources: Math.floor(Math.random() * 10) + 1,
      riskLevel: similarity < 15 ? '低' : similarity < 30 ? '中' : '高'
    }
    
    // 生成重复项
    duplicateItems.value = Array.from({ length: duplicateCount }, (_, index) => ({
      content: `这是第${index + 1}个重复片段的示例内容，实际应用中这里会显示真实的重复内容。`,
      similarity: Math.floor(Math.random() * 30) + 70,
      source: `来源网站${index + 1}`,
      url: `https://example${index + 1}.com/article`,
      suggestion: '',
      generating: false
    }))
    
    ElMessage.success('查重检测完成')
  } catch (error) {
    console.error('检测失败:', error)
    ElMessage.error('检测失败，请重试')
  } finally {
    checking.value = false
  }
}

const recheckDuplication = () => {
  checkResult.value = null
  duplicateItems.value = []
  checkDuplication()
}

const generateRewriteSuggestion = async (index: number) => {
  if (!selectedConfig.value) {
    ElMessage.warning('请先配置AI接口')
    return
  }
  
  const item = duplicateItems.value[index]
  item.generating = true
  
  try {
    const prompt = `请为以下重复内容提供改写建议，保持原意的同时降低重复率：\n\n${item.content}\n\n要求：\n1. 保持核心意思不变\n2. 使用不同的表达方式\n3. 调整句式结构\n4. 替换同义词汇\n5. 确保语言自然流畅`
    
    const suggestion = await aiService.generateText(
      selectedConfig.value,
      prompt,
      {
        temperature: 0.8,
        maxTokens: 500
      }
    )
    
    item.suggestion = suggestion
    ElMessage.success('改写建议生成成功')
  } catch (error) {
    console.error('生成改写建议失败:', error)
    ElMessage.error('生成改写建议失败，请重试')
  } finally {
    item.generating = false
  }
}

const generateRewriteAll = async () => {
  if (!selectedConfig.value) {
    ElMessage.warning('请先配置AI接口')
    return
  }
  
  for (let i = 0; i < duplicateItems.value.length; i++) {
    if (!duplicateItems.value[i].suggestion) {
      await generateRewriteSuggestion(i)
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  ElMessage.success('批量改写建议生成完成')
}

const exportReport = () => {
  if (!checkResult.value) return
  
  const report = {
    检测时间: new Date().toLocaleString(),
    检测模式: checkMode.value,
    总体相似度: `${checkResult.value.similarity}%`,
    重复片段: checkResult.value.duplicateSegments,
    检测来源: checkResult.value.sources,
    风险等级: checkResult.value.riskLevel,
    重复详情: duplicateItems.value.map((item, index) => ({
      序号: index + 1,
      重复内容: item.content,
      相似度: `${item.similarity}%`,
      来源: item.source,
      改写建议: item.suggestion || '未生成'
    }))
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `查重报告_${new Date().getTime()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('报告导出成功')
}

// 暴露方法给父组件
defineExpose({
  checkDuplication
})
</script>

<style scoped>
.duplication-checker {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.check-controls {
  margin-bottom: 20px;
}

.checking-state {
  padding: 20px 0;
}

.progress-info {
  margin-bottom: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  color: #409eff;
  font-size: 14px;
}

.check-result {
  min-height: 300px;
}

.result-summary {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.duplicate-details {
  margin-bottom: 20px;
}

.no-duplicates {
  text-align: center;
  padding: 40px 0;
}

.duplicate-list {
  margin-bottom: 20px;
}

.duplicate-item {
  padding: 16px;
}

.duplicate-content,
.duplicate-source,
.rewrite-suggestion {
  margin-bottom: 16px;
}

.duplicate-content h4,
.duplicate-source h4,
.rewrite-suggestion h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.duplicate-text :deep(.el-textarea__inner) {
  background-color: #fef0f0;
  border-color: #fbc4c4;
}

.source-tag {
  margin-right: 8px;
}

.source-url {
  color: #909399;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>