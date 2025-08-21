<template>
  <div class="ai-config-manager">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>AI平台配置管理</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加平台
          </el-button>
        </div>
      </template>
      
      <el-table 
        :data="aiConfigStore.configs" 
        style="width: 100%"
        :height="tableHeight"
        @resize="handleTableResize"
      >
        <el-table-column prop="name" label="平台名称" width="150" />
        <el-table-column prop="type" label="平台类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPlatformTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apiEndpoint" label="API地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前使用" width="100">
          <template #default="{ row }">
            <el-radio 
              :model-value="aiConfigStore.activeConfigId" 
              :value="row.id" 
              @change="setActiveConfig(row.id)"
            >
              <span></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="testConnection(row)">测试连接</el-button>
            <el-button size="small" type="primary" @click="editConfig(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteConfig(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑配置对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingConfig ? '编辑AI平台配置' : '添加AI平台配置'"
      width="600px"
    >
      <AIConfigForm
        :config="editingConfig"
        @save="handleSaveConfig"
        @cancel="handleCancelEdit"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { debounce } from 'lodash-es'

const tableHeight = ref('auto')

// 防抖处理表格尺寸变化
const handleTableResize = debounce(() => {
  nextTick(() => {
    // 表格尺寸调整逻辑
  })
}, 100)
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import AIConfigForm from './AIConfigForm.vue'
import type { AIConfig } from '@/types/ai'

const aiConfigStore = useAIConfigStore()
const showAddDialog = ref(false)
const editingConfig = ref<AIConfig | null>(null)

const getPlatformTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'openai': 'primary',
    'claude': 'success',
    'gemini': 'warning',
    'custom': 'info'
  }
  return typeMap[type] || 'info'
}

const testConnection = async (config: AIConfig) => {
  try {
    console.log('开始测试连接，配置:', config)
    const result = await aiConfigStore.testConnection(config)
    console.log('连接测试结果:', result)
    if (result.success) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error(`连接测试失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    console.error('连接测试异常:', error)
    ElMessage.error('连接测试异常')
  }
}

const editConfig = (config: AIConfig) => {
  editingConfig.value = { ...config }
  showAddDialog.value = true
}

const deleteConfig = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个AI平台配置吗？', '确认删除', {
      type: 'warning'
    })
    await aiConfigStore.deleteConfig(id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const handleSaveConfig = async (config: Partial<AIConfig>) => {
  try {
    console.log('保存配置:', config)
    
    if (editingConfig.value) {
      console.log('更新配置:', editingConfig.value.id, config)
      await aiConfigStore.updateConfig(editingConfig.value.id, config)
      ElMessage.success('更新成功')
    } else {
      console.log('添加新配置:', config)
      const newConfig = await aiConfigStore.addConfig(config as Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>)
      console.log('新配置已添加:', newConfig)
      ElMessage.success('添加成功')
      
      // 自动测试连接
      console.log('开始测试连接...')
      const testResult = await aiConfigStore.testConnection(newConfig)
      console.log('连接测试结果:', testResult)
      
      if (testResult.success) {
        ElMessage.success('配置添加成功，连接测试通过')
      } else {
        ElMessage.warning(`配置已添加，但连接测试失败: ${testResult.error}`)
      }
    }
    
    showAddDialog.value = false
    editingConfig.value = null
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

const handleCancelEdit = () => {
  showAddDialog.value = false
  editingConfig.value = null
}

const setActiveConfig = (configId: string) => {
  aiConfigStore.setActiveConfig(configId)
  ElMessage.success('已切换活跃配置')
}

onMounted(() => {
  aiConfigStore.init()
})
</script>

<style scoped>
.ai-config-manager {
  padding: 20px;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>