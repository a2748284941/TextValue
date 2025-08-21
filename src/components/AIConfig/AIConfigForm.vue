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
    
    <el-form-item label="API地址" prop="apiEndpoint">
      <el-input v-model="formData.apiEndpoint" placeholder="请输入API基础地址（如：https://api.openai.com）" />
    </el-form-item>
    
    <el-form-item label="API密钥" prop="apiKey">
      <el-input
        v-model="formData.apiKey"
        type="password"
        placeholder="请输入API密钥"
        show-password
      />
    </el-form-item>
    
    <el-form-item label="启用状态">
      <el-switch v-model="formData.isActive" />
    </el-form-item>
    
    <!-- 自定义请求头配置（仅在自定义平台时显示） -->
    <el-form-item v-if="formData.type === 'custom'" label="自定义请求头">
      <div class="headers-config">
        <div
          v-for="(header, index) in formData.customHeaders"
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
            @click="removeCustomHeader(index)"
            style="margin-left: 10px"
          >
            删除
          </el-button>
        </div>
        <el-button type="primary" size="small" @click="addCustomHeader">
          添加自定义Header
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
  apiEndpoint: '',
  apiKey: '',
  isActive: true,
  customHeaders: [] as Array<{ key: string; value: string }>,
  timeout: 30,
  maxRetries: 3
})

// 平台默认配置
const platformDefaults = {
  openai: {
    apiEndpoint: 'https://api.openai.com',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ]
  },
  claude: {
    apiEndpoint: 'https://api.anthropic.com',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'anthropic-version', value: '2023-06-01' }
    ]
  },
  gemini: {
    apiEndpoint: 'https://generativelanguage.googleapis.com',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ]
  },
  custom: {
    apiEndpoint: '',
    headers: []
  }
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入平台名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择平台类型', trigger: 'change' }
  ],
  apiEndpoint: [ // 改为 apiEndpoint
    { required: true, message: '请输入API地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ]
}

const addCustomHeader = () => {
  formData.customHeaders.push({ key: '', value: '' })
}

const removeCustomHeader = (index: number) => {
  formData.customHeaders.splice(index, 1)
}

// 根据平台类型设置默认配置
const setPlatformDefaults = (type: string) => {
  const defaults = platformDefaults[type as keyof typeof platformDefaults]
  if (defaults) {
    formData.apiEndpoint = defaults.apiEndpoint
    // 自定义平台不自动设置endpoint
    if (type === 'custom') {
      formData.apiEndpoint = ''
    }
  }
}

// 监听平台类型变化
watch(() => formData.type, (newType) => {
  setPlatformDefaults(newType)
})

let isSaving = false

const handleSave = async () => {
  if (!formRef.value || isSaving) return
  
  isSaving = true
  
  try {
    await formRef.value.validate()
    
    // 获取当前平台的默认headers
    const platformHeaders = platformDefaults[formData.type as keyof typeof platformDefaults]?.headers || []
    // 合并默认headers和自定义headers
    const allHeaders = [...platformHeaders, ...formData.customHeaders.filter(h => h.key && h.value)]
    
    const config: Partial<AIConfig> = {
      name: formData.name,
      type: formData.type,
      apiEndpoint: formData.apiEndpoint,
      apiKey: formData.apiKey,
      modelIdentifier: '',
      isActive: formData.isActive,
      headers: allHeaders,
      timeout: formData.timeout,
      maxRetries: formData.maxRetries
    }
    
    emit('save', config)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    // 延迟重置防抖标志，避免快速重复点击
    setTimeout(() => {
      isSaving = false
    }, 1000)
  }
}

// 分离平台默认headers和自定义headers
const separateHeaders = (allHeaders: Array<{ key: string; value: string }>, platformType: string) => {
  const platformHeaders = platformDefaults[platformType as keyof typeof platformDefaults]?.headers || []
  const customHeaders = allHeaders.filter(header => 
    !platformHeaders.some(ph => ph.key === header.key && ph.value === header.value)
  )
  return customHeaders
}

// 监听props变化，初始化表单数据
watch(
  () => props.config,
  (config) => {
    if (config) {
      const customHeaders = config.headers ? separateHeaders(config.headers, config.type) : []
      Object.assign(formData, {
        name: config.name,
        type: config.type,
        apiEndpoint: config.apiEndpoint,
        apiKey: config.apiKey,
        isActive: config.isActive !== undefined ? config.isActive : true,
        customHeaders: customHeaders,
        timeout: config.timeout || 30,
        maxRetries: config.maxRetries || 3
      })
    } else {
      // 重置表单并设置默认值
      Object.assign(formData, {
        name: '',
        type: 'openai',
        apiKey: '',
        isActive: true,
        customHeaders: [],
        timeout: 30,
        maxRetries: 3
      })
      // 设置平台默认配置
      setPlatformDefaults('openai')
    }
  },
  { immediate: true }
)
const handleCancel = () => {
  emit('cancel')
}
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