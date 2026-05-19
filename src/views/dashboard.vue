<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div class="card-content">
            <div class="avatar users">
              <el-image :src="iconUrl1" style="width: 40px; height: 40px;" />
            </div>
            <div class="info">
              <p class="title">用户数</p>
              <p class="value">{{ aiData?.systemOverview?.totalUsers || 0 }}</p>
              <p class="subtitle-title">
                活跃用户 {{ aiData?.systemOverview?.activeUsers || 0 }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div class="card-content">
            <div class="avatar like">
              <el-image :src="iconUrl2" style="width: 40px; height: 40px;" />
            </div>
            <div class="info">
              <p class="title">情绪日志</p>
              <p class="value">{{ aiData?.systemOverview?.totalDiaries || 0 }}</p>
              <p class="subtitle-title">
                今日新增 {{ aiData?.systemOverview?.todayNewDiaries || 0 }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div class="card-content">
            <div class="avatar comments">
              <el-image :src="iconUrl3" style="width: 40px; height: 40px;" />
            </div>
            <div class="info">
              <p class="title">咨询会话</p>
              <p class="value">{{ aiData?.systemOverview?.totalSessions || 0 }}</p>
              <p class="subtitle-title">
                今日新增 {{ aiData?.systemOverview?.todayNewSessions || 0 }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div class="card-content">
            <div class="avatar smile">
              <el-image :src="iconUrl4" style="width: 40px; height: 40px;" />
            </div>
            <div class="info">
              <p class="title">平均情绪</p>
              <p class="value">
                {{ aiData?.systemOverview?.avgMoodScore || 0 }}/10
              </p>
              <p class="subtitle-title">情绪健康指数</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">情绪趋势分析</div>
          </template>
          <div ref="emotionChartRef" style="height: 340px; width: 100%;"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card style="width: 100%;">
          <template #header>
            <div class="card-header">咨询会话统计</div>
          </template>

          <div class="chart-content">
            <!-- ✅ 修复：统一使用 systemOverview 的数据 -->
            <div v-if="aiData.systemOverview" class="consultation-stats">
              <div class="stat-item">
                <div class="stat-label">总会话数</div>
                <div class="stat-value">
                  {{ aiData.systemOverview.totalSessions || 0 }}
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">今日新增</div>
                <div class="stat-value">
                  {{ aiData.systemOverview.todayNewSessions || 0 }}
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">活跃用户</div>
                <div class="stat-value">
                  {{ aiData.systemOverview.activeUsers || 0 }}
                </div>
              </div>
            </div>

            <div
              ref="consultationChartRef"
              style="height: 260px; width: 100%;"
            ></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-card style="width: 100%;">
        <template #header>
          <div class="card-header">用户活跃度趋势</div>
        </template>

        <div class="chart-content">
          <div
            ref="userActivityChartRef"
            style="height: 260px; width: 100%;"
          ></div>
        </div>
      </el-card>
    </el-row>
  </div>
</template>

<script setup>
import { getAnalyticsOverview } from '@/api/admin'
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import * as echarts from 'echarts'

const aiData = ref({
  systemOverview: {},
  emotionTrend: [],
  consultationStats: {},
  userActivity: []
})

let emotionChart = null
let consultationChart = null
let userActivityChart = null

const emotionChartRef = ref(null)
const consultationChartRef = ref(null)
const userActivityChartRef = ref(null)

const iconUrl1 = new URL('@/assets/images/users.png', import.meta.url).href
const iconUrl2 = new URL('@/assets/images/like.png', import.meta.url).href
const iconUrl3 = new URL('@/assets/images/comments.png', import.meta.url).href
const iconUrl4 = new URL('@/assets/images/smile.png', import.meta.url).href

// 情绪趋势图
const initEmotionChart = () => {
  if (!emotionChartRef.value) return

  emotionChart?.dispose()
  emotionChart = echarts.init(emotionChartRef.value)

  const trendData = aiData.value?.emotionTrend || []

  if (!trendData.length) {
    emotionChart.setOption({
      title: {
        text: '暂无情绪趋势数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#95a5a6', fontSize: 14 }
      }
    })
    return
  }

  const option = {
    title: {
      text: '情绪趋势分析',
      left: 'center',
      top: 10,
      textStyle: { color: '#2c3e50', fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['平均情绪值', '记录数量'],
      top: 40
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.date)
    },
    yAxis: [
      { type: 'value', name: '情绪值', min: 0, max: 10 },
      { type: 'value', name: '记录数量' }
    ],
    series: [
      {
        name: '平均情绪值',
        type: 'line',
        data: trendData.map(item => item.avgMoodScore),
        smooth: true,
        yAxisIndex: 0,
        lineStyle: { width: 3, color: '#667eea' },
        itemStyle: { color: '#667eea' },
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ]
          }
        }
      },
      {
        name: '记录数量',
        type: 'line',
        data: trendData.map(item => item.recordCount),
        smooth: true,
        yAxisIndex: 1,
        lineStyle: { width: 3, color: '#f5576c' },
        itemStyle: { color: '#f5576c' },
        symbol: 'diamond',
        symbolSize: 6,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 87, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  emotionChart.setOption(option)
}

// 咨询会话统计图
const initConsultationChart = () => {
  if (!consultationChartRef.value) return

  consultationChart?.dispose()
  consultationChart = echarts.init(consultationChartRef.value)

  const activityData = aiData.value?.userActivity || []

  if (!activityData.length) {
    consultationChart.setOption({
      title: {
        text: '暂无咨询趋势数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#95a5a6', fontSize: 14 }
      }
    })
    return
  }

  const option = {
    title: {
      text: '用户活动统计',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 600, color: '#2d3436' }
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['咨询会话', '参与用户'],
      top: 40
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: activityData.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '咨询会话',
        type: 'bar',
        data: activityData.map(item => item.consultationUsers || 0),
        barWidth: '35%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: '#74b9ff'
        }
      },
      {
        name: '参与用户',
        type: 'bar',
        data: activityData.map(item => item.activeUsers || 0),
        barWidth: '35%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: '#fdcb6e'
        }
      }
    ]
  }

  consultationChart.setOption(option)
}

