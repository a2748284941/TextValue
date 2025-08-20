<template>
  <div class="article-generation">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>文章生成</span>
          <div class="header-actions">
            <el-button
              v-if="article.content"
              type="success"
              size="small"
              @click="exportArticle"
            >
              导出文章
            </el-button>
            <el-button
              v-if="article.content"
              type="primary"
              size="small"
              @click="regenerateArticle"
              :loading="generating"
            >
              重新生成
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="!article.content && !generating" class="empty-state">
        <el-empty description="请先完成大纲设计，然后点击生成文章">
          <el-button
            type="primary"
            @click="generateArticle"
            :disabled="!outline.length"
          >
            生成文章
          </el-button>
        </el-empty>
      </div>

      <div v-if="generating" class="generating-state">
        <div class="progress-info">
          <el-progress
            :percentage="progress"
            :status="progress === 100 ? 'success' : undefined"
          />
          <div class="progress-text">
            {{ progressText }}
          </div>
        </div>
        <el-skeleton :rows="8" animated />
      </div>

      <div v-if="article.content" class="article-content">
        <div class="article-meta">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-statistic title="字数统计" :value="wordCount" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="段落数" :value="paragraphCount" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="生成时间" :value="generateTime" suffix="秒" />
            </el-col>
          </el-row>
        </div>

        <div class="article-editor">
          <el-input
            v-model="article.title"
            placeholder="文章标题"
            class="article-title-input"
            size="large"
          />
          <el-input
            v-model="article.content"
            type="textarea"
            :rows="20"
            placeholder="文章内容"
            class="article-content-input"
          />
        </div>

        <div class="article-actions">
          <el-button @click="optimizeContent" type="warning">
            <el-icon><Magic /></el-icon>
            内容优化
          </el-button>
          <el-button @click="checkDuplication" type="info">
            <el-icon><Search /></el-icon>
            查重检测
          </el-button>
          <el-button @click="saveArticle" type="success">
            <el-icon><Document /></el-icon>
            保存文章
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, Search, Document } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'
import type { OutlineItem, Article } from '@/types/article'

interface Props {
  selectedTitle: string
  keywords: string[]
  outline: OutlineItem[]
}

interface Emits {
  (e: 'update:article', article: Article): void
  (e: 'optimize-content'): void
  (e: 'check-duplication'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const aiConfigStore = useAIConfigStore()

const article = ref<Article>({
  id: '',
  title: '',
  content: '',
  keywords: [],
  outline: [],
  createdAt: new Date(),
  updatedAt: new Date()
})

const generating = ref(false)
const progress = ref(0)
const progressText = ref('')
const generateTime = ref(0)

const selectedConfig = computed(() => aiConfigStore.selectedConfig)

const wordCount = computed(() => {
  return article.value.content.replace(/\s/g, '').length
})

const paragraphCount = computed(() => {
  return article.value.content.split('\n\n').filter(p => p.trim()).length
})

watch(
  () => article.value,
  (newArticle) => {
    emit('update:article', newArticle)
  },
  { deep: true }
)

const generateArticle = async () => {
  if (!props.outline.length) {
    ElMessage.warning('请先生成大纲')
    return
  }

  if (!selectedConfig.value) {
    ElMessage.warning('请先配置AI接口')
    return
  }

  generating.value = true
  progress.value = 0
  const startTime = Date.now()

  try {
    // 分段生成文章
    let fullContent = ''
    const totalSteps = props.outline.length

    for (let i = 0; i < props.outline.length; i++) {
      const outlineItem = props.outline[i]
      progressText.value = `正在生成第${i + 1}部分：${outlineItem.title}`
      progress.value = Math.round(((i + 1) / totalSteps) * 100)

      const prompt = `请根据以下大纲项生成详细的文章段落：

大纲标题：${outlineItem.title}
大纲描述：${outlineItem.description}
文章主题：${props.selectedTitle}
关键词：${props.keywords.join('、')}

要求：
1. 内容详实，逻辑清晰
2. 自然融入关键词
3. 段落长度适中（200-400字）
4. 语言流畅，符合主题
5. 只返回段落内容，不要标题

${i === 0 ? '这是文章的开头部分，需要引人入胜。' : ''}
${i === props.outline.length - 1 ? '这是文章的结尾部分，需要总结升华。' : ''}`

      const sectionContent = await aiService.generateText(
        selectedConfig.value,
        prompt,
        {
          temperature: 0.8,
          maxTokens: 800
        }
      )

      fullContent += `\n\n## ${outlineItem.title}\n\n${sectionContent}`

      // 模拟进度更新
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 设置文章内容
    article.value = {
      id: `article-${Date.now()}`,
      title: props.selectedTitle,
      content: fullContent.trim(),
      keywords: props.keywords,
      outline: props.outline,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    generateTime.value = Math.round((Date.now() - startTime) / 1000)
    ElMessage.success('文章生成成功')
  } catch (error) {
    console.error('生成文章失败:', error)
    ElMessage.error('生成文章失败，请重试')
  } finally {
    generating.value = false
    progress.value = 100
    progressText.value = '生成完成'
  }
}

const regenerateArticle = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重新生成文章吗？当前内容将被覆盖。',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    article.value.content = ''
    generateArticle()
  } catch {
    // 用户取消
  }
}

const optimizeContent = () => {
  emit('optimize-content')
}

const checkDuplication = () => {
  emit('check-duplication')
}

const saveArticle = () => {
  // 保存到本地存储或发送到服务器
  const articles = JSON.parse(localStorage.getItem('saved-articles') || '[]')
  const existingIndex = articles.findIndex((a: Article) => a.id === article.value.id)
  
  if (existingIndex >= 0) {
    articles[existingIndex] = { ...article.value, updatedAt: new Date() }
  } else {
    articles.push(article.value)
  }
  
  localStorage.setItem('saved-articles', JSON.stringify(articles))
  ElMessage.success('文章保存成功')
}

const exportArticle = () => {
  const content = `# ${article.value.title}\n\n${article.value.content}`
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${article.value.title || '文章'}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('文章导出成功')
}

// 暴露方法给父组件
defineExpose({
  generateArticle,
  regenerateArticle
})
</script>

<style scoped>
.article-generation {
  margin-top: 20px;
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

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.generating-state {
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

.article-content {
  min-height: 400px;
}

.article-meta {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.article-editor {
  margin-bottom: 20px;
}

.article-title-input {
  margin-bottom: 16px;
}

.article-title-input :deep(.el-input__inner) {
  font-size: 18px;
  font-weight: bold;
}

.article-content-input {
  font-family: 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
}

.article-content-input :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.8;
}

.article-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>