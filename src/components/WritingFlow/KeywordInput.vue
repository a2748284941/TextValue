<template>
  <div class="keyword-input">
    <el-card class="input-card">
      <template #header>
        <h3>关键词输入</h3>
        <p>请输入文章主题和相关关键词，AI将基于这些信息生成文章</p>
      </template>
      
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="文章主题" prop="topic">
          <el-input
            v-model="formData.topic"
            placeholder="请输入文章的主要主题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="formData.keywords"
            type="textarea"
            :rows="4"
            placeholder="请输入相关关键词，用逗号分隔（如：人工智能,机器学习,深度学习）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="文章类型">
          <el-select v-model="formData.articleType" placeholder="选择文章类型" style="width: 100%">
            <el-option label="技术文章" value="technical" />
            <el-option label="新闻资讯" value="news" />
            <el-option label="产品介绍" value="product" />
            <el-option label="教程指南" value="tutorial" />
            <el-option label="观点评论" value="opinion" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标字数">
          <el-slider
            v-model="formData.wordCount"
            :min="500"
            :max="5000"
            :step="100"
            show-stops
            show-input
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="写作风格">
          <el-radio-group v-model="formData.style">
            <el-radio value="formal">正式</el-radio>
            <el-radio value="casual">轻松</el-radio>
            <el-radio value="professional">专业</el-radio>
            <el-radio value="creative">创意</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleNext" :loading="loading">
            下一步：生成标题
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

interface Emits {
  next: [keywords: string]
}

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  topic: '',
  keywords: '',
  articleType: 'technical',
  wordCount: 1500,
  style: 'professional'
})

const rules: FormRules = {
  topic: [
    { required: true, message: '请输入文章主题', trigger: 'blur' },
    { min: 5, max: 100, message: '主题长度应在5-100字符之间', trigger: 'blur' }
  ],
  keywords: [
    { required: true, message: '请输入关键词', trigger: 'blur' },
    { min: 3, max: 500, message: '关键词长度应在3-500字符之间', trigger: 'blur' }
  ]
}

const handleNext = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 构建完整的关键词信息
    const keywordData = {
      topic: formData.topic,
      keywords: formData.keywords,
      articleType: formData.articleType,
      wordCount: formData.wordCount,
      style: formData.style
    }
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('next', JSON.stringify(keywordData))
    ElMessage.success('关键词信息已保存，开始生成标题')
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.keyword-input {
  max-width: 800px;
  margin: 0 auto;
}

.input-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.input-card :deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.input-card h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.input-card p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}
</style>