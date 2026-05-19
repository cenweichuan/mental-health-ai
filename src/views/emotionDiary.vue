<!-- src/views/emotionDiary.vue - 完整代码 -->
<template>
  <div class="emotionDiary-container">
    <div class="content">
      <!-- 情绪评分 -->
      <div class="diary-card">
        <div class="title">今天的你，感觉怎么样？</div>
        <div class="section">
          <p>给自己一个小小的评分吧 ✨</p>
          <div class="rate">
            <el-rate
              v-model="diaryForm.moodScore"
              :max="10"
              :texts="emotionStatus"
              show-text
              size="large"
            ></el-rate>
          </div>
        </div>
      </div>

      <!-- 主要情绪 -->
      <div class="diary-card">
        <div class="title">此刻最想拥抱哪种情绪？</div>
        <div class="emotion-grid">
          <div
            v-for="item in emotionOptions"
            :key="item.name"
            :class="{ selected: item.name === diaryForm.dominantEmotion }"
            class="emotion-card"
            @click="selectEmotion(item.name)"
          >
            <el-image :src="item.url" style="width: 50px; height: 50px"></el-image>
            <div class="emotion-name">{{ item.name }}</div>
          </div>
        </div>
      </div>

      <!-- 详细记录 -->
      <div class="diary-card">
        <div class="title">写下今天的故事</div>
        <div class="detail-form">
          <div class="form-group">
            <div class="form-label">是什么触动了你的心？</div>
            <el-input
              v-model="diaryForm.emotionTriggers"
              :rows="3"
              maxlength="1000"
              placeholder="今天有遇到什么特别的事吗？😊"
              show-word-limit
              type="textarea"
            ></el-input>
          </div>

          <div class="form-group">
            <div class="form-label">想对自己说些什么？</div>
            <el-input
              v-model="diaryForm.diaryContent"
              :rows="5"
              maxlength="2000"
              placeholder="无论是开心的小事，还是成长的烦恼，都值得被记录..."
              show-word-limit
              type="textarea"
            ></el-input>
          </div>

          <!-- 生活指标 -->
          <div class="life-indicators">
            <div class="indicator-group">
              <div class="form-label">昨晚睡得香吗？</div>
              <el-select v-model="diaryForm.sleepQuality" placeholder="选择你的睡眠状态">
                <el-option :value="5" label="睡得超好 😴"></el-option>
                <el-option :value="4" label="还不错 👍"></el-option>
                <el-option :value="3" label="一般般 ☕️"></el-option>
                <el-option :value="2" label="有点难熬 😣"></el-option>
                <el-option :value="1" label="失眠了 😵"></el-option>
              </el-select>
            </div>

            <div class="indicator-group">
              <div class="form-label">今天压力大吗？</div>
              <el-select v-model="diaryForm.stressLevel" placeholder="选择你的压力状态">
                <el-option :value="1" label="轻松自在 🍃"></el-option>
                <el-option :value="2" label="有点小压力 💪"></el-option>
                <el-option :value="3" label="还好还好 😊"></el-option>
                <el-option :value="4" label="有点喘不过气 😰"></el-option>
                <el-option :value="5" label="压力山大 😫"></el-option>
              </el-select>
            </div>
          </div>

          <div class="action-buttons">
            <el-button @click="resetDiaryForm">重新记录</el-button>
            <el-button type="primary" @click="submitDiaryForm" :loading="submitting">保存今日心情</el-button>
          </div>
        </div>
      </div>

      <!-- ✅ 新增：我的情绪日记列表 -->
      <div class="diary-card">
        <div class="title">我的情绪日记</div>
        <div class="my-diary-list">
          <div v-if="myDiaryList.length === 0" class="empty-diary">
            <p>还没有记录过情绪日记</p>
            <p>开始记录你的第一个情绪日记吧！</p>
          </div>
          <div v-else class="diary-items">
            <div v-for="diary in myDiaryList" :key="diary.id" class="diary-item">
              <div class="diary-header">
                <div class="diary-date">{{ formatDate(diary.diaryDate || diary.createdAt) }}</div>
                <div class="diary-score">
                  <el-rate v-model="diary.moodScore" :max="10" disabled size="small" />
                  <span class="score-text">{{ diary.moodScore }}/10</span>
                </div>
              </div>
              <div class="diary-emotion" v-if="diary.dominantEmotion">
                <el-tag size="small">{{ diary.dominantEmotion }}</el-tag>
              </div>
              <div class="diary-content" v-if="diary.diaryContent">
                {{ diary.diaryContent }}
              </div>
              <div class="diary-triggers" v-if="diary.emotionalTriggers">
                <span class="trigger-label">触发因素：</span>
                {{ diary.emotionalTriggers }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { emotionDiarySave } from '@/api/admin'
import { getEmotionalPage } from '@/api/admin'

const submitting = ref(false)
const myDiaryList = ref([])

// 情绪评分对应状态
const emotionStatus = [
  '绝望崩溃',
  '消沉抑郁',
  '焦虑烦躁',
  '低落不悦',
  '平静淡然',
  '轻松惬意',
  '愉悦舒心',
  '欢欣满足',
  '兴奋欣喜',
  '极致幸福'
]

// 主要情绪选项
const emotionOptions = [
  { name: '开心', url: new URL('@/assets/images/开心.png', import.meta.url).href },
  { name: '平静', url: new URL('@/assets/images/平静.png', import.meta.url).href },
  { name: '焦虑', url: new URL('@/assets/images/焦虑.png', import.meta.url).href },
  { name: '悲伤', url: new URL('@/assets/images/悲伤.png', import.meta.url).href },
  { name: '兴奋', url: new URL('@/assets/images/兴奋.png', import.meta.url).href },
  { name: '疲惫', url: new URL('@/assets/images/疲惫.png', import.meta.url).href },
  { name: '惊讶', url: new URL('@/assets/images/惊讶.png', import.meta.url).href },
  { name: '困惑', url: new URL('@/assets/images/困惑.png', import.meta.url).href }
]

// 表单数据
const diaryForm = reactive({
  moodScore: 0,
  dominantEmotion: '',
  emotionTriggers: '',
  diaryContent: '',
  sleepQuality: 3,
  stressLevel: 3
})

// 选择情绪
const selectEmotion = (name) => {
  diaryForm.dominantEmotion = name
}

// 重置表单
const resetDiaryForm = () => {
  diaryForm.moodScore = 0
  diaryForm.dominantEmotion = ''
  diaryForm.emotionTriggers = ''
  diaryForm.diaryContent = ''
  diaryForm.sleepQuality = 3
  diaryForm.stressLevel = 3
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// ✅ 获取当前用户的情绪日记列表
const getMyDiaryList = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.id || userInfo.userId
    
    if (!userId) {
      console.warn('未获取到用户ID')
      return
    }

    // 查询当前用户的情绪日记
    const res = await getEmotionalPage({
      currentPage: 1,
      pageSize: 10,
      userId: userId  // ✅ 传入当前用户ID进行过滤
    })

    console.log('获取我的情绪日记响应:', res)

    const data = res.data || res
    if (data && data.records) {
      myDiaryList.value = data.records
    } else {
      myDiaryList.value = []
    }
  } catch (error) {
    console.error('获取情绪日记列表失败:', error)
  }
}

