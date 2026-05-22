import { Router } from 'express'
import {
  categoryTree,
  articlePage,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
} from '../controllers/knowledgeController.js'
import { adminRequired } from '../middleware/auth.js'

const router = Router()

router.get('/category/tree', categoryTree)
router.get('/article/page', articlePage)
router.get('/article/:id', getArticle)
router.post('/article', adminRequired, createArticle)
router.put('/article/:id', adminRequired, updateArticle)
router.delete('/article/:id', adminRequired, deleteArticle)

export default router
