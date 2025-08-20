<template>
  <div class="writing-view">
    <el-steps :active="currentStep" align-center class="writing-steps">
      <el-step title="关键词输入" description="输入文章主题和关键词" />
      <el-step title="标题生成" description="AI生成多个标题选项" />
      <el-step title="大纲生成" description="生成文章结构大纲" />
      <el-step title="内容生成" description="生成完整文章内容" />
      <el-step title="内容优化" description="AI检测规避和去重" />
    </el-steps>

    <div class="writing-content">
      <!-- 关键词输入阶段 -->
      <KeywordInput
        v-if="currentStep === 0"
        @next="handleKeywordNext"
      />
      
      <!-- 标题生成阶段 -->
      <TitleGeneration
        v-if="currentStep === 1"
        :keywords="writingData.keywords"
        @next="handleTitleNext"
        @back="currentStep--"
      />
      
      <!-- 大纲生成阶段 -->
      <OutlineGeneration
        v-if="currentStep === 2"
        :title="writingData.title"
        :keywords="writingData.keywords"
        @next="handleOutlineNext"
        @back="currentStep--"
      />
      
      <!-- 内容生成阶段 -->
      <ArticleGeneration
        v-if="currentStep === 3"
        :title="writingData.title"
        :outline="writingData.outline"
        :keywords="writingData.keywords"
        @next="handleContentNext"
        @back="currentStep--"
      />
      
      <!-- 内容优化阶段 -->
      <ContentOptimizer
        v-if="currentStep === 4"
        :content="writingData.content"
        @finish="handleFinish"
        @back="currentStep--"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import KeywordInput from '@/components/WritingFlow/KeywordInput.vue'
import TitleGeneration from '@/components/WritingFlow/TitleGeneration.vue'
import OutlineGeneration from '@/components/WritingFlow/OutlineGeneration.vue'
import ArticleGeneration from '@/components/WritingFlow/ArticleGeneration.vue'
import ContentOptimizer from '@/components/ContentOpt/ContentOptimizer.vue'

const currentStep = ref(0)
const writingData = reactive({
  keywords: '',
  title: '',
  outline: '',
  content: ''
})

const handleKeywordNext = (keywords: string) => {
  writingData.keywords = keywords
  currentStep.value = 1
}

const handleTitleNext = (title: string) => {
  writingData.title = title
  currentStep.value = 2
}

const handleOutlineNext = (outline: string) => {
  writingData.outline = outline
  currentStep.value = 3
}

const handleContentNext = (content: string) => {
  writingData.content = content
  currentStep.value = 4
}

const handleFinish = () => {
  // 完成写作流程
  console.log('写作完成:', writingData)
}
</script>

<style scoped>
.writing-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.writing-steps {
  margin-bottom: 40px;
}

.writing-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>