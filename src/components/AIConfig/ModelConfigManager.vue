<template>
  <div class="model-config-manager">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>模型配置管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showImportDialog">
              <el-icon><Upload /></el-icon>
              导入配置
            </el-button>
            <el-button @click="exportAllConfigs">
              <el-icon><Download /></el-icon>
              导出所有配置
            </el-button>
            <el-button @click="showTemplateDialog">
              <el-icon><Document /></el-icon>
              配置模板
            </el-button>
          </div>
        </div>
      </template>

      <!-- 配置列表 -->
      <div class="config-list">
        <el-table :data="configList" stripe style="width: 100%">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="配置名称" width="200" />
          <el-table-column prop="platform" label="平台" width="120" />
          <el-table-column prop="modelCount" label="模型数量" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '激活' : '未激活' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column prop="updatedAt" label="更新时间" width="160" />
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-button size="small" @click="viewConfig(row)">查看</el-button>
              <el-button size="small" type="primary" @click="editConfig(row)">编辑</el-button>
              <el-button size="small" @click="exportConfig(row)">导出</el-button>
              <el-button size="small" @click="duplicateConfig(row)">复制</el-button>
              <el-button size="small" type="danger" @click="deleteConfig(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 批量操作 -->
      <div class="batch-operations" v-if="selectedConfigs.length > 0">
        <el-alert
          :title="`已选择 ${selectedConfigs.length} 个配置`"
          type="info"
          show-icon
          :closable="false"
        >
          <template #default>
            <div class="batch-actions">
              <el-button size="small" @click="batchExport">批量导出</el-button>
              <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
              <el-button size="small" @click="clearSelection">清除选择</el-button>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 导入配置对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入配置" width="60%">
      <div class="import-section">
        <el-tabs v-model="importMethod">
          <el-tab-pane label="文件导入" name="file">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              accept=".json,.yaml,.yml"
              drag
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将配置文件拖拽到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 JSON、YAML 格式的配置文件
                </div>
              </template>
            </el-upload>
          </el-tab-pane>
          <el-tab-pane label="文本导入" name="text">
            <el-input
              v-model="importText"
              type="textarea"
              :rows="10"
              placeholder="请粘贴配置内容（JSON 或 YAML 格式）"
            />
          </el-tab-pane>
          <el-tab-pane label="URL导入" name="url">
            <el-input
              v-model="importUrl"
              placeholder="请输入配置文件的URL地址"
              style="margin-bottom: 10px"
            />
            <el-button @click="fetchConfigFromUrl" :loading="urlLoading">
              获取配置
            </el-button>
          </el-tab-pane>
        </el-tabs>

        <!-- 配置预览 -->
        <div v-if="previewConfig" class="config-preview">
          <h4>配置预览</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="配置名称">{{ previewConfig.name }}</el-descriptions-item>
            <el-descriptions-item label="平台">{{ previewConfig.platform }}</el-descriptions-item>
            <el-descriptions-item label="模型数量">{{ previewConfig.models?.length || 0 }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ previewConfig.version || 'N/A' }}</el-descriptions-item>
          </el-descriptions>
          
          <div class="import-options">
            <el-checkbox v-model="importOptions.overwrite">覆盖同名配置</el-checkbox>
            <el-checkbox v-model="importOptions.mergeModels">合并模型列表</el-checkbox>
            <el-checkbox v-model="importOptions.validateConfig">验证配置有效性</el-checkbox>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importConfig" :disabled="!previewConfig">导入</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 配置详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="配置详情" width="70%">
      <div v-if="selectedConfig">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="配置名称">{{ selectedConfig.name }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ selectedConfig.platform }}</el-descriptions-item>
          <el-descriptions-item label="API地址">{{ selectedConfig.apiUrl }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ selectedConfig.status }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedConfig.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ selectedConfig.updatedAt }}</el-descriptions-item>
        </el-descriptions>

        <!-- 模型列表 -->
        <div style="margin-top: 20px">
          <h4>包含的模型</h4>
          <el-table :data="selectedConfig.models" max-height="300">
            <el-table-column prop="name" label="模型名称" />
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'available' ? 'success' : 'danger'">
                  {{ row.status === 'available' ? '可用' : '不可用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 配置详情 -->
        <div style="margin-top: 20px">
          <h4>配置详情</h4>
          <el-input
            v-model="configDetailText"
            type="textarea"
            :rows="10"
            readonly
          />
        </div>
      </div>
    </el-dialog>

    <!-- 配置模板对话框 -->
    <el-dialog v-model="templateDialogVisible" title="配置模板" width="60%">
      <div class="template-section">
        <el-row :gutter="20">
          <el-col :span="8" v-for="template in configTemplates" :key="template.id">
            <el-card class="template-card" @click="selectTemplate(template)">
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
                <el-tag size="small">{{ template.platform }}</el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Download, Document, UploadFilled } from '@element-plus/icons-vue'
import { useAIConfigStore } from '@/stores/aiConfig'
import type { AIConfig } from '@/types/ai'

interface ConfigItem extends AIConfig {
  modelCount: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  models?: Array<{
    name: string
    type: string
    status: string
  }>
}

interface ConfigTemplate {
  id: string
  name: string
  description: string
  platform: string
  config: Partial<AIConfig>
}

const aiConfigStore = useAIConfigStore()

// 对话框状态
const importDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const templateDialogVisible = ref(false)

// 导入相关
const importMethod = ref('file')
const importText = ref('')
const importUrl = ref('')
const urlLoading = ref(false)
const previewConfig = ref<Partial<ConfigItem> | null>(null)
const uploadRef = ref()

// 导入选项
const importOptions = ref({
  overwrite: false,
  mergeModels: false,
  validateConfig: true
})

// 选中的配置
const selectedConfigs = ref<ConfigItem[]>([])
const selectedConfig = ref<ConfigItem | null>(null)
const configDetailText = ref('')

// 模拟配置列表
const configList = ref<ConfigItem[]>([
  {
    id: '1',
    name: 'OpenAI GPT配置',
    platform: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-***',
    modelCount: 5,
    status: 'active',
    createdAt: '2024-01-10 10:30:00',
    updatedAt: '2024-01-15 14:20:00',
    models: [
      { name: 'gpt-3.5-turbo', type: 'chat', status: 'available' },
      { name: 'gpt-4', type: 'chat', status: 'available' },
      { name: 'gpt-4-turbo', type: 'chat', status: 'available' }
    ]
  },
  {
    id: '2',
    name: 'Claude配置',
    platform: 'Anthropic',
    apiUrl: 'https://api.anthropic.com',
    apiKey: 'sk-ant-***',
    modelCount: 3,
    status: 'active',
    createdAt: '2024-01-12 09:15:00',
    updatedAt: '2024-01-14 16:45:00',
    models: [
      { name: 'claude-3-sonnet', type: 'chat', status: 'available' },
      { name: 'claude-3-haiku', type: 'chat', status: 'available' }
    ]
  },
  {
    id: '3',
    name: 'Ollama本地配置',
    platform: 'Ollama',
    apiUrl: 'http://localhost:11434',
    apiKey: '',
    modelCount: 4,
    status: 'inactive',
    createdAt: '2024-01-08 15:20:00',
    updatedAt: '2024-01-13 11:30:00',
    models: [
      { name: 'llama2', type: 'chat', status: 'available' },
      { name: 'codellama', type: 'code', status: 'available' }
    ]
  }
])

// 配置模板
const configTemplates = ref<ConfigTemplate[]>([
  {
    id: 'openai-template',
    name: 'OpenAI标准配置',
    description: '适用于OpenAI GPT系列模型的标准配置',
    platform: 'OpenAI',
    config: {
      platform: 'OpenAI',
      apiUrl: 'https://api.openai.com/v1',
      name: 'OpenAI配置'
    }
  },
  {
    id: 'claude-template',
    name: 'Claude配置模板',
    description: '适用于Anthropic Claude系列模型',
    platform: 'Anthropic',
    config: {
      platform: 'Anthropic',
      apiUrl: 'https://api.anthropic.com',
      name: 'Claude配置'
    }
  },
  {
    id: 'ollama-template',
    name: 'Ollama本地配置',
    description: '适用于本地部署的Ollama服务',
    platform: 'Ollama',
    config: {
      platform: 'Ollama',
      apiUrl: 'http://localhost:11434',
      name: 'Ollama配置'
    }
  }
])

// 显示导入对话框
const showImportDialog = () => {
  importDialogVisible.value = true
  previewConfig.value = null
  importText.value = ''
  importUrl.value = ''
}

// 显示模板对话框
const showTemplateDialog = () => {
  templateDialogVisible.value = true
}

// 处理文件变化
const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      parseConfigContent(content)
    } catch (error) {
      ElMessage.error('文件读取失败')
    }
  }
  reader.readAsText(file.raw)
}

