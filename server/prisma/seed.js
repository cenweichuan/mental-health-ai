import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  // 创建默认管理员
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (!existingAdmin) {
    const adminPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        nickname: '管理员',
        userType: 2,
      },
    })
    console.log('管理员账号已创建: admin / admin123')
  } else {
    console.log('管理员账号已存在，跳过创建')
  }

  // 创建默认分类
  const categoryNames = ['情绪管理', '压力应对', '人际关系', '自我成长', '睡眠健康']
  const existingCategories = await prisma.category.count()
  if (existingCategories === 0) {
    for (let i = 0; i < categoryNames.length; i++) {
      await prisma.category.create({
        data: { name: categoryNames[i], sort: i + 1 },
      })
    }
    console.log('默认知识分类已创建')
  } else {
    console.log('知识分类已存在，跳过创建')
  }

  console.log('种子数据初始化完成')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
