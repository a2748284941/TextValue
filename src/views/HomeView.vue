<template>
  <div class="home-container">
    <!-- 英雄区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">TextValue AI Writer</h1>
        <p class="hero-subtitle">智能文章生成器 - 让AI为您的创作赋能</p>
        <p class="hero-description">
          集成多平台AI模型，提供从关键词到成文的完整写作工作流，
          支持内容优化、查重检测和AI检测规避
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="$router.push('/writing')">
            <el-icon><Edit /></el-icon>
            开始写作
          </el-button>
          <el-button size="large" @click="$router.push('/ai-config')">
            <el-icon><Setting /></el-icon>
            配置AI
          </el-button>
        </div>
      </div>
    </div>

    <!-- 功能特性 -->
    <div class="features-section">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <div class="features-grid">
          <div class="feature-card" @click="$router.push('/ai-config')">
            <div class="feature-icon">
              <el-icon size="40"><Setting /></el-icon>
            </div>
            <h3>AI接口管理</h3>
            <p>支持OpenAI、Claude、文心一言等多平台AI模型配置和管理</p>
          </div>
          
          <div class="feature-card" @click="$router.push('/writing')">
            <div class="feature-icon">
              <el-icon size="40"><Edit /></el-icon>
            </div>
            <h3>智能写作工作流</h3>
            <p>从关键词输入到标题生成、大纲制作、文章生成的完整流程</p>
          </div>
          
          <div class="feature-card" @click="$router.push('/content-opt')">
            <div class="feature-icon">
              <el-icon size="40"><DocumentChecked /></el-icon>
            </div>
            <h3>内容优化中心</h3>
            <p>AI检测规避、查重检测、内容优化和多版本生成</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 工作流程 -->
    <div class="workflow-section">
      <div class="container">
        <h2 class="section-title">工作流程</h2>
        <div class="workflow-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>配置AI接口</h4>
              <p>添加和配置您的AI平台API密钥</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>输入关键词</h4>
              <p>提供文章主题和关键词信息</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>生成内容</h4>
              <p>AI自动生成标题、大纲和文章内容</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>优化完善</h4>
              <p>内容优化、查重检测和AI检测规避</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">10+</div>
            <div class="stat-label">支持AI平台</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">100+</div>
            <div class="stat-label">AI模型</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">5</div>
            <div class="stat-label">核心功能模块</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">∞</div>
            <div class="stat-label">创作可能</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Setting, DocumentChecked } from '@element-plus/icons-vue'
</script>

<style scoped>
.home-container {
  min-height: 100vh;
}

/* 英雄区域 */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 20px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.hero-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  opacity: 0.8;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* 功能特性 */
.features-section {
  padding: 80px 20px;
  background: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #2c3e50;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  color: #409eff;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.feature-card p {
  color: #7f8c8d;
  line-height: 1.6;
}

/* 工作流程 */
.workflow-section {
  padding: 80px 20px;
  background: #f8f9fa;
}

.workflow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.step-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.step-arrow {
  font-size: 1.5rem;
  color: #409eff;
  font-weight: bold;
}

/* 统计信息 */
.stats-section {
  padding: 60px 20px;
  background: #2c3e50;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .workflow-steps {
    flex-direction: column;
  }
  
  .step-arrow {
    transform: rotate(90deg);
  }
}
</style>