// ✅ 提交表单
const submitDiaryForm = async () => {
  // 表单验证
  if (diaryForm.moodScore === 0) {
    ElMessage.warning('请选择情绪评分')
    return
  }

  if (!diaryForm.dominantEmotion) {
    ElMessage.warning('请选择主要情绪')
    return
  }

  submitting.value = true

  try {
    // 获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    
    // ✅ 构建提交数据，确保包含用户信息
    const submitData = {
      ...diaryForm,
      userId: userInfo.id || userInfo.userId,  // 用户ID
      diaryDate: new Date().toISOString().split('T')[0],  // 当前日期
    }

    console.log('提交的情绪日记数据:', submitData)

    const res = await emotionDiarySave(submitData)
    
    console.log('提交响应:', res)

    // ✅ 兼容不同的响应格式
    if (res.code == 200 || res.success) {
      ElMessage.success('心情记录成功！')
      resetDiaryForm()
      // ✅ 重新加载列表
      await getMyDiaryList()
    } else {
      ElMessage.error(res.msg || res.message || '保存失败')
    }
  } catch (error) {
    console.error('提交情绪日记失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  getMyDiaryList()
})
</script>

<style lang="scss" scoped>
.emotionDiary-container {
  min-height: calc(100vh - 140px);
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f4f6 100%);

  .content {
    margin: 0 auto;
    max-width: 980px;
    padding: 32px 20px;

    .diary-card {
      margin-bottom: 24px;
      background: white;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(143, 170, 190, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 24px rgba(143, 170, 190, 0.12);
        transform: translateY(-2px);
      }

      .title {
        margin-bottom: 24px;
        font-size: 22px;
        font-weight: 600;
        color: #2c3e50;
        position: relative;
        padding-left: 16px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: linear-gradient(180deg, #60c1c5 0%, #7dd5a8 100%);
          border-radius: 2px;
        }
      }

      .section {
        margin-bottom: 20px;

        p {
          font-size: 15px;
          color: #6b7280;
          margin-bottom: 16px;
          line-height: 1.6;
        }
      }

      .rate {
        padding: 12px 0;
      }

      .emotion-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;

        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
        }

        .emotion-card {
          padding: 20px 16px;
          border: 2px solid #e8edf2;
          border-radius: 16px;
          text-align: center;
          cursor: pointer;
          background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            border-color: #60c1c5;
            background: linear-gradient(135deg, #e8f8f9 0%, #e0f5f2 100%);
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(96, 193, 197, 0.15);
          }

          &.selected {
            border-color: #7dd5a8;
            background: linear-gradient(135deg, #e0f7ee 0%, #d0f0e3 100%);
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(125, 213, 168, 0.2);

            .emotion-name {
              color: #4a9c8c;
              font-weight: 600;
            }
          }

          .emotion-name {
            margin-top: 12px;
            color: #4a5568;
            font-size: 14px;
            transition: all 0.3s ease;
          }
        }
      }

      .detail-form {
        .form-label {
          margin: 16px 0 12px;
          color: #2c3e50;
          font-weight: 500;
          font-size: 15px;
        }

        .life-indicators {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 24px;

          @media (max-width: 768px) {
            grid-template-columns: 1fr;
          }

          .indicator-group {
            display: flex;
            flex-direction: column;
          }
        }

        .action-buttons {
          margin-top: 40px;
          display: flex;
          gap: 16px;
          justify-content: center;

          .el-button {
            min-width: 120px;
            padding: 12px 32px;
            font-size: 15px;
            border-radius: 8px;
            transition: all 0.3s ease;

            &:not(.el-button--primary) {
              border-color: #60c1c5;
              color: #60c1c5;

              &:hover {
                background: #60c1c5;
                color: white;
              }
            }

            &.el-button--primary {
              background: linear-gradient(135deg, #7dd5a8 0%, #60c1c5 100%);
              border: none;

              &:hover {
                background: linear-gradient(135deg, #68c59a 0%, #50b1b5 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(96, 193, 197, 0.3);
              }
            }
          }
        }
      }
    }
  }
}

// ✅ 新增：我的日记列表样式
.my-diary-list {
  .empty-diary {
    text-align: center;
    padding: 40px 0;
    color: #9ca3af;
    
    p {
      margin: 8px 0;
      font-size: 15px;
    }
  }

  .diary-items {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .diary-item {
      padding: 20px;
      background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
      border-radius: 12px;
      border: 1px solid rgba(143, 170, 190, 0.1);
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, #e8f8f9 0%, #e0f5f2 100%);
        transform: translateX(4px);
      }

      .diary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .diary-date {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .diary-score {
          display: flex;
          align-items: center;
          gap: 8px;

          .score-text {
            font-weight: 600;
            color: #4a9c8c;
            font-size: 14px;
          }
        }
      }

      .diary-emotion {
        margin-bottom: 12px;
      }

      .diary-content {
        font-size: 14px;
        color: #374151;
        line-height: 1.6;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .diary-triggers {
        font-size: 13px;
        color: #6b7280;
        
        .trigger-label {
          font-weight: 500;
          color: #4a5568;
        }
      }
    }
  }
}
</style>