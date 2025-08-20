<template>
  <div class="about-container">
    <div class="about-header">
      <div class="container">
        <h1>关于 TextValue AI Writer</h1>
        <p class="subtitle">专业的AI文章生成解决方案</p>
      </div>
    </div>

    <div class="about-content">
      <div class="container">
        <div class="content-grid">
          <div class="content-section">
            <h2>项目简介</h2>
            <p>
              TextValue AI Writer 是一个基于Vue 3和TypeScript开发的智能文章生成器，
              集成了多个主流AI平台的API，为用户提供从关键词输入到文章生成的完整工作流。
            </p>

            <h3>核心特性</h3>
            <ul>
              <li>🤖 多平台AI模型支持（OpenAI、Claude、文心一言等）</li>
              <li>📝 完整的写作工作流（关键词→标题→大纲→文章）</li>
              <li>🔍 智能内容优化和查重检测</li>
              <li>🛡️ AI检测规避和差异化算法</li>
              <li>💾 素材库管理和版本控制</li>
              <li>🎨 现代化的用户界面设计</li>
            </ul>
          </div>

          <div class="content-section">
            <h2>技术栈</h2>
            <div class="tech-stack">
              <div class="tech-category">
                <h4>前端框架</h4>
                <div class="tech-tags">
                  <span class="tech-tag">Vue 3</span>
                  <span class="tech-tag">TypeScript</span>
                  <span class="tech-tag">Vite</span>
                </div>
              </div>

              <div class="tech-category">
                <h4>UI组件库</h4>
                <div class="tech-tags">
                  <span class="tech-tag">Element Plus</span>
                  <span class="tech-tag">Element Icons</span>
                </div>
              </div>

              <div class="tech-category">
                <h4>状态管理</h4>
                <div class="tech-tags">
                  <span class="tech-tag">Pinia</span>
                  <span class="tech-tag">Vue Router</span>
                </div>
              </div>

              <div class="tech-category">
                <h4>工具库</h4>
                <div class="tech-tags">
                  <span class="tech-tag">Axios</span>
                  <span class="tech-tag">Marked</span>
                  <span class="tech-tag">Highlight.js</span>
                  <span class="tech-tag">Crypto-js</span>
                  <span class="tech-tag">Vue Draggable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="version-info">
          <h2>版本信息</h2>
          <div class="version-card">
            <div class="version-header">
              <h3>v1.0.5</h3>
              <span class="version-date">2025年8月</span>
            </div>
            <div class="version-features">
              <h4>主要功能</h4>
              <ul>
                <li>AI接口管理中心</li>
                <li>智能写作工作流</li>
                <li>内容优化中心</li>
                <li>模型管理功能</li>
                <li>用户界面优化</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message, Link } from '@element-plus/icons-vue'
</script>

<style scoped>
.about-container {
  min-height: 100vh;
}

.about-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 20px;
  text-align: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.about-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.about-content {
  padding: 60px 20px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.content-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.content-section h3 {
  color: #34495e;
  margin: 2rem 0 1rem 0;
  font-size: 1.3rem;
}

.content-section p {
  line-height: 1.6;
  color: #7f8c8d;
  margin-bottom: 1.5rem;
}

.content-section ul {
  list-style: none;
  padding: 0;
}

.content-section li {
  padding: 0.5rem 0;
  color: #7f8c8d;
  line-height: 1.6;
}

.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tech-category h4 {
  color: #2c3e50;
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tech-tag {
  background: #409eff;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.version-info {
  margin-bottom: 3rem;
}

.version-info h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.version-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e4e7ed;
}

.version-header h3 {
  color: #409eff;
  margin: 0;
  font-size: 1.5rem;
}

.version-date {
  color: #909399;
  font-size: 0.9rem;
}

.version-features h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.version-features ul {
  list-style: none;
  padding: 0;
}

.version-features li {
  padding: 0.3rem 0;
  color: #7f8c8d;
  position: relative;
  padding-left: 1.5rem;
}

.version-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #67c23a;
  font-weight: bold;
}

.contact-section {
  text-align: center;
}

.contact-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.contact-section p {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.contact-info {
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #409eff;
  font-weight: 500;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .contact-info {
    flex-direction: column;
    gap: 1rem;
  }

  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
