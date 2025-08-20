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
      
      <el-table :data="aiConfigStore.configs" style="width: 100%">
        <el-table-column prop="name" label="平台名称" width="150" />
        <el-table-column prop="type" label="平台类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPlatformTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="baseUrl" label="API地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '异常' }}
            </el-tag>
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
import { ref, onMounted } from 'vue'
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
    const result = await aiConfigStore.testConnection(config.id)
    if (result) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error('连接测试失败')
    }
  } catch (error) {
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
    if (editingConfig.value) {
      await aiConfigStore.updateConfig(editingConfig.value.id, config)
      ElMessage.success('更新成功')
    } else {
      await aiConfigStore.addConfig(config as Omit<AIConfig, 'id'>)
      ElMessage.success('添加成功')
    }
    showAddDialog.value = false
    editingConfig.value = null
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleCancelEdit = () => {
  showAddDialog.value = false
  editingConfig.value = null
}

onMounted(() => {
  aiConfigStore.loadConfigs()
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