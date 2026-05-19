<template>
  <div class="knowledge-container">
    <div class="content-wrapper">
      <div class="content">
        <!-- 左侧边栏 - 推荐阅读 -->
        <div class="left-sidebar">
          <div class="recommend-section">
            <div class="section-title">
              <div class="title-left">
                <span class="title-icon">📚</span>
                <span>推荐阅读</span>
              </div>
            </div>
            <div class="recommend-list">
              <div
                v-for="item in leftArticleList"
                :key="item.id"
                class="recommend-item"
                @click="selectArticle(item.id)"
              >
                <h4>{{ item.title }}</h4>
                <p class="read-count">
                  <el-icon><Histogram /></el-icon>
                  阅读量 {{ item.readCount }}
                </p>
              </div>
              <div v-if="leftArticleList.length === 0" class="empty-text">
                暂无推荐文章
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧文章列表 -->
        <div class="article-list-section">
          <div class="article-list">
            <div
              v-for="item in rightArticleList"
              :key="item.id"
              class="article-item"
              @click="selectArticle(item.id)"
            >
              <el-image
                :src="getImgUrl(item.coverImage)"
                class="article-cover"
                fit="cover"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="info">
                <div class="title">
                  <h3>{{ item.title }}</h3>
                  <el-tag
                    effect="plain"
                    round
                    class="category-tag"
                  >
                    {{ item.categoryName || '未分类' }}
                  </el-tag>
                </div>

                <p class="summary">{{ item.summary || '暂无摘要' }}</p>

                <div class="meta-info">
                  <div class="flex-box">
                    <el-icon><Avatar /></el-icon>
                    <span>{{ item.authorName || '匿名' }}</span>
                  </div>
                  <div class="flex-box">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatTime(item.publishedAt || item.createdAt) }}</span>
                  </div>
                  <div class="flex-box">
                    <el-icon><View /></el-icon>
                    <span>{{ item.readCount || 0 }} 阅读</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="rightArticleList.length === 0" class="empty-text">
              暂无文章
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination-right" v-if="pagination.total > 0">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[4, 5, 10, 20]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              size="default"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { articlePage, getArticle } from '@/api/admin'
import { Avatar, Histogram, Clock, View, Picture } from '@element-plus/icons-vue'
import { fileBaseUrl } from '@/config/index'

const router = useRouter()

// 左侧推荐列表
const leftArticleList = ref([])

// 右侧文章列表
const rightArticleList = ref([])

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 4,
  total: 0
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

// 获取推荐阅读（左侧）
const getLeftArticleList = async () => {
  try {
    // ✅ 修改：获取所有已发布的文章，pageSize设置大一些
    const res = await articlePage({
      currentPage: 1,
      pageSize: 100,  // ✅ 增大pageSize，获取更多文章
      status: 1  // 只查询已发布的
    })
    
    console.log('📥 推荐文章响应:', res)
    
    const data = res.data || res
    if (data && data.records) {
      leftArticleList.value = data.records
      console.log('✅ 推荐文章数量:', leftArticleList.value.length)
    } else {
      leftArticleList.value = []
    }
  } catch (error) {
    console.error('获取推荐文章失败:', error)
    leftArticleList.value = []
  }
}

// 获取文章列表（右侧）
const getRightArticleList = async () => {
  try {
    console.log('📤 请求文章列表，页码:', pagination.currentPage, '每页:', pagination.pageSize)
    
    const res = await articlePage({
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      status: 1  // ✅ 只查询已发布的文章
    })
    
    console.log('📥 文章列表响应:', res)
    
    const data = res.data || res
    
    if (data && data.records) {
      rightArticleList.value = data.records
      pagination.total = data.total || 0
      console.log('✅ 文章列表数量:', rightArticleList.value.length, '总数:', pagination.total)
    } else if (Array.isArray(data)) {
      // 兼容直接返回数组的情况
      rightArticleList.value = data
      pagination.total = data.length
    } else {
      rightArticleList.value = []
      pagination.total = 0
      console.warn('⚠️ 未获取到文章数据')
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    rightArticleList.value = []
    pagination.total = 0
  }
}

// 每页条数变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  getRightArticleList()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.currentPage = page
  getRightArticleList()
}

