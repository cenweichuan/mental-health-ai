import { Router } from 'express'
import userRoutes from './user.js'
import knowledgeRoutes from './knowledge.js'
import fileRoutes from './file.js'
import chatRoutes from './chat.js'
import diaryRoutes from './diary.js'
import analyticsRoutes from './analytics.js'

const router = Router()

router.use('/user', userRoutes)
router.use('/knowledge', knowledgeRoutes)
router.use('/file', fileRoutes)
router.use('/psychological-chat', chatRoutes)
router.use('/emotion-diary', diaryRoutes)
router.use('/data-analytics', analyticsRoutes)

export default router
