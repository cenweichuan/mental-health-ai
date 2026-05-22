import { Router } from 'express'
import {
  getSessions,
  getSessionMessages,
  getSessionEmotion,
  startSession,
  chatStream,
  deleteSession,
} from '../controllers/chatController.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// 前端用户接口（需要登录）
router.get('/sessions', authRequired, getSessions)
router.get('/sessions/:id/messages', authRequired, getSessionMessages)
router.get('/session/:id/emotion', authRequired, getSessionEmotion)
router.post('/session/start', authRequired, startSession)
router.post('/stream', authRequired, chatStream)
router.delete('/sessions/:id', authRequired, deleteSession)

export default router
