// AI平台配置接口
export interface AIConfig {
  id: string
  name: string // 平台名称
  apiEndpoint: string // API端点
  apiKey: string // 鉴权密钥
  modelIdentifier: string // 模型标识符
  isActive: boolean // 是否启用
  createdAt: Date
  updatedAt: Date
}

// AI模型信息
export interface AIModel {
  id: string
  name: string
  description?: string
  capabilities: ModelCapability[]
  maxTokens?: number
  costPer1kTokens?: number
}

// 模型能力枚举
export enum ModelCapability {
  TEXT_GENERATION = 'text_generation',
  CONVERSATION = 'conversation',
  SUMMARIZATION = 'summarization',
  TRANSLATION = 'translation',
  CODE_GENERATION = 'code_generation'
}

// API响应接口
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean
  latency?: number
  error?: string
  models?: AIModel[]
}

// AI请求参数
export interface AIRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  topP?: number
  model?: string
}

// AI响应
export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}