// 查看文章详情
const selectArticle = (id) => {
  router.push(`/article/${id}`)
}

onMounted(() => {
  getLeftArticleList()
  getRightArticleList()
})
</script>

<style lang="scss" scoped>
.knowledge-container {
  min-height: calc(100vh - 140px);
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f4f6 100%);
  /* ✅ 添加padding-bottom，防止与footer重叠 */
  padding-bottom: 40px;

  .flex-box {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;

    span {
      margin-left: 0;
    }
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
  }

  .content {
    display: flex;
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 20px;
    width: 100%;
    /* ✅ 移除固定高度，让内容自然撑开 */
    min-height: 500px;

    .left-sidebar {
      width: 300px;
      flex-shrink: 0;
    }

    .recommend-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      padding: 20px;
      /* ✅ 移除固定高度，让内容自然撑开 */
      max-height: calc(100vh - 200px);
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(143, 170, 190, 0.1);
      /* ✅ 添加sticky定位，随页面滚动 */
      position: sticky;
      top: 20px;

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid rgba(96, 193, 197, 0.1);
        flex-shrink: 0;

        .title-left {
          display: flex;
          align-items: center;
          gap: 8px;

          .title-icon {
            font-size: 18px;
          }
        }
      }

      .recommend-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        /* ✅ 添加最小高度 */
        min-height: 100px;

        &::-webkit-scrollbar {
          width: 4px;
        }
        &::-webkit-scrollbar-thumb {
          background: #d4d4d4;
          border-radius: 2px;
        }

        .recommend-item {
          padding: 12px;
          border-left: 3px solid #60c1c5;
          background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: linear-gradient(135deg, #e8f8f9 0%, #e0f5f2 100%);
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(96, 193, 197, 0.15);
          }

          h4 {
            font-size: 14px;
            font-weight: 500;
            color: #2c3e50;
            margin: 0 0 8px;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .read-count {
            font-size: 12px;
            color: #9ca3af;
            display: flex;
            align-items: center;
            gap: 4px;
            margin: 0;
          }
        }

        .empty-text {
          text-align: center;
          color: #9ca3af;
          padding: 40px 0;
        }
      }
    }

    .article-list-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(143, 170, 190, 0.1);
      overflow: hidden;
      /* ✅ 移除固定高度 */
      min-height: 500px;
    }

    .article-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      /* ✅ 移除固定高度限制 */
      min-height: 300px;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #d4d4d4;
        border-radius: 3px;
      }

      .article-item {
        background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        gap: 20px;
        border: 1px solid rgba(143, 170, 190, 0.08);
        transition: all 0.3s ease;
        cursor: pointer;

        &:hover {
          background: linear-gradient(135deg, #e8f8f9 0%, #e0f5f2 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(96, 193, 197, 0.12);
        }

        .article-cover {
          width: 200px;
          height: 130px;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          color: #ccc;
          font-size: 40px;
        }

        .info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;

          .title {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 8px;

            h3 {
              font-size: 18px;
              font-weight: 600;
              color: #2c3e50;
              margin: 0;
              line-height: 1.5;
              flex: 1;
            }
          }

          .category-tag {
            border-color: rgba(74, 156, 140, 0.4) !important;
            color: #4a9c8c !important;
            background: rgba(74, 156, 140, 0.08) !important;
          }

          .summary {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
            margin: 0 0 12px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .meta-info {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
          }
        }
      }

      .empty-text {
        text-align: center;
        color: #9ca3af;
        padding: 80px 0;
        font-size: 16px;
      }
    }

    .pagination-right {
      padding: 16px 20px;
      border-top: 1px solid rgba(143, 170, 190, 0.1);
      background: white;
      display: flex;
      justify-content: center;
      flex-shrink: 0;
    }
  }

  @media (max-width: 768px) {
    .content {
      flex-direction: column;
      height: auto;

      .left-sidebar {
        width: 100%;
        height: auto;
        max-height: 300px;
        
        .recommend-section {
          position: static; /* ✅ 移动端取消sticky */
        }
      }

      .article-list {
        .article-item {
          flex-direction: column;

          .article-cover {
            width: 100%;
            height: 180px;
          }
        }
      }
    }
  }
}
</style>