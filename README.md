
# TextValue AI Writer

🤖 **智能文章生成器** - 基于Vue 3的AI写作工具平台

## 📖 项目简介

TextValue AI Writer 是一个现代化的AI文章生成器，集成了多个主流AI平台的API，为用户提供从关键词输入到文章生成的完整工作流。

### ✨ 核心特性

- 🔧 **多平台AI模型支持** - OpenAI、Claude、文心一言等
- 📝 **完整写作工作流** - 关键词→标题→大纲→文章
- 🔍 **智能内容优化** - 查重检测、AI检测规避
- 🎨 **现代化UI设计** - 基于Element Plus的响应式界面
- 💾 **素材库管理** - 版本控制和批量操作
- 🛡️ **错误处理机制** - 完善的错误边界和用户反馈

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 生产环境构建

```bash
npm run build:prod
```

### 预览构建结果

```bash
npm run preview
```

## 🏗️ 技术栈

### 前端框架
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 下一代前端构建工具

### UI组件库
- **Element Plus** - 基于Vue 3的组件库
- **Element Icons** - 图标组件

### 状态管理
- **Pinia** - Vue的状态管理库
- **Vue Router** - 官方路由管理器

### 工具库
- **Axios** - HTTP客户端
- **Marked** - Markdown解析器
- **Highlight.js** - 代码高亮
- **Crypto-js** - 加密工具
- **Vue Draggable Plus** - 拖拽组件

## 📁 项目结构

### 环境变量

创建 `.env` 文件配置开发环境：

```env
VITE_APP_TITLE=TextValue AI Writer
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_DEBUG=true
```

### AI平台配置

1. 进入「AI配置」页面
2. 添加您的AI平台API密钥
3. 选择要使用的模型
4. 配置生成参数

## 📝 使用指南

### 1. 配置AI接口
- 添加OpenAI、Claude等平台的API密钥
- 选择合适的模型和参数
- 测试连接状态

### 2. 智能写作流程
- 输入关键词和主题
- AI生成多个标题选项
- 创建文章大纲
- 生成完整文章内容

### 3. 内容优化
- 导入已有内容
- 进行查重检测
- AI检测规避处理
- 生成多个版本

## 🚀 部署指南

### GitHub Pages

```bash
npm run deploy:github
```

### Netlify

```bash
npm run deploy:netlify
```

### Vercel

```bash
npm run deploy:vercel
```

### Docker部署

```bash
docker build -t textvalue-ai-writer .
docker run -p 80:80 textvalue-ai-writer
```

## 🧪 测试

### 单元测试

```bash
npm run test:unit
```

### E2E测试

```bash
npm run test:e2e
```

### 类型检查

```bash
npm run type-check
```

### 代码检查

```bash
npm run lint
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request


**TextValue AI Writer** - 让AI为您的创作赋能 ✨
