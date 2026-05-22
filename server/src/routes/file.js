import { Router } from 'express'
import { upload, uploadFile } from '../controllers/fileController.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.post('/upload', authRequired, upload.single('file'), uploadFile)

export default router
