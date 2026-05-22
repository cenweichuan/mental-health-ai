import jwt from 'jsonwebtoken'
import config from '../config/index.js'

// JWT 认证中间件 - 必需登录
export function authRequired(req, res, next) {
  const token = req.headers.token || req.headers['token']
  if (!token) {
    return res.json({ code: -1, msg: '登录过期，请重新登录', data: null })
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    next()
  } catch {
    return res.json({ code: -1, msg: '登录过期，请重新登录', data: null })
  }
}

// JWT 认证中间件 - 可选登录（不登录也能访问，但登录了会解析用户信息）
export function authOptional(req, res, next) {
  const token = req.headers.token || req.headers['token']
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret)
      req.user = decoded
    } catch {
      // token 无效也继续，只是没有用户信息
    }
  }
  next()
}

// 管理员权限中间件
export function adminRequired(req, res, next) {
  const token = req.headers.token || req.headers['token']
  if (!token) {
    return res.json({ code: -1, msg: '登录过期，请重新登录', data: null })
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    if (decoded.userType !== 2) {
      return res.json({ code: 403, msg: '无权限访问', data: null })
    }
    req.user = decoded
    next()
  } catch {
    return res.json({ code: -1, msg: '登录过期，请重新登录', data: null })
  }
}
