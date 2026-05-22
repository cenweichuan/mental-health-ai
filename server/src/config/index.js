import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../../.env') })

export default {
  port: process.env.PORT || 1235,
  jwtSecret: process.env.JWT_SECRET || 'mental-health-jwt-secret',
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  },
  uploadDir: join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
  __dirname,
}
