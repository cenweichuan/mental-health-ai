import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { mkdirSync } from 'fs'
import config from './config/index.js'
import routes from './routes/index.js'

// 确保上传目录存在
mkdirSync(config.uploadDir, { recursive: true })

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(config.uploadDir))

// 统一响应格式：code=200 时自动添加 success: true
app.use((_req, res, next) => {
  const orig = res.json.bind(res)
  res.json = (body) => {
    if (body && body.code == 200) {
      body.success = true
    }
    return orig(body)
  }
  next()
})

// API 路由
app.use('/api', routes)

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ code: 500, msg: '服务器内部错误', data: null })
})

app.listen(config.port, () => {
  console.log(`心理健康AI助手后端服务已启动: http://localhost:${config.port}`)
  console.log(`API 地址: http://localhost:${config.port}/api`)
})
