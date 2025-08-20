<template>
  <div class="title-generation">
    <el-card class="generation-card">
      <template #header>
        <div class="card-header">
          <h3>标题生成</h3>
          <p>AI正在为您生成多个标题选项，请选择最合适的一个</p>
        </div>
      </template>
      
      <div class="generation-content">
        <div class="keyword-info">
          <el-tag type="info" size="large">主题：{{ parsedKeywords.topic }}</el-tag>
          <el-tag type="primary" size="large" style="margin-left: 10px">
            类型：{{ getArticleTypeLabel(parsedKeywords.articleType) }}
          </el-tag>
        </div>
        
        <div class="generation-actions">
          <el-button type="primary" @click="generateTitles" :loading="generating">
            <el-icon><Refresh /></el-icon>
            {{ generating ? '生成中...' : '重新生成标题' }}
          </el-button>
          <el-button @click="$emit('back')">
            <el-icon><ArrowLeft /></el-icon>
            返回上一步
          </el-button>
        </div>
        
        <div v-if="titles.length > 0" class="titles-list">
          <h4>请选择一个标题：</h4>
          <el-radio-group v-model="selectedTitle" class="title-options">
            <div v-for="(title, index) in titles" :key="index" class="title-option">
              <el-radio :value="title" class="title-radio">
                <div class="title-content">
                  <span class="title-text">{{ title }}</span>
                  <div class="title-meta">
                    <el-tag size="small">{{ title.length }}字</el-tag>
                    <el-rate
                      v-model="titleRatings[index]"
                      size="small"
                      show-score
                      text-color="#ff9900"
                      score-template="{value}分"
                    />
                  </div>
                </div>
              </el-radio>
            </div>
          </el-radio-group>
          
          <div class="custom-title">
            <el-divider>或者自定义标题</el-divider>
            <el-input
              v-model="customTitle"
              placeholder="输入自定义标题"
              maxlength="100"
              show-word-limit
            />
          </div>
          
          <div class="next-actions">
            <el-button type="primary" @click="handleNext" :disabled="!finalTitle">
              下一步：生成大纲
            </el-button>
          </div>
        </div>
        
        <div v-else-if="!generating" class="empty-state">
          <el-empty description="点击上方按钮开始生成标题" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, ArrowLeft } from '@element-plus/icons-vue'
import { aiService } from '@/services/aiService'
import { useAIConfigStore } from '@/stores/aiConfig'

interface Props {
  keywords: string
}

interface Emits {
  next: [title: string]
  back: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const aiConfigStore = useAIConfigStore()
const generating = ref(false)
const titles = ref<string[]>([])
const selectedTitle = ref('')
const customTitle = ref('')
const titleRatings = ref<number[]>([])

const parsedKeywords = computed(() => {
  try {
    return JSON.parse(props.keywords)
  } catch {
    return { topic: '', keywords: '', articleType: 'technical', wordCount: 1500, style: 'professional' }
  }
})

const finalTitle = computed(() => {
  return customTitle.value || selectedTitle.value
})

const getArticleTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'technical': '技术文章',
    'news': '新闻资讯',
    'product': '产品介绍',
    'tutorial': '教程指南',
    'opinion': '观点评论',
    'other': '其他'
  }
  return typeMap[type] || '其他'
}

const generateTitles = async () => {
  generating.value = true
  try {
    const activeConfig = aiConfigStore.configs.find(c => c.status === 'active')
    if (!activeConfig) {
      ElMessage.error('请先配置并激活AI平台')
      return
    }
    
    const prompt = `请为以下主题生成5个吸引人的文章标题：
主题：${parsedKeywords.value.topic}
关键词：${parsedKeywords.value.keywords}
文章类型：${getArticleTypeLabel(parsedKeywords.value.articleType)}
写作风格：${parsedKeywords.value.style}

要求：
1. 标题要吸引人且准确反映主题
2. 长度控制在10-30字之间
3. 符合${getArticleTypeLabel(parsedKeywords.value.articleType)}的特点
4. 请直接返回5个标题，每行一个，不要编号`
    
    const response = await aiService.generateText(activeConfig, {
      prompt,
      maxTokens: 200,
      temperature: 0.8
    })
    
    if (response) {
      const generatedTitles = response.split('\n')
        .map(title => title.trim())
        .filter(title => title.length > 0)
        .slice(0, 5)
      
      titles.value = generatedTitles
      titleRatings.value = new Array(generatedTitles.length).fill(4)
      selectedTitle.value = ''
      customTitle.value = ''
      
      ElMessage.success('标题生成成功')
    }
  } catch (error) {
    ElMessage.error('标题生成失败，请重试')
    console.error('标题生成失败:', error)
  } finally {
    generating.value = false
  }
}

const handleNext = () => {
  if (!finalTitle.value) {
    ElMessage.warning('请选择或输入一个标题')
    return
  }
  
  emit('next', finalTitle.value)
  ElMessage.success('标题已确认，开始生成大纲')
}

onMounted(() => {
  generateTitles()
})
</script>

<style scoped>
.title-generation {
  max-width: 900px;
  margin: 0 auto;
}

.generation-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.keyword-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.generation-actions {
  margin-bottom: 20px;
  text-align: center;
}

.generation-actions .el-button {
  margin: 0 10px;
}

.titles-list h4 {
  margin: 20px 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.title-options {
  width: 100%;
}

.title-option {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s;
}

.title-option:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.title-radio {
  width: 100%;
}

.title-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
  color: #303133;
}

.title-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-title {
  margin: 30px 0;
}

.next-actions {
  text-align: center;
  margin-top: 30px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}
</style>