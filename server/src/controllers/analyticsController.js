import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 数据看板概览
export async function getOverview(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [
      totalUsers,
      totalDiaries,
      todayDiaries,
      totalSessions,
      todaySessions,
      activeUsersAll,
      avgMoodResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.emotionDiary.count(),
      prisma.emotionDiary.count({ where: { diaryDate: today } }),
      prisma.chatSession.count(),
      prisma.chatSession.count({
        where: { startedAt: { gte: new Date(today) } },
      }),
      prisma.chatSession.groupBy({
        by: ['userId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 100,
      }),
      prisma.emotionDiary.aggregate({ _avg: { moodScore: true } }),
    ])

    // 近14天活跃用户
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const recentActiveUsers = await prisma.chatSession.groupBy({
      by: ['userId'],
      where: { startedAt: { gte: fourteenDaysAgo } },
    })

    // 情绪趋势（近30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const diaries = await prisma.emotionDiary.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { diaryDate: true, moodScore: true },
    })

    const emotionByDate = {}
    for (const d of diaries) {
      if (!emotionByDate[d.diaryDate]) emotionByDate[d.diaryDate] = []
      emotionByDate[d.diaryDate].push(d.moodScore)
    }
    const emotionTrend = Object.entries(emotionByDate)
      .map(([date, scores]) => ({
        date,
        avgMoodScore: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
        recordCount: scores.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 用户活跃趋势（近30天）
    const userActivityData = []
    for (let i = 30; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const dsStart = new Date(ds)
      const dsEnd = new Date(ds)
      dsEnd.setDate(dsEnd.getDate() + 1)

      const [newUsers, activeUsers, diaryUsers, consultationUsers] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: dsStart, lt: dsEnd } } }),
        prisma.chatSession.groupBy({
          by: ['userId'],
          where: { startedAt: { gte: dsStart, lt: dsEnd } },
        }).then((r) => r.length),
        prisma.emotionDiary.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: dsStart, lt: dsEnd } },
        }).then((r) => r.length),
        prisma.chatSession.groupBy({
          by: ['userId'],
          where: { startedAt: { gte: dsStart, lt: dsEnd } },
        }).then((r) => r.length),
      ])

      userActivityData.push({ date: ds, newUsers, activeUsers, diaryUsers, consultationUsers })
    }

    return res.json({
      code: 200,
      msg: 'success',
      data: {
        systemOverview: {
          totalUsers,
          activeUsers: recentActiveUsers.length,
          totalDiaries,
          todayNewDiaries: todayDiaries,
          totalSessions,
          todayNewSessions: todaySessions,
          avgMoodScore: avgMoodResult._avg.moodScore
            ? parseFloat(avgMoodResult._avg.moodScore.toFixed(1))
            : 0,
        },
        emotionTrend,
        userActivity: userActivityData,
      },
    })
  } catch (err) {
    console.error('获取数据概览失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}
