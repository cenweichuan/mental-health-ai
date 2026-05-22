import { Router } from 'express'
import {
  emotionDiarySave,
  getAdminDiaryPage,
  deleteAdminDiary,
} from '../controllers/diaryController.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

// 前端用户接口（需要登录）
router.post('/', authRequired, emotionDiarySave)

// 情绪日志查询（登录即可，非管理员只能看自己的）
router.get('/admin/page', authRequired, getAdminDiaryPage)

// 后台管理接口（管理员）
router.delete('/admin/:id', adminRequired, deleteAdminDiary)

export default router
