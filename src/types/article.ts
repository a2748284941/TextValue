// 文章相关类型定义
export interface Article {
  id: string
  title: string
  content: string
  outline: ArticleOutline
  metadata: ArticleMetadata
  createdAt: Date
  updatedAt: Date
}

// 文章大纲
export interface ArticleOutline {
  id: string
  title: string
  sections: OutlineSection[]
}

// 大纲章节
export interface OutlineSection {
  id: string
  title: string
  keywords: string[]
  order: number
  subsections?: OutlineSection[]
}

// 文章元数据
export interface ArticleMetadata {
  keywords: string[]
  style: WritingStyle
  wordCount: number
  readingTime: number
  aiDetectionScore?: number
  duplicateScore?: number
}

// 写作风格
export enum WritingStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  HUMOROUS = 'humorous',
  TECHNICAL = 'technical',
  ACADEMIC = 'academic'
}

// 标题候选
export interface TitleCandidate {
  id: string
  title: string
  score: number
  keywords: string[]
  style: WritingStyle
}

// 内容优化建议
export interface OptimizationSuggestion {
  type: 'synonym' | 'restructure' | 'expand' | 'reduce'
  original: string
  suggested: string
  reason: string
  confidence: number
}