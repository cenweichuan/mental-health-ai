import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function fmtDate(d) {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  const h = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  const s = String(dt.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

function flattenArticle(a) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    summary: a.summary,
    coverImage: a.cover,
    cover: a.cover,
    categoryId: a.categoryId,
    categoryName: a.category?.name || '',
    status: a.status,
    viewCount: a.viewCount,
    readCount: a.viewCount,
    authorName: '管理员',
    publishedAt: a.status === 1 ? fmtDate(a.updatedAt) : null,
    createdAt: fmtDate(a.createdAt),
    updatedAt: fmtDate(a.updatedAt),
    tags: a.tags || '',
  }
}

// 获取分类树
export async function categoryTree(req, res) {
  try {
    const list = await prisma.category.findMany({ orderBy: { sort: 'asc' } })

    const map = {}
    const roots = []
    for (const item of list) {
      map[item.id] = { id: item.id, categoryName: item.name, parentId: item.parentId, sort: item.sort, children: [] }
    }
    for (const item of list) {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children.push(map[item.id])
      } else {
        roots.push(map[item.id])
      }
    }

    return res.json({ code: 200, msg: 'success', data: roots })
  } catch (err) {
    console.error('获取分类树失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 文章分页列表
export async function articlePage(req, res) {
  try {
    const { currentPage = 1, pageSize = 10, title, categoryId, status } = req.query
    const page = parseInt(currentPage)
    const size = parseInt(pageSize)

    const where = {}
    if (title) where.title = { contains: title }
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (status !== undefined && status !== '') where.status = parseInt(status)

    const [records, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.article.count({ where }),
    ])

    return res.json({
      code: 200,
      msg: 'success',
      data: { records: records.map(flattenArticle), total },
    })
  } catch (err) {
    console.error('获取文章列表失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 获取文章详情
export async function getArticle(req, res) {
  try {
    const id = parseInt(req.params.id)
    const article = await prisma.article.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    })
    if (!article) {
      return res.json({ code: 404, msg: '文章不存在', data: null })
    }
    return res.json({ code: 200, msg: 'success', data: flattenArticle(article) })
  } catch (err) {
    console.error('获取文章详情失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 创建文章
export async function createArticle(req, res) {
  try {
    const { title, content, summary, coverImage, cover, categoryId, status, tags } = req.body
    const coverUrl = coverImage || cover || ''
    const article = await prisma.article.create({
      data: {
        title: title || '',
        content: content || '',
        summary: summary || '',
        cover: coverUrl,
        categoryId: categoryId ? parseInt(categoryId) : 0,
        status: status !== undefined ? parseInt(status) : 0,
        tags: tags || '',
      },
    })
    return res.json({ code: 200, msg: '创建成功', data: flattenArticle(article) })
  } catch (err) {
    console.error('创建文章失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 更新文章
export async function updateArticle(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { title, content, summary, coverImage, cover, categoryId, status, tags } = req.body
    const data = {}
    if (title !== undefined) data.title = title
    if (content !== undefined) data.content = content
    if (summary !== undefined) data.summary = summary
    if (coverImage !== undefined || cover !== undefined) data.cover = coverImage || cover || ''
    if (categoryId !== undefined) data.categoryId = parseInt(categoryId)
    if (status !== undefined) data.status = parseInt(status)
    if (tags !== undefined) data.tags = tags

    const article = await prisma.article.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    })
    return res.json({ code: 200, msg: '更新成功', data: flattenArticle(article) })
  } catch (err) {
    console.error('更新文章失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}

// 删除文章
export async function deleteArticle(req, res) {
  try {
    const id = parseInt(req.params.id)
    await prisma.article.delete({ where: { id } })
    return res.json({ code: 200, msg: '删除成功', data: null })
  } catch (err) {
    console.error('删除文章失败:', err)
    return res.json({ code: 500, msg: '服务器错误', data: null })
  }
}
