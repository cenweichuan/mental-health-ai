import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../config/index.js'

const prisma = new PrismaClient()

// 用户注册
export async function register(req, res) {
  try {
    const { username, password, nickname } = req.body

    if (!username || !password) {
      return res.json({ code: 400, msg: '用户名和密码不能为空', data: null })
    }

    const exist = await prisma.user.findUnique({ where: { username } })
    if (exist) {
      return res.json({ code: 400, msg: '用户名已存在', data: null })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        nickname: nickname || username,
        userType: 1,
      },
    })

    return res.json({ code: 200, msg: '注册成功', data: { id: user.id, username: user.username } })
  } catch (err) {
    console.error('注册失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 用户登录
export async function login(req, res) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.json({ code: 400, msg: '用户名和密码不能为空', data: null })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.json({ code: 400, msg: '用户名或密码错误', data: null })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.json({ code: 400, msg: '用户名或密码错误', data: null })
    }

    const token = jwt.sign(
      { id: user.id, userId: user.id, username: user.username, userType: user.userType },
      config.jwtSecret,
      { expiresIn: '7d' },
    )

    return res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          userId: user.id,
          username: user.username,
          nickname: user.nickname,
          userType: user.userType,
        },
      },
    })
  } catch (err) {
    console.error('登录失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 退出登录
export async function logout(req, res) {
  return res.json({ code: 200, msg: '退出成功', data: null })
}
