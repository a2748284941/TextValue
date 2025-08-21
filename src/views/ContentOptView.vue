<template>
  <div class="content-opt-view">
    <div class="page-header">
      <h1>内容优化中心</h1>
      <p>提供AI驱动的内容优化、查重检测和改写建议服务</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="input-card">
          <template #header>
            <div class="card-header">
              <span>输入内容</span>
              <div class="header-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="importFromWriting"
                  :disabled="!hasWritingContent"
                >
                  从写作工作流导入
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="exportContent"
                  :disabled="!content"
                >
                  导出内容
                </el-button>
              </div>
            </div>
          </template>
          
          <el-input
            v-model="content"
            type="textarea"
            :rows="8"
            placeholder="请输入需要优化的文章内容..."
            class="content-input"
            show-word-limit
            :maxlength="10000"
          />
          
          <div class="content-stats">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-statistic title="字数" :value="wordCount" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="段落" :value="paragraphCount" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="句子" :value="sentenceCount" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="预估阅读时间" :value="readingTime" suffix="分钟" />
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <ContentOptimizer
          :content="content"
          @update:content="handleContentUpdate"
          ref="optimizerRef"
        />
      </el-col>
      <el-col :span="12">
        <DuplicationChecker
          :content="content"
          ref="checkerRef"
        />
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="action-card">
          <template #header>
            <span>批量操作</span>
          </template>
          
          <div class="batch-actions">
            <el-button
              type="primary"
              @click="optimizeAndCheck"
              :loading="processing"
              :disabled="!content"
            >
              <el-icon><Magic /></el-icon>
              一键优化+查重
            </el-button>
            
            <el-button
              type="success"
              @click="generateVariations"
              :loading="generatingVariations"
              :disabled="!content"
            >
              <el-icon><CopyDocument /></el-icon>
              生成多版本
            </el-button>
            
            <el-button
              type="warning"
              @click="aiDetectionAvoidance"
              :loading="avoidingDetection"
              :disabled="!content"
            >
              <el-icon><Shield /></el-icon>
              AI检测规避
            </el-button>
            
            <el-button
              type="info"
              @click="saveToLibrary"
              :disabled="!content"
            >
              <el-icon><Collection /></el-icon>
              保存到素材库
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 多版本生成对话框 -->
    <el-dialog
      v-model="variationsDialogVisible"
      title="多版本内容"
      width="80%"
      :before-close="handleVariationsClose"
    >
      <div class="variations-content">
        <el-tabs v-model="activeVariation" type="card">
          <el-tab-pane
            v-for="(variation, index) in variations"
            :key="index"
            :label="`版本 ${index + 1}`"
            :name="index.toString()"
          >
            <div class="variation-item">
              <div class="variation-meta">
                <el-tag :type="variation.type === 'formal' ? 'primary' : variation.type === 'casual' ? 'success' : 'warning'">
                  {{ variation.style }}
                </el-tag>
                <span class="variation-score">质量评分: {{ variation.score }}/100</span>
              </div>
              <el-input
                v-model="variation.content"
                type="textarea"
                :rows="12"
                class="variation-textarea"
              />
              <div class="variation-actions">
                <el-button size="small" @click="copyVariation(variation.content)">
                  复制内容
                </el-button>
                <el-button size="small" type="primary" @click="useVariation(variation.content)">
                  使用此版本
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, CopyDocument, Shield, Collection } from '@element-plus/icons-vue'
import ContentOptimizer from '@/components/ContentOpt/ContentOptimizer.vue'
import DuplicationChecker from '@/components/ContentOpt/DuplicationChecker.vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'

interface Variation {
  content: string
  style: string
  type: 'formal' | 'casual' | 'creative'
  score: number
}

const aiConfigStore = useAIConfigStore()

const content = ref('')
const processing = ref(false)
const generatingVariations = ref(false)
const avoidingDetection = ref(false)
const variationsDialogVisible = ref(false)
const activeVariation = ref('0')
const variations = ref<Variation[]>([])

const optimizerRef = ref()
const checkerRef = ref()

const selectedConfig = computed(() => aiConfigStore.activeConfig)

const wordCount = computed(() => {
  return content.value.replace(/\s/g, '').length
})

const paragraphCount = computed(() => {
  return content.value.split('\n\n').filter(p => p.trim()).length
})

const sentenceCount = computed(() => {
  return content.value.split(/[。！？.!?]/).filter(s => s.trim()).length
})

const readingTime = computed(() => {
  // 假设每分钟阅读300字
  return Math.ceil(wordCount.value / 300)
})

const hasWritingContent = computed(() => {
  // 检查是否有写作工作流的内容可以导入
  const savedArticles = JSON.parse(localStorage.getItem('saved-articles') || '[]')
  return savedArticles.length > 0
})

onMounted(() => {
  // 检查是否有从写作工作流传递过来的内容
  const urlParams = new URLSearchParams(window.location.search)
  const importContent = urlParams.get('content')
  if (importContent) {
    content.value = decodeURIComponent(importContent)
  }
})

const handleContentUpdate = (newContent: string) => {
  content.value = newContent
}

