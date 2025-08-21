import axios, { type AxiosInstance } from 'axios'
import type { AIConfig, AIModel, AIRequest, AIResponse, APIResponse, ConnectionTestResult } from '@/types/ai'

class AIService {
  private logRequest(method: string, url: string, headers: Record<string, string>, data?: any): void {
    console.log('=== AI API 请求日志 ===')
    console.log('请求方法:', method)
    console.log('请求接口:', url)
    
    // 安全地显示请求头，隐藏敏感信息
    const safeHeaders = { ...headers }
    if (safeHeaders['Authorization']) {
      const authValue = safeHeaders['Authorization']
      if (authValue.startsWith('Bearer ')) {
        safeHeaders['Authorization'] = `Bearer ${authValue.substring(7, 17)}...`
      }
    }
    console.log('请求头:', JSON.stringify(safeHeaders, null, 2))
    
    if (data) {
      console.log('请求内容:', JSON.stringify(data, null, 2))
    }
    console.log('========================')
  }

  private createClient(config: AIConfig): AxiosInstance {
    // 构建headers对象
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`
    }
    
    // 添加配置中的自定义headers
    if (config.headers && config.headers.length > 0) {
      config.headers.forEach(header => {
        headers[header.key] = header.value
      })
    }
    
    // 如果没有Content-Type，添加默认值
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
    
    return axios.create({
      baseURL: config.apiEndpoint,
      headers,
      timeout: (config.timeout || 30) * 1000, // 转换为毫秒
      maxRetries: config.maxRetries || 3
    })
  }

  async testConnection(config: AIConfig): Promise<ConnectionTestResult> {
    console.log('AIService.testConnection 开始，配置:', config)
    
    try {
      console.log('创建HTTP客户端...')
      const client = this.createClient(config)
      console.log('HTTP客户端已创建，baseURL:', config.apiEndpoint)
      
      // 记录请求日志
      const url = `${config.apiEndpoint}/v1/models`
      const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
      this.logRequest('GET', url, headers)
      
      // 尝试获取模型列表来测试连接
      console.log('发送请求到 /v1/models...')
      const response = await client.get('/v1/models')
      console.log('收到响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      })
      
      if (response.status === 200) {
        console.log('响应成功，解析模型数据...')
        const models = this.parseModelsResponse(response.data)
        console.log('解析到的模型:', models)
        return {
          success: true,
          models
        }
      } else {
        console.log('响应状态异常:', response.status, response.statusText)
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      console.error('testConnection 捕获到错误:', error)
      const errorMessage = this.getErrorMessage(error)
      console.log('错误消息:', errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  async getModels(config: AIConfig): Promise<APIResponse<AIModel[]>> {
    try {
      const client = this.createClient(config)
      
      // 记录请求日志
      const url = `${config.apiEndpoint}/v1/models`
      const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
      this.logRequest('GET', url, headers)
      
      const response = await client.get('/v1/models')
      
      if (response.status === 200) {
        const models = this.parseModelsResponse(response.data)
        return {
          success: true,
          data: models
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  // 获取可用模型列表（直接返回模型数组）
  async getAvailableModels(config: AIConfig): Promise<AIModel[]> {
    const result = await this.getModels(config)
    if (result.success && result.data) {
      return result.data
    }
    throw new Error(result.error || '获取模型列表失败')
  }

  // 测试特定模型
  async testModel(config: AIConfig, modelId: string): Promise<boolean> {
    try {
      const client = this.createClient(config)
      
      // 发送一个简单的测试请求
      const testRequest = {
        model: modelId,
        messages: [{
          role: 'user',
          content: 'Hello'
        }],
        max_tokens: 10
      }
      
      const response = await client.post('/v1/chat/completions', testRequest)
      return response.status === 200
    } catch (error) {
      console.error('模型测试失败:', error)
      return false
    }
  }

  async generateText(config: AIConfig, request: AIRequest): Promise<APIResponse<AIResponse>> {
    try {
      const client = this.createClient(config)
      
      // 使用标准的Chat Completions API格式
      const payload = {
        model: request.model || config.modelIdentifier,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 1
      }

      // 记录请求日志
      const url = `${config.apiEndpoint}/v1/chat/completions`
      const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
      this.logRequest('POST', url, headers, payload)

      // 使用标准的Chat Completions API端点
      const response = await client.post('/v1/chat/completions', payload)
      
      console.log('响应状态:', response.status)
      console.log('响应数据:', response.data)
      
      if (response.status === 200) {
        const aiResponse = this.parseGenerationResponse(response.data)
        return {
          success: true,
          data: aiResponse
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      console.error('=== AI API 请求错误 ===')
      console.error('错误详情:', error)
      if (error.response) {
        console.error('错误响应状态:', error.response.status)
        console.error('错误响应数据:', error.response.data)
        console.error('错误响应Headers:', error.response.headers)
      } else if (error.request) {
        console.error('请求配置:', error.request)
      }
      console.error('=====================')
      
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  private parseGenerationResponse(data: any): AIResponse {
    // 解析标准的Chat Completions API响应格式
    // 标准API返回格式: { choices: [{ message: { content: "..." } }] }
    let content = ''
    
    if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      // 从第一个choice中提取消息内容
      const choice = data.choices[0]
      content = choice?.message?.content || choice?.text || ''
    }
    
    // 如果没有找到内容，尝试其他可能的格式作为后备
    if (!content) {
      content = data.response || data.text || ''
    }
    
    return {
      content: content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined,
      model: data.model
    }
  }

  private parseModelsResponse(data: any): AIModel[] {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return []
    }

    return data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      description: model.description || '',
      capabilities: this.inferCapabilities(model.id),
      maxTokens: model.max_tokens,
      costPer1kTokens: model.cost_per_1k_tokens,
      status: 'available', // 默认设置为可用状态
      type: this.inferModelType(model.id), // 推断模型类型
      pricing: {
        input: model.cost_per_1k_tokens || 0,
        output: model.cost_per_1k_tokens || 0
      }
    }))
  }

  private inferCapabilities(modelId: string): string[] {
    const capabilities = ['text_generation']
    
    if (modelId.includes('gpt') || modelId.includes('claude')) {
      capabilities.push('conversation', 'summarization')
    }
    
    if (modelId.includes('code') || modelId.includes('codex')) {
      capabilities.push('code_generation')
    }
    
    return capabilities
  }

  private inferModelType(modelId: string): string {
    if (modelId.includes('embedding')) {
      return 'embedding'
    }
    if (modelId.includes('image') || modelId.includes('vision') || modelId.includes('dall')) {
      return 'image'
    }
    if (modelId.includes('gpt') || modelId.includes('claude') || modelId.includes('chat')) {
      return 'chat'
    }
    return 'text'
  }

  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 处理OpenAI API的错误响应格式
        const status = error.response.status
        const data = error.response.data
        
        // OpenAI API错误格式: { "error": { "message": "...", "type": "...", "code": "..." } }
        if (data?.error?.message) {
          return `API错误 ${status}: ${data.error.message}`
        }
        
        // 其他格式的错误响应
        if (data?.message) {
          return `API错误 ${status}: ${data.message}`
        }
        
        // 根据状态码提供更具体的错误信息
        switch (status) {
          case 401:
            return 'API错误 401: 无效的API密钥，请检查您的API密钥是否正确'
          case 403:
            return 'API错误 403: 访问被拒绝，请检查您的API密钥权限'
          case 404:
            return 'API错误 404: API端点不存在，请检查API地址是否正确'
          case 429:
            return 'API错误 429: 请求频率过高，请稍后重试'
          case 500:
            return 'API错误 500: 服务器内部错误，请稍后重试'
          default:
            return `API错误 ${status}: ${error.response.statusText || '未知错误'}`
        }
      } else if (error.request) {
        return '网络错误: 无法连接到API服务器，请检查网络连接和API地址'
      } else {
        return `请求配置错误: ${error.message}`
      }
    }
    
    return error instanceof Error ? error.message : '未知错误'
  }
}

export const aiService = new AIService()