import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import config from '../config/index.js'

const prisma = new PrismaClient()

function fmtDate(d) {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  const h = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  const s = String(dt.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

const openai = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: config.deepseek.baseURL,
})

const SYSTEM_PROMPT = `你是一位专业、温暖且富有同理心的心理健康咨询师。你的职责包括：

1. 情绪分析：根据用户的描述，识别并分析他们当前的情绪状态，给出情绪评分（1-10分），并指出情绪性质（正向/负向）。
2. 专业建议：提供切实可行的心理调适建议、认知重构引导和放松技巧。
3. 风险评估：评估用户是否存在自伤、自杀或伤害他人的风险，标记高/中/低风险等级。
4. 积极引导：用温暖、共情的语言回应用户，帮助建立积极的心态。

请在回复结束时进行情绪分析，格式如下（在回复末尾）：
【情绪分析】
主要情绪：<情绪名称>
情绪评分：<1-10>
情绪性质：<正向/负向>
风险等级：<高/中/低>

请始终以专业心理咨询师的身份对话，不要承认自己是AI。如果用户表现出危机倾向，请优先提供危机干预热线索。`

// 获取会话列表（普通用户看自己的，管理员看全部）
export async function getSessions(req, res) {
  try {
    const isAdmin = req.user.userType === 2
    const { pageNum = 1, pageSize = 50, nickname } = req.query
    const page = parseInt(pageNum)
    const size = parseInt(pageSize)

    const where = {}
    if (!isAdmin) {
      where.userId = req.user.id
    } else if (nickname) {
      where.user = { nickname: { contains: nickname } }
    }

    const [records, total] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
        include: isAdmin ? { user: { select: { id: true, username: true, nickname: true } } } : undefined,
      }),
      prisma.chatSession.count({ where }),
    ])

    const formatted = records.map((r) => {
      const result = {
        id: r.id,
        sessionTitle: r.sessionTitle,
        status: r.status,
        startedAt: fmtDate(r.startedAt),
        lastMessageContent: r.lastMessageContent,
        lastMessageTime: fmtDate(r.startedAt),
        messageCount: r.messageCount,
        durationMinutes: r.durationMinutes,
      }
      if (isAdmin && r.user) {
        result.userId = r.userId
        result.userNickname = r.user.nickname || r.user.username
      }
      return result
    })

    return res.json({ code: 200, msg: 'success', data: { records: formatted, total } })
  } catch (err) {
    console.error('获取会话列表失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 获取会话消息列表
export async function getSessionMessages(req, res) {
  try {
    const sessionId = parseInt(req.params.id)
    const isAdmin = req.user.userType === 2

    // 非管理员需校验会话归属
    if (!isAdmin) {
      const session = await prisma.chatSession.findUnique({ where: { id: sessionId } })
      if (!session || session.userId !== req.user.id) {
        return res.json({ code: 403, msg: '无权限访问', data: null })
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    const records = messages.map((m) => ({
      id: m.id,
      senderType: m.senderType === 'USER' ? 1 : 2,
      content: m.content,
      createdAt: fmtDate(m.createdAt),
      createAt: fmtDate(m.createdAt),
    }))

    return res.json({ code: 200, msg: 'success', data: records })
  } catch (err) {
    console.error('获取消息失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 获取会话情绪分析
export async function getSessionEmotion(req, res) {
  try {
    const sessionId = parseInt(req.params.id)
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId, senderType: 'AI' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // 从最近的AI回复中提取情绪分析
    const emotionData = {
      primaryEmotion: '',
      emotionScore: 0,
      riskLevel: '低',
      isNegative: false,
    }

    for (const msg of messages) {
      const match = msg.content.match(/【情绪分析】([\s\S]*?)(?=【|$)/)
      if (match) {
        const block = match[1]
        const emotionMatch = block.match(/主要情绪[：:]\s*(.+)/)
        const scoreMatch = block.match(/情绪评分[：:]\s*(\d+)/)
        const natureMatch = block.match(/情绪性质[：:]\s*(.+)/)
        const riskMatch = block.match(/风险等级[：:]\s*(.+)/)
        if (emotionMatch) emotionData.primaryEmotion = emotionMatch[1].trim()
        if (scoreMatch) emotionData.emotionScore = parseInt(scoreMatch[1])
        if (riskMatch) emotionData.riskLevel = riskMatch[1].trim()
        if (natureMatch) emotionData.isNegative = natureMatch[1].trim().includes('负')
        break
      }
    }

    return res.json({ code: 200, msg: 'success', data: emotionData })
  } catch (err) {
    console.error('获取会话情绪分析失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 开始新会话（只创建会话，消息统一由 /stream 保存）
export async function startSession(req, res) {
  try {
    const userId = req.user.id
    const { initialMessage, sessionTitle } = req.body

    const session = await prisma.chatSession.create({
      data: {
        userId,
        sessionTitle: sessionTitle || `心理咨询-${new Date().toLocaleString()}`,
        status: 'ACTIVE',
        lastMessageContent: initialMessage?.slice(0, 200) || '',
        messageCount: 0,
      },
    })

    return res.json({
      code: 200,
      msg: 'success',
      data: {
        sessionId: session.id,
        status: session.status,
        sessionTitle: session.sessionTitle,
      },
    })
  } catch (err) {
    console.error('创建会话失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// SSE 流式对话
export async function chatStream(req, res) {
  const { sessionId, userMessage } = req.body

  if (!sessionId || !userMessage) {
    return res.json({ code: 400, msg: '参数不完整', data: null })
  }

  // 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const sendSSE = (event, data) => {
    if (event) {
      res.write(`event: ${event}\n`)
    }
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const sid = parseInt(sessionId)

    // 保存用户消息
    await prisma.chatMessage.create({
      data: { sessionId: sid, senderType: 'USER', content: userMessage },
    })

    // 获取历史消息作为上下文（最近20条）
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: sid },
      orderBy: { createdAt: 'asc' },
      take: 40,
    })

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.senderType === 'USER' ? 'user' : 'assistant',
        content: m.content,
      })),
    ]

    // 调用 DeepSeek 流式 API
    const stream = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    })

    let fullContent = ''

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        fullContent += delta
        sendSSE(null, { code: 200, data: { content: delta } })
      }
    }

    // 保存 AI 回复
    await prisma.chatMessage.create({
      data: { sessionId: sid, senderType: 'AI', content: fullContent },
    })

    // 更新会话信息
    await prisma.chatSession.update({
      where: { id: sid },
      data: {
        lastMessageContent: fullContent.slice(0, 200) || userMessage.slice(0, 200),
        messageCount: { increment: 2 },
      },
    })

    // 发送结束事件
    sendSSE('done', '[DONE]')
    res.end()
  } catch (err) {
    console.error('流式对话失败:', err)
    try {
      sendSSE(null, {
        code: 500,
        data: { content: '抱歉，我暂时无法回复，请稍后再试。' },
      })
      sendSSE('done', '[DONE]')
    } catch {
      // 连接可能已断开
    }
    res.end()
  }
}

// 删除会话
export async function deleteSession(req, res) {
  try {
    const id = parseInt(req.params.id)
    await prisma.chatSession.delete({ where: { id } })
    return res.json({ code: 200, msg: '删除成功', data: null })
  } catch (err) {
    console.error('删除会话失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}