const importFromWriting = () => {
  const savedArticles = JSON.parse(localStorage.getItem('saved-articles') || '[]')
  if (savedArticles.length === 0) {
    ElMessage.warning('没有找到可导入的文章')
    return
  }
  
  // 导入最新的文章
  const latestArticle = savedArticles[savedArticles.length - 1]
  content.value = latestArticle.content
  ElMessage.success('文章内容导入成功')
}

const exportContent = () => {
  if (!content.value.trim()) {
    ElMessage.warning('没有内容可导出')
    return
  }
  
  const blob = new Blob([content.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `优化内容_${new Date().getTime()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('内容导出成功')
}

const optimizeAndCheck = async () => {
  if (!content.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  
  processing.value = true
  try {
    // 先进行内容优化
    await optimizerRef.value?.optimizeContent()
    
    // 等待一秒后进行查重检测
    await new Promise(resolve => setTimeout(resolve, 1000))
    await checkerRef.value?.checkDuplication()
    
    ElMessage.success('优化和查重完成')
  } catch (error) {
    console.error('批量操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    processing.value = false
  }
}

const generateVariations = async () => {
  if (!content.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  
  if (!selectedConfig.value) {
    ElMessage.warning('请先配置AI接口')
    return
  }
  
  generatingVariations.value = true
  try {
    const styles = [
      { style: '正式风格', type: 'formal' as const, prompt: '请将以下内容改写为正式、专业的风格' },
      { style: '轻松风格', type: 'casual' as const, prompt: '请将以下内容改写为轻松、亲切的风格' },
      { style: '创意风格', type: 'creative' as const, prompt: '请将以下内容改写为富有创意、生动的风格' }
    ]
    
    const newVariations: Variation[] = []
    
    for (const style of styles) {
      const prompt = `${style.prompt}，保持核心意思不变：\n\n${content.value}`
      
      const result = await aiService.generateText(
        selectedConfig.value,
        prompt,
        {
          temperature: 0.8,
          maxTokens: 2000
        }
      )
      
      newVariations.push({
        content: result,
        style: style.style,
        type: style.type,
        score: Math.floor(Math.random() * 20) + 80 // 模拟评分
      })
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    variations.value = newVariations
    variationsDialogVisible.value = true
    ElMessage.success('多版本内容生成完成')
  } catch (error) {
    console.error('生成多版本失败:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    generatingVariations.value = false
  }
}

const aiDetectionAvoidance = async () => {
  if (!content.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  
  if (!selectedConfig.value) {
    ElMessage.warning('请先配置AI接口')
    return
  }
  
  avoidingDetection.value = true
  try {
    const prompt = `请重写以下内容，使其更像人类写作，降低AI检测风险：\n\n${content.value}\n\n要求：\n1. 变换句式结构，避免机械化表述\n2. 增加个人化表达和情感色彩\n3. 使用多样化的词汇和表达方式\n4. 保持内容的自然流畅\n5. 维持原文的核心观点和信息`
    
    const result = await aiService.generateText(
      selectedConfig.value,
      prompt,
      {
        temperature: 0.9,
        maxTokens: 2000
      }
    )
    
    content.value = result
    ElMessage.success('AI检测规避处理完成')
  } catch (error) {
    console.error('AI检测规避失败:', error)
    ElMessage.error('处理失败，请重试')
  } finally {
    avoidingDetection.value = false
  }
}

const saveToLibrary = () => {
  if (!content.value.trim()) {
    ElMessage.warning('没有内容可保存')
    return
  }
  
  const library = JSON.parse(localStorage.getItem('content-library') || '[]')
  const newItem = {
    id: `content-${Date.now()}`,
    content: content.value,
    title: content.value.substring(0, 50) + '...',
    createdAt: new Date().toISOString(),
    tags: ['优化内容'],
    wordCount: wordCount.value
  }
  
  library.push(newItem)
  localStorage.setItem('content-library', JSON.stringify(library))
  
  ElMessage.success('内容已保存到素材库')
}

const copyVariation = async (variationContent: string) => {
  try {
    await navigator.clipboard.writeText(variationContent)
    ElMessage.success('内容已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const useVariation = (variationContent: string) => {
  content.value = variationContent
  variationsDialogVisible.value = false
  ElMessage.success('已应用选中的版本')
}

const handleVariationsClose = () => {
  variationsDialogVisible.value = false
}
</script>

<style scoped>
.content-opt-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.input-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.content-input {
  margin-bottom: 16px;
}

.content-input :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.6;
  font-family: 'Microsoft YaHei', sans-serif;
}

.content-stats {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.action-card {
  margin-top: 20px;
}

.batch-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.variations-content {
  min-height: 500px;
}

.variation-item {
  padding: 16px;
}

.variation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.variation-score {
  color: #606266;
  font-size: 14px;
}

.variation-textarea {
  margin-bottom: 12px;
}

.variation-textarea :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.6;
}

.variation-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .content-opt-view {
    padding: 12px;
  }
  
  .batch-actions {
    flex-direction: column;
  }
  
  .batch-actions .el-button {
    width: 100%;
  }
}
</style>