// 从URL获取配置
const fetchConfigFromUrl = async () => {
  if (!importUrl.value) {
    ElMessage.warning('请输入URL地址')
    return
  }
  
  urlLoading.value = true
  try {
    // 模拟从URL获取配置
    await new Promise(resolve => setTimeout(resolve, 1000))
    const mockConfig = {
      name: '远程配置',
      platform: 'OpenAI',
      apiUrl: 'https://api.openai.com/v1',
      models: []
    }
    previewConfig.value = mockConfig
    ElMessage.success('配置获取成功')
  } catch (error) {
    ElMessage.error('获取配置失败')
  } finally {
    urlLoading.value = false
  }
}

// 解析配置内容
const parseConfigContent = (content: string) => {
  try {
    let config
    if (content.trim().startsWith('{')) {
      // JSON格式
      config = JSON.parse(content)
    } else {
      // 假设是YAML格式（这里简化处理）
      ElMessage.warning('YAML格式解析需要额外的库支持')
      return
    }
    
    previewConfig.value = config
    ElMessage.success('配置解析成功')
  } catch (error) {
    ElMessage.error('配置格式错误')
  }
}

// 导入配置
const importConfig = async () => {
  if (!previewConfig.value) {
    ElMessage.warning('请先选择或输入配置')
    return
  }
  
  try {
    // 验证配置
    if (importOptions.value.validateConfig) {
      // 模拟配置验证
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // 检查是否覆盖
    if (!importOptions.value.overwrite) {
      const existing = configList.value.find(c => c.name === previewConfig.value?.name)
      if (existing) {
        ElMessage.warning('配置名称已存在，请启用覆盖选项或修改配置名称')
        return
      }
    }
    
    // 添加到配置列表
    const newConfig: ConfigItem = {
      ...previewConfig.value as ConfigItem,
      id: Date.now().toString(),
      modelCount: previewConfig.value.models?.length || 0,
      status: 'inactive',
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    }
    
    configList.value.push(newConfig)
    importDialogVisible.value = false
    ElMessage.success('配置导入成功')
  } catch (error) {
    ElMessage.error('配置导入失败')
  }
}

// 导出所有配置
const exportAllConfigs = () => {
  const data = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    configs: configList.value
  }
  
  downloadJson(data, 'all-model-configs.json')
  ElMessage.success('所有配置已导出')
}

