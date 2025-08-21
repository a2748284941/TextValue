<template>
  <div class="content-optimizer">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>内容优化</span>
          <el-button
            v-if="optimizedContent"
            type="success"
            size="small"
            @click="applyOptimization"
          >
            应用优化
          </el-button>
        </div>
      </template>

      <div class="optimization-controls">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-select
              v-model="optimizationType"
              placeholder="选择优化类型"
              style="width: 100%"
            >
              <el-option label="语言润色" value="polish" />
              <el-option label="逻辑优化" value="logic" />
              <el-option label="SEO优化" value="seo" />
              <el-option label="可读性提升" value="readability" />
              <el-option label="AI检测规避" value="ai-detection" />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-button
              type="primary"
              @click="optimizeContent"
              :loading="optimizing"
              :disabled="!originalContent"
              style="width: 100%"
            >
              开始优化
            </el-button>
          </el-col>
        </el-row>
      </div>

      <div v-if="!originalContent" class="empty-state">
        <el-empty description="请先输入需要优化的内容" />
      </div>

      <div v-if="originalContent" class="content-comparison">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="content-section">
              <div class="section-header">
                <h4>原始内容</h4>
                <el-tag size="small">{{ originalWordCount }} 字</el-tag>
              </div>
              <el-input
                v-model="originalContent"
                type="textarea"
                :rows="15"
                placeholder="请输入需要优化的内容"
                class="content-textarea"
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="content-section">
              <div class="section-header">
                <h4>优化后内容</h4>
                <el-tag v-if="optimizedContent" type="success" size="small">
                  {{ optimizedWordCount }} 字
                </el-tag>
              </div>
              <div v-if="optimizing" class="optimizing-state">
                <el-skeleton :rows="15" animated />
                <div class="optimizing-text">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  正在优化内容...
                </div>
              </div>
              <el-input
                v-else
                v-model="optimizedContent"
                type="textarea"
                :rows="15"
                placeholder="优化后的内容将显示在这里"
                class="content-textarea"
                readonly
              />
            </div>
          </el-col>
        </el-row>
      </div>

      <div v-if="optimizedContent" class="optimization-analysis">
        <el-divider content-position="left">优化分析</el-divider>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-statistic
              title="字数变化"
              :value="wordCountChange"
              :value-style="{ color: wordCountChange > 0 ? '#67c23a' : '#f56c6c' }"
              :prefix="wordCountChange > 0 ? '+' : ''"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="可读性评分"
              :value="readabilityScore"
              suffix="/100"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="SEO友好度"
              :value="seoScore"
              suffix="/100"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="AI检测风险"
              :value="aiDetectionRisk"
              suffix="%"
              :value-style="{ color: aiDetectionRisk < 30 ? '#67c23a' : aiDetectionRisk < 60 ? '#e6a23c' : '#f56c6c' }"
            />
          </el-col>
        </el-row>

        <div class="optimization-suggestions">
          <h4>优化建议</h4>
          <el-timeline>
            <el-timeline-item
              v-for="suggestion in suggestions"
              :key="suggestion.id"
              :type="suggestion.type"
              :timestamp="suggestion.category"
            >
              {{ suggestion.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'

interface Props {
  content: string
}

interface Emits {
  (e: 'update:content', content: string): void
}

interface Suggestion {
  id: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  category: string
  content: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const aiConfigStore = useAIConfigStore()

const originalContent = ref(props.content || '')
const optimizedContent = ref('')
const optimizationType = ref('polish')
const optimizing = ref(false)

const readabilityScore = ref(0)
const seoScore = ref(0)
const aiDetectionRisk = ref(0)
const suggestions = ref<Suggestion[]>([])

const selectedConfig = computed(() => aiConfigStore.activeConfig)

const originalWordCount = computed(() => {
  return originalContent.value.replace(/\s/g, '').length
})

const optimizedWordCount = computed(() => {
  return optimizedContent.value.replace(/\s/g, '').length
})

const wordCountChange = computed(() => {
  return optimizedWordCount.value - originalWordCount.value
})

watch(
  () => props.content,
  (newContent) => {
    originalContent.value = newContent
  }
)

const optimizeContent = async () => {
  if (!originalContent.value.trim()) {
    ElMessage.warning('请输入需要优化的内容')
    return
  }

  if (!selectedConfig.value) {
    ElMessage.warning('请先配置AI接口')
    return
  }

  optimizing.value = true
  try {
    const optimizationPrompts = {
      polish: `请对以下文本进行语言润色，使其更加流畅自然：\n\n${originalContent.value}\n\n要求：\n1. 保持原意不变\n2. 提升语言表达质量\n3. 修正语法错误\n4. 优化句式结构`,
      logic: `请优化以下文本的逻辑结构，使其更加清晰有条理：\n\n${originalContent.value}\n\n要求：\n1. 理清逻辑关系\n2. 调整段落顺序\n3. 增强论证力度\n4. 完善过渡衔接`,
      seo: `请对以下文本进行SEO优化，提升搜索引擎友好度：\n\n${originalContent.value}\n\n要求：\n1. 合理分布关键词\n2. 优化标题结构\n3. 增加相关词汇\n4. 提升内容质量`,
      readability: `请提升以下文本的可读性，使其更易理解：\n\n${originalContent.value}\n\n要求：\n1. 简化复杂句式\n2. 使用通俗词汇\n3. 增加段落层次\n4. 提升阅读体验`,
      'ai-detection': `请重写以下文本，降低AI检测风险，使其更像人类写作：\n\n${originalContent.value}\n\n要求：\n1. 变换句式结构\n2. 增加个人化表达\n3. 使用多样化词汇\n4. 保持自然语调\n5. 避免机械化表述`
    }

    const prompt = optimizationPrompts[optimizationType.value as keyof typeof optimizationPrompts]
    
    const result = await aiService.generateText(
      selectedConfig.value,
      prompt,
      {
        temperature: 0.8,
        maxTokens: 2000
      }
    )

    optimizedContent.value = result
    
    // 模拟分析结果
    await analyzeOptimization()
    
    ElMessage.success('内容优化完成')
  } catch (error) {
    console.error('优化失败:', error)
    ElMessage.error('优化失败，请重试')
  } finally {
    optimizing.value = false
  }
}

const analyzeOptimization = async () => {
  // 模拟分析过程
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 计算各项指标
  readabilityScore.value = Math.floor(Math.random() * 20) + 75
  seoScore.value = Math.floor(Math.random() * 25) + 70
  aiDetectionRisk.value = Math.floor(Math.random() * 40) + 20
  
  // 生成建议
  suggestions.value = [
    {
      id: '1',
      type: 'success',
      category: '语言质量',
      content: '文本流畅度显著提升，语法错误已修正'
    },
    {
      id: '2',
      type: 'primary',
      category: '结构优化',
      content: '段落层次更加清晰，逻辑关系得到改善'
    },
    {
      id: '3',
      type: 'warning',
      category: 'SEO建议',
      content: '建议增加2-3个相关长尾关键词'
    },
    {
      id: '4',
      type: 'info',
      category: 'AI检测',
      content: 'AI检测风险已降低，建议进一步个性化表达'
    }
  ]
}

const applyOptimization = () => {
  emit('update:content', optimizedContent.value)
  ElMessage.success('优化内容已应用')
}

// 暴露方法给父组件
defineExpose({
  optimizeContent
})
</script>

<style scoped>
.content-optimizer {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.optimization-controls {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.content-comparison {
  margin-bottom: 20px;
}

.content-section {
  height: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.content-textarea {
  height: 100%;
}

.content-textarea :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.6;
  font-family: 'Microsoft YaHei', sans-serif;
}

.optimizing-state {
  position: relative;
}

.optimizing-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #409eff;
  font-size: 14px;
  z-index: 10;
}

.optimizing-text .el-icon {
  margin-right: 8px;
}

.optimization-analysis {
  margin-top: 20px;
}

.optimization-suggestions {
  margin-top: 20px;
}

.optimization-suggestions h4 {
  margin-bottom: 16px;
  color: #303133;
}

:deep(.el-timeline-item__timestamp) {
  font-weight: bold;
  color: #409eff;
}
</style>