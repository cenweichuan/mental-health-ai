import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 前端用户 - 创建情绪日记（每次都是新增，不覆盖）
export async function emotionDiarySave(req, res) {
  try {
    const userId = req.user.id
    const {
      moodScore,
      dominantEmotion,
      emotionTriggers,
      diaryContent,
      sleepQuality = 3,
      stressLevel = 3,
      diaryDate,
    } = req.body

    if (!moodScore || !dominantEmotion) {
      return res.json({ code: 400, msg: '情绪评分和主要情绪不能为空', data: null })
    }

    const date = diaryDate || new Date().toISOString().split('T')[0]

    const diary = await prisma.emotionDiary.create({
      data: {
        userId,
        moodScore: parseInt(moodScore),
        dominantEmotion,
        emotionTriggers: emotionTriggers || '',
        diaryContent: diaryContent || '',
        sleepQuality: parseInt(sleepQuality),
        stressLevel: parseInt(stressLevel),
        diaryDate: date,
      },
    })

    return res.json({ code: 200, msg: '保存成功', data: diary })
  } catch (err) {
    console.error('保存情绪日记失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 情绪日志分页（管理员看全部，普通用户只看自己的）
export async function getAdminDiaryPage(req, res) {
  try {
    const isAdmin = req.user.userType === 2
    const {
      currentPage = 1,
      pageSize = 10,
      nickname,
      userId,
      minMoodScore,
      maxMoodScore,
    } = req.query

    const page = parseInt(currentPage)
    const size = parseInt(pageSize)

    const where = {}

    // 非管理员只能看自己的日记
    if (!isAdmin) {
      where.userId = req.user.id
    } else {
      if (userId) where.userId = parseInt(userId)
      if (nickname) where.user = { nickname: { contains: nickname } }
    }

    if (minMoodScore) where.moodScore = { ...where.moodScore, gte: parseInt(minMoodScore) }
    if (maxMoodScore) where.moodScore = { ...where.moodScore, lte: parseInt(maxMoodScore) }

    const [records, total] = await Promise.all([
      prisma.emotionDiary.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, nickname: true } } },
      }),
      prisma.emotionDiary.count({ where }),
    ])

    const formatted = records.map((r) => ({
      id: r.id,
      userId: r.userId,
      nickname: r.user?.nickname || r.user?.username || '未知',
      diaryDate: r.diaryDate,
      dominantEmotion: r.dominantEmotion,
      moodScore: r.moodScore,
      sleepQuality: r.sleepQuality,
      stressLevel: r.stressLevel,
      emotionTriggers: r.emotionTriggers,
      diaryContent: r.diaryContent,
      aiEmotionAnalysis: r.aiEmotionAnalysis,
      createdAt: r.createdAt,
    }))

    return res.json({ code: 200, msg: 'success', data: { records: formatted, total } })
  } catch (err) {
    console.error('获取情绪日志列表失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 后台管理 - 删除情绪日志
export async function deleteAdminDiary(req, res) {
  try {
    const id = parseInt(req.params.id)
    await prisma.emotionDiary.delete({ where: { id } })
    return res.json({ code: 200, msg: '删除成功', data: null })
  } catch (err) {
    console.error('删除情绪日志失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}