// 导出单个配置
const exportConfig = (config: ConfigItem) => {
  downloadJson(config, `${config.name}-config.json`)
  ElMessage.success(`${config.name} 配置已导出`)
}

// 批量导出
const batchExport = () => {
  const data = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    configs: selectedConfigs.value
  }
  
  downloadJson(data, 'selected-configs.json')
  ElMessage.success(`已导出 ${selectedConfigs.value.length} 个配置`)
}

// 下载JSON文件
const downloadJson = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 查看配置详情
const viewConfig = (config: ConfigItem) => {
  selectedConfig.value = config
  configDetailText.value = JSON.stringify(config, null, 2)
  detailDialogVisible.value = true
}

// 编辑配置
const editConfig = (config: ConfigItem) => {
  // 这里可以跳转到编辑页面或打开编辑对话框
  ElMessage.info('编辑功能待实现')
}

// 复制配置
const duplicateConfig = (config: ConfigItem) => {
  const newConfig: ConfigItem = {
    ...config,
    id: Date.now().toString(),
    name: `${config.name} (副本)`,
    status: 'inactive',
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString()
  }
  
  configList.value.push(newConfig)
  ElMessage.success('配置已复制')
}

// 删除配置
const deleteConfig = async (config: ConfigItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置 "${config.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = configList.value.findIndex(c => c.id === config.id)
    if (index > -1) {
      configList.value.splice(index, 1)
      ElMessage.success('配置已删除')
    }
  } catch {
    // 用户取消删除
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedConfigs.value.length} 个配置吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    selectedConfigs.value.forEach(config => {
      const index = configList.value.findIndex(c => c.id === config.id)
      if (index > -1) {
        configList.value.splice(index, 1)
      }
    })
    
    selectedConfigs.value = []
    ElMessage.success('批量删除成功')
  } catch {
    // 用户取消删除
  }
}

// 清除选择
const clearSelection = () => {
  selectedConfigs.value = []
}

// 选择模板
const selectTemplate = (template: ConfigTemplate) => {
  previewConfig.value = {
    ...template.config,
    models: []
  }
  templateDialogVisible.value = false
  importDialogVisible.value = true
  importMethod.value = 'text'
  importText.value = JSON.stringify(template.config, null, 2)
}

// 监听文本输入变化
const handleTextChange = () => {
  if (importText.value.trim()) {
    parseConfigContent(importText.value)
  }
}
</script>

<style scoped>
.model-config-manager {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-list {
  margin-bottom: 20px;
}

.batch-operations {
  margin-top: 20px;
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.import-section {
  margin-bottom: 20px;
}

.config-preview {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.import-options {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-section {
  margin-bottom: 20px;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 15px;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.template-info p {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>