<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
  >
    <el-form-item label="平台名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入平台名称" />
    </el-form-item>
    
    <el-form-item label="平台类型" prop="type">
      <el-select v-model="formData.type" placeholder="请选择平台类型" style="width: 100%">
        <el-option label="OpenAI" value="openai" />
        <el-option label="Claude" value="claude" />
        <el-option label="Gemini" value="gemini" />
        <el-option label="自定义" value="custom" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="API地址" prop="baseUrl">
      <el-input v-model="formData.baseUrl" placeholder="请输入API基础地址" />
    </el-form-item>
    
    <el-form-item label="API密钥" prop="apiKey">
      <el-input
        v-model="formData.apiKey"
        type="password"
        placeholder="请输入API密钥"
        show-password
      />
    </el-form-item>
    
    <el-form-item label="请求头配置">
      <div class="headers-config">
        <div
          v-for="(header, index) in formData.headers"
          :key="index"
          class="header-item"
        >
          <el-input
            v-model="header.key"
            placeholder="Header名称"
            style="width: 40%"
          />
          <el-input
            v-model="header.value"
            placeholder="Header值"
            style="width: 40%; margin-left: 10px"
          />
          <el-button
            type="danger"
            size="small"
            @click="removeHeader(index)"
            style="margin-left: 10px"
          >
            删除
          </el-button>
        </div>
        <el-button type="primary" size="small" @click="addHeader">
          添加Header
        </el-button>
      </div>
    </el-form-item>
    
    <el-form-item label="超时时间(秒)" prop="timeout">
      <el-input-number
        v-model="formData.timeout"
        :min="1"
        :max="300"
        style="width: 100%"
      />
    </el-form-item>
    
    <el-form-item label="最大重试次数" prop="maxRetries">
      <el-input-number
        v-model="formData.maxRetries"
        :min="0"
        :max="10"
        style="width: 100%"
      />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="handleSave">保存</el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { AIConfig } from '@/types/ai'

interface Props {
  config?: AIConfig | null
}

interface Emits {
  save: [config: Partial<AIConfig>]
  cancel: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

const formData = reactive({
  name: '',
  type: 'openai' as const,
  baseUrl: '',
  apiKey: '',
  headers: [] as Array<{ key: string; value: string }>,
  timeout: 30,
  maxRetries: 3
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入平台名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择平台类型', trigger: 'change' }
  ],
  baseUrl: [
    { required: true, message: '请输入API地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ]
}

const addHeader = () => {
  formData.headers.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  formData.headers.splice(index, 1)
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const config: Partial<AIConfig> = {
      name: formData.name,
      type: formData.type,
      baseUrl: formData.baseUrl,
      apiKey: formData.apiKey,
      headers: formData.headers.filter(h => h.key && h.value),
      timeout: formData.timeout,
      maxRetries: formData.maxRetries
    }
    
    emit('save', config)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  emit('cancel')
}

// 监听props变化，初始化表单数据
watch(
  () => props.config,
  (config) => {
    if (config) {
      Object.assign(formData, {
        name: config.name,
        type: config.type,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        headers: config.headers ? [...config.headers] : [],
        timeout: config.timeout || 30,
        maxRetries: config.maxRetries || 3
      })
    } else {
      // 重置表单
      Object.assign(formData, {
        name: '',
        type: 'openai',
        baseUrl: '',
        apiKey: '',
        headers: [],
        timeout: 30,
        maxRetries: 3
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.headers-config {
  width: 100%;
}

.header-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>