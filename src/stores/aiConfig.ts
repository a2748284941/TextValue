import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AIConfig, AIModel, ConnectionTestResult } from '@/types/ai'
import { aiService } from '@/services/aiService'

export const useAIConfigStore = defineStore('aiConfig', () => {
  // 状态
  const configs = ref<AIConfig[]>([])
  const models = ref<AIModel[]>([])
  const activeConfigId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const activeConfig = computed(() => 
    configs.value.find(config => config.id === activeConfigId.value)
  )

  const activeConfigs = computed(() => 
    configs.value.filter(config => config.isActive)
  )

  // 动作
  const loadConfigs = async () => {
    isLoading.value = true
    error.value = null
    try {
      const savedConfigs = localStorage.getItem('ai-configs')
      if (savedConfigs) {
        configs.value = JSON.parse(savedConfigs).map((config: any) => ({
          ...config,
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt)
        }))
      }
    } catch (err) {
      error.value = '加载AI配置失败'
      console.error('Failed to load AI configs:', err)
    } finally {
      isLoading.value = false
    }
  }

  const saveConfigs = () => {
    try {
      localStorage.setItem('ai-configs', JSON.stringify(configs.value))
    } catch (err) {
      error.value = '保存AI配置失败'
      console.error('Failed to save AI configs:', err)
    }
  }

  const addConfig = async (config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newConfig: AIConfig = {
      ...config,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    configs.value.push(newConfig)
    saveConfigs()
    return newConfig
  }

  const updateConfig = async (id: string, updates: Partial<AIConfig>) => {
    const index = configs.value.findIndex(config => config.id === id)
    if (index !== -1) {
      configs.value[index] = {
        ...configs.value[index],
        ...updates,
        updatedAt: new Date()
      }
      saveConfigs()
    }
  }

  const deleteConfig = async (id: string) => {
    const index = configs.value.findIndex(config => config.id === id)
    if (index !== -1) {
      configs.value.splice(index, 1)
      if (activeConfigId.value === id) {
        activeConfigId.value = null
      }
      saveConfigs()
    }
  }

  const testConnection = async (config: AIConfig): Promise<ConnectionTestResult> => {
    isLoading.value = true
    error.value = null
    
    try {
      const startTime = Date.now()
      const result = await aiService.testConnection(config)
      const latency = Date.now() - startTime
      
      return {
        success: result.success,
        latency,
        error: result.error,
        models: result.models
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '连接测试失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  const loadModels = async (configId: string) => {
    const config = configs.value.find(c => c.id === configId)
    if (!config) return

    isLoading.value = true
    try {
      const result = await aiService.getModels(config)
      if (result.success && result.data) {
        models.value = result.data
      }
    } catch (err) {
      error.value = '加载模型列表失败'
      console.error('Failed to load models:', err)
    } finally {
      isLoading.value = false
    }
  }

  const setActiveConfig = (configId: string | null) => {
    activeConfigId.value = configId
    localStorage.setItem('active-config-id', configId || '')
  }

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 初始化
  const init = async () => {
    await loadConfigs()
    const savedActiveId = localStorage.getItem('active-config-id')
    if (savedActiveId && configs.value.find(c => c.id === savedActiveId)) {
      activeConfigId.value = savedActiveId
    }
  }

  return {
    // 状态
    configs,
    models,
    activeConfigId,
    isLoading,
    error,
    // 计算属性
    activeConfig,
    activeConfigs,
    // 动作
    loadConfigs,
    addConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    loadModels,
    setActiveConfig,
    init
  }
})