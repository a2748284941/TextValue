import axios, { type AxiosInstance } from 'axios'
import type { AIConfig, AIModel, AIRequest, AIResponse, APIResponse, ConnectionTestResult } from '@/types/ai'

class AIService {
  private createClient(config: AIConfig): AxiosInstance {
    return axios.create({
      baseURL: config.apiEndpoint,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
  }

  async testConnection(config: AIConfig): Promise<ConnectionTestResult> {
    try {
      const client = this.createClient(config)
      
      // 尝试获取模型列表来测试连接
      const response = await client.get('/v1/models')
      
      if (response.status === 200) {
        const models = this.parseModelsResponse(response.data)
        return {
          success: true,
          models
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

  async getModels(config: AIConfig): Promise<APIResponse<AIModel[]>> {
    try {
      const client = this.createClient(config)
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

  async generateText(config: AIConfig, request: AIRequest): Promise<APIResponse<AIResponse>> {
    try {
      const client = this.createClient(config)
      
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

      const response = await client.post('/v1/chat/completions', payload)
      
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
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
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
      costPer1kTokens: model.cost_per_1k_tokens
    }))
  }

  private parseGenerationResponse(data: any): AIResponse {
    const choice = data.choices?.[0]
    const message = choice?.message
    
    return {
      content: message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined,
      model: data.model
    }
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

  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return `API错误: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`
      } else if (error.request) {
        return '网络错误: 无法连接到API服务器'
      }
    }
    
    return error instanceof Error ? error.message : '未知错误'
  }
}

export const aiService = new AIService()