// 用户活跃度趋势图
const initUserActivityChart = () => {
  if (!userActivityChartRef.value) return

  userActivityChart?.dispose()
  userActivityChart = echarts.init(userActivityChartRef.value)

  const activityData = aiData.value?.userActivity || []

  if (!activityData.length) {
    userActivityChart.setOption({
      title: {
        text: '暂无活跃度数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#95a5a6', fontSize: 14 }
      }
    })
    return
  }

  const option = {
    title: {
      text: '用户活跃度趋势',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 600, color: '#2d3436' }
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['活跃用户', '新增用户', '日记用户', '咨询用户'],
      top: 40
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: activityData.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '活跃用户',
        type: 'line',
        data: activityData.map(item => item.activeUsers),
        smooth: true,
        lineStyle: { width: 3, color: '#a29bfe' },
        itemStyle: { color: '#a29bfe' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(162, 155, 254, 0.4)' },
              { offset: 1, color: 'rgba(162, 155, 254, 0.1)' }
            ]
          }
        }
      },
      {
        name: '新增用户',
        type: 'line',
        data: activityData.map(item => item.newUsers),
        smooth: true,
        lineStyle: { width: 3, color: '#fdcb6e' },
        itemStyle: { color: '#fdcb6e' }
      },
      {
        name: '日记用户',
        type: 'line',
        data: activityData.map(item => item.diaryUsers),
        smooth: true,
        lineStyle: { width: 3, color: '#00b894' },
        itemStyle: { color: '#00b894' }
      },
      {
        name: '咨询用户',
        type: 'line',
        data: activityData.map(item => item.consultationUsers),
        smooth: true,
        lineStyle: { width: 3, color: '#fab1a0' },
        itemStyle: { color: '#fab1a0' }
      }
    ]
  }

  userActivityChart.setOption(option)
}

// 响应式
const handleResize = () => {
  emotionChart?.resize()
  consultationChart?.resize()
  userActivityChart?.resize()
}

const initAllCharts = () => {
  nextTick(() => {
    initEmotionChart()
    initConsultationChart()
    initUserActivityChart()
  })
}

onMounted(async () => {
  try {
    const res = await getAnalyticsOverview()

    const businessData = res.data || res

    aiData.value = {
      systemOverview: businessData.systemOverview || {},
      emotionTrend: businessData.emotionTrend || [],
      consultationStats: businessData.consultationStats || {},
      userActivity: businessData.userActivity || []
    }

    console.log('✅ aiData 赋值完成:', aiData.value)

    initAllCharts()
    window.addEventListener('resize', handleResize)
  } catch (error) {
    console.error('获取数据失败：', error)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)

  emotionChart?.dispose()
  consultationChart?.dispose()
  userActivityChart?.dispose()

  emotionChart = null
  consultationChart = null
  userActivityChart = null
})
</script>

<style lang="css" scoped>
.dashboard-container {
  .card-content {
    display: flex;
    align-items: center;

    .avatar {
      margin-right: 12px;
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.users {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.like {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.comments {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.smile {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }

    .info {
      .title {
        font-size: 14px;
        color: #7f8c8d;
        margin-bottom: 4px;
      }

      .value {
        font-size: 24px;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 4px;
      }

      .subtitle-title {
        font-size: 12px;
        color: #95a5a6;
      }
    }
  }

  .chart-content {
    padding: 20px;
    height: 300px;
    position: relative;

    canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .consultation-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;

      .stat-item {
        text-align: center;

        .stat-label {
          font-size: 12px;
          color: #7f8c8d;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
      }
    }
  }
}
</style>