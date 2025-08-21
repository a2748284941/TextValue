import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AIConfig, AIModel, ConnectionTestResult } from '@/types/ai'
import { aiService } from '@/services/aiService'

export const useAIConfigStore = defineStore('aiConfig', () => {
  // 状态
  const configs = ref<AIConfig[]>([])
  const models = ref<AIModel[]>([])
  const modelCache = ref<Map<string, AIModel[]>>(new Map()) // 模型缓存，key为configId
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
    console.log('开始测试连接，配置:', config)
    isLoading.value = true
    error.value = null
    
    try {
      const startTime = Date.now()
      console.log('调用aiService.testConnection...')
      const result = await aiService.testConnection(config)
      console.log('aiService.testConnection结果:', result)
      const latency = Date.now() - startTime
      
      const testResult = {
        success: result.success,
        latency,
        error: result.error,
        models: result.models
      }
      console.log('最终测试结果:', testResult)
      return testResult
    } catch (err) {
      console.error('测试连接异常:', err)
      const errorResult = {
        success: false,
        error: err instanceof Error ? err.message : '连接测试失败'
      }
      console.log('错误结果:', errorResult)
      return errorResult
    } finally {
      isLoading.value = false
    }
  }

  const loadModels = async (configId: string, forceRefresh = false) => {
    const config = configs.value.find(c => c.id === configId)
    if (!config) return

    // 如果有缓存且不是强制刷新，直接使用缓存
    if (!forceRefresh && modelCache.value.has(configId)) {
      const cachedModels = modelCache.value.get(configId)!
      models.value = cachedModels
      console.log('使用缓存的模型列表:', cachedModels.length, '个模型')
      return cachedModels
    }

    isLoading.value = true
    try {
      console.log('从服务器获取模型列表...')
      const result = await aiService.getModels(config)
      if (result.success && result.data) {
        models.value = result.data
        // 缓存模型列表
        modelCache.value.set(configId, result.data)
        console.log('模型列表已缓存:', result.data.length, '个模型')
        return result.data
      }
    } catch (err) {
      error.value = '加载模型列表失败'
      console.error('Failed to load models:', err)
    } finally {
      isLoading.value = false
    }
  }

  const refreshModels = async (configId: string) => {
    console.log('刷新模型列表，清空缓存...')
    // 清空指定配置的缓存
    modelCache.value.delete(configId)
    // 强制重新加载
    return await loadModels(configId, true)
  }

  const clearAllModelCache = () => {
    console.log('清空所有模型缓存')
    modelCache.value.clear()
    models.value = []
  }

  const getModelsFromCache = (configId: string): AIModel[] | null => {
    return modelCache.value.get(configId) || null
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
    modelCache,
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
    refreshModels,
    clearAllModelCache,
    getModelsFromCache,
    setActiveConfig,
    init
  }
})