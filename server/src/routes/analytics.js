import { Router } from 'express'
import { getOverview } from '../controllers/analyticsController.js'
import { adminRequired } from '../middleware/auth.js'

const router = Router()

router.get('/overview', adminRequired, getOverview)

export default router
