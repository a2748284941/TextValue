<template>
  <div class="outline-generation">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>大纲生成</span>
          <el-button
            v-if="outline.length > 0"
            type="primary"
            size="small"
            @click="regenerateOutline"
            :loading="generating"
          >
            重新生成
          </el-button>
        </div>
      </template>

      <div v-if="!outline.length && !generating" class="empty-state">
        <el-empty description="请先生成标题，然后点击生成大纲">
          <el-button
            type="primary"
            @click="generateOutline"
            :disabled="!selectedTitle"
          >
            生成大纲
          </el-button>
        </el-empty>
      </div>

      <div v-if="generating" class="generating-state">
        <el-skeleton :rows="5" animated />
        <div class="generating-text">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在生成大纲...
        </div>
      </div>

      <div v-if="outline.length > 0" class="outline-content">
        <draggable
          v-model="outline"
          group="outline"
          @start="drag = true"
          @end="drag = false"
          item-key="id"
        >
          <template #item="{ element, index }">
            <div class="outline-item" :class="{ 'is-dragging': drag }">
              <div class="outline-header">
                <el-icon class="drag-handle"><Rank /></el-icon>
                <span class="outline-level">{{ element.level }}</span>
                <el-input
                  v-model="element.title"
                  class="outline-title"
                  placeholder="请输入大纲标题"
                  @blur="updateOutline"
                />
                <div class="outline-actions">
                  <el-button
                    type="text"
                    size="small"
                    @click="addSubOutline(index)"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="removeOutline(index)"
                    :disabled="outline.length <= 1"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-input
                v-model="element.description"
                type="textarea"
                :rows="2"
                placeholder="请输入大纲描述"
                class="outline-description"
                @blur="updateOutline"
              />
            </div>
          </template>
        </draggable>

        <div class="outline-footer">
          <el-button @click="addOutline" type="dashed" class="add-outline-btn">
            <el-icon><Plus /></el-icon>
            添加大纲项
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Rank, Plus, Delete } from '@element-plus/icons-vue'
// import draggable from "vuedraggable";
import { useAIConfigStore } from '@/stores/aiConfig'
import { aiService } from '@/services/aiService'
import type { OutlineItem } from '@/types/article'

interface Props {
  selectedTitle: string
  keywords: string[]
}

interface Emits {
  (e: 'update:outline', outline: OutlineItem[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const aiConfigStore = useAIConfigStore()

const outline = ref<OutlineItem[]>([])
const generating = ref(false)
const drag = ref(false)

const selectedConfig = computed(() => aiConfigStore.selectedConfig)

watch(
  () => outline.value,
  (newOutline) => {
    emit('update:outline', newOutline)
  },
  { deep: true }
)

const generateOutline = async () => {
  if (!props.selectedTitle) {
    ElMessage.warning('请先选择标题')
    return
  }

  if (!selectedConfig.value) {
    ElMessage.warning('请先配置AI接口')
    return
  }

  generating.value = true
  try {
    const prompt = `请为以下标题生成详细的文章大纲：
标题：${props.selectedTitle}
关键词：${props.keywords.join('、')}

要求：
1. 生成5-8个主要大纲点
2. 每个大纲点包含简要描述
3. 逻辑清晰，层次分明
4. 符合文章主题和关键词

请以JSON格式返回，格式如下：
[
  {
    "id": "1",
    "level": "一",
    "title": "大纲标题",
    "description": "大纲描述"
  }
]`

    const response = await aiService.generateText(
      selectedConfig.value,
      prompt,
      {
        temperature: 0.7,
        maxTokens: 1000
      }
    )

    // 解析AI返回的JSON
    try {
      const parsedOutline = JSON.parse(response)
      if (Array.isArray(parsedOutline)) {
        outline.value = parsedOutline.map((item, index) => ({
          id: item.id || `outline-${index + 1}`,
          level: item.level || `${index + 1}`,
          title: item.title || '',
          description: item.description || ''
        }))
      } else {
        throw new Error('返回格式不正确')
      }
    } catch (parseError) {
      // 如果JSON解析失败，尝试从文本中提取大纲
      const lines = response.split('\n').filter(line => line.trim())
      outline.value = lines.slice(0, 8).map((line, index) => ({
        id: `outline-${index + 1}`,
        level: `${index + 1}`,
        title: line.trim().replace(/^\d+\.?\s*/, ''),
        description: ''
      }))
    }

    ElMessage.success('大纲生成成功')
  } catch (error) {
    console.error('生成大纲失败:', error)
    ElMessage.error('生成大纲失败，请重试')
  } finally {
    generating.value = false
  }
}

const regenerateOutline = () => {
  outline.value = []
  generateOutline()
}

const addOutline = () => {
  const newId = `outline-${outline.value.length + 1}`
  outline.value.push({
    id: newId,
    level: `${outline.value.length + 1}`,
    title: '',
    description: ''
  })
}

const addSubOutline = (index: number) => {
  const newId = `outline-${outline.value.length + 1}-sub`
  const parentLevel = outline.value[index].level
  outline.value.splice(index + 1, 0, {
    id: newId,
    level: `${parentLevel}.1`,
    title: '',
    description: ''
  })
}

const removeOutline = (index: number) => {
  outline.value.splice(index, 1)
  // 重新编号
  outline.value.forEach((item, idx) => {
    if (!item.level.includes('.')) {
      item.level = `${idx + 1}`
    }
  })
}

const updateOutline = () => {
  // 触发更新事件
  emit('update:outline', outline.value)
}

// 暴露方法给父组件
defineExpose({
  generateOutline,
  regenerateOutline
})
</script>

<style scoped>
.outline-generation {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.generating-state {
  padding: 20px 0;
}

.generating-text {
  text-align: center;
  margin-top: 20px;
  color: #409eff;
  font-size: 14px;
}

.generating-text .el-icon {
  margin-right: 8px;
}

.outline-content {
  min-height: 200px;
}

.outline-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  transition: all 0.3s;
}

.outline-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.outline-item.is-dragging {
  opacity: 0.8;
  transform: rotate(2deg);
}

.outline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.drag-handle {
  cursor: move;
  color: #909399;
  font-size: 16px;
}

.outline-level {
  min-width: 30px;
  font-weight: bold;
  color: #409eff;
}

.outline-title {
  flex: 1;
}

.outline-actions {
  display: flex;
  gap: 4px;
}

.outline-description {
  margin-left: 58px;
}

.outline-footer {
  text-align: center;
  margin-top: 20px;
}

.add-outline-btn {
  width: 100%;
  border-style: dashed;
  color: #409eff;
}

.add-outline-btn:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}
</style>