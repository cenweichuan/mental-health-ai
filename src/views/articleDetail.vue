<template>
  <div class="articleDetail-container">
    <div class="content">
      <div class="diary-card">
        <div class="card-header">
          <p class="title">文章信息</p>
          <el-button plain type="primary" @click="backToKnowledge">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回知识库</span>
          </el-button>
        </div>
        <div class="sub-title">
          <el-tag class="category-tag" size="large">{{ articleDetail?.categoryName }}</el-tag>
          <div class="flex-box">
            <el-icon><List /></el-icon>
            <span>{{ formatTime(articleDetail?.publishedAt || articleDetail?.createdAt) }}</span>
          </div>
        </div>

        <h1 class="article-title">{{ articleDetail?.title }}</h1>

        <!-- 封面图片 -->
        <div class="cover-image-wrapper" v-if="articleDetail?.coverImage">
          <el-image
            :preview-src-list="[getImgUrl(articleDetail.coverImage)]"
            :src="getImgUrl(articleDetail.coverImage)"
            class="cover-image"
            fit="cover"
            preview-teleported
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>图片加载失败</span>
              </div>
            </template>
          </el-image>
        </div>

        <div v-if="articleDetail?.summary" class="summary-content">
          <p>{{ articleDetail.summary }}</p>
        </div>

        <div class="flex-box" style="margin-top: 20px">
          <div class="item flex-box">
            <el-icon><Avatar /></el-icon>
            <span>{{ articleDetail?.authorName || '匿名' }}</span>
          </div>

          <div class="item flex-box">
            <el-icon><View /></el-icon>
            <span>阅读量：{{ articleDetail?.readCount || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="diary-card">
        <div class="title">文章正文</div>
        <div
          class="content-wrapper"
          v-html="formatContent(articleDetail?.content || '')"
        ></div>
        <div
          v-if="articleDetail?.tags"
          class="tags-content"
        >
          <h4 class="tags-title">相关标签：</h4>
          <div class="tags-list">
            <el-tag
              v-for="item in tagList"
              :key="item"
              class="tag-item"
              effect="light"
              type="info"
            >
              {{ item }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getArticle } from '@/api/admin'
import { ArrowLeft, Avatar, List, View, Picture } from '@element-plus/icons-vue'
import { fileBaseUrl } from '@/config/index'

const route = useRoute()
const router = useRouter()
const articleDetail = ref(null)

// 标签列表
const tagList = computed(() => {
  if (!articleDetail.value?.tags) return []
  if (typeof articleDetail.value.tags === 'string') {
    return articleDetail.value.tags.split(',').filter(t => t.trim())
  }
  if (Array.isArray(articleDetail.value.tags)) {
    return articleDetail.value.tags
  }
  return []
})

// 获取图片完整URL
const getImgUrl = (url) => {
  if (!url) return ''
  return url.startsWith('http') ? url : fileBaseUrl + url
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  if (isNaN(date.getTime())) return time
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化内容（基础 Markdown）
const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

// 获取文章详情
const getArticleDetail = async () => {
  try {
    const id = route.params.id
    const res = await getArticle(id)
    // 拦截器返回 { code, msg, data }
    articleDetail.value = res.data || res
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  }
}

// 返回知识库
const backToKnowledge = () => {
  router.push('/frontendKnowledge')
}

onMounted(() => {
  getArticleDetail()
})
</script>

<style lang="scss" scoped>
.articleDetail-container {
  min-height: calc(100vh - 140px);
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f4f6 100%);

  .flex-box {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;

    .item {
      margin-right: 20px;
      span {
        margin-left: 0;
      }
    }
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 20px;

    .diary-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      padding: 24px;
      border: 1px solid rgba(143, 170, 190, 0.1);
      margin-bottom: 20px;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid rgba(96, 193, 197, 0.1);

        .title {
          font-size: 24px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }

        .el-button {
          border-color: rgba(74, 156, 140, 0.4);
          color: #4a9c8c;
          background: rgba(74, 156, 140, 0.08);

          &:hover {
            background: rgba(74, 156, 140, 0.15);
            border-color: #4a9c8c;
            color: #3d8a7a;
          }
        }
      }

      .sub-title {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;

        .category-tag {
          background: rgba(74, 156, 140, 0.12);
          border-color: rgba(74, 156, 140, 0.4);
          color: #2c3e50;
        }
      }

      .article-title {
        font-size: 28px;
        font-weight: 700;
        color: #2c3e50;
        margin: 24px 0 20px;
        line-height: 1.4;
      }

      .cover-image-wrapper {
        margin-bottom: 24px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

        .cover-image {
          width: 100%;
          height: 400px;
          display: block;
        }

        .image-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          background: #f5f7fa;
          color: #9ca3af;

          .el-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
        }
      }

      .summary-content {
        background: rgba(74, 156, 140, 0.1);
        border-left: 4px solid #4a9c8c;
        padding: 16px 20px;
        border-radius: 0 12px 12px 0;
        margin-bottom: 20px;

        p {
          margin: 0;
          font-size: 15px;
          color: #2c3e50;
          line-height: 1.6;
        }
      }

      .content-wrapper {
        font-size: 15px;
        color: #374151;
        line-height: 1.8;
      }

      .tags-content {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid rgba(143, 170, 190, 0.1);

        .tags-title {
          margin-bottom: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #2c3e50;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          .tag-item {
            background: rgba(74, 156, 140, 0.1);
            border-color: rgba(74, 156, 140, 0.25);
            color: #2c3e50;
          }
        }
      }
    }
  }
}
</style>