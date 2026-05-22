import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import { join } from 'path'
import { randomUUID } from 'crypto'
import config from '../config/index.js'

const prisma = new PrismaClient()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `${randomUUID()}.${ext}`)
  },
})

export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.json({ code: 400, msg: '请选择文件', data: null })
    }

    const { businessType, businessId } = req.body
    const url = `/uploads/${req.file.filename}`

    await prisma.file.create({
      data: {
        filename: req.file.originalname,
        url,
        businessType: businessType || '',
        businessId: businessId || '',
        size: req.file.size,
      },
    })

    return res.json({ code: 200, msg: '上传成功', data: { url } })
  } catch (err) {
    console.error('文件上传失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}
