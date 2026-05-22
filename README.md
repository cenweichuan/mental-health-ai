# 心理健康 AI 助手平台

> Vue 3 前端 + Node.js/Express 后端 + MySQL 数据库 + DeepSeek AI 对话

---

## 目录

- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [数据库设计](#数据库设计)
- [后端架构](#后端架构)
- [API 文档](#api-文档)
- [核心流程](#核心流程)
- [本地开发](#本地开发)
- [部署 (Railway)](#部署-railway)
- [如何学习这个项目](#如何学习这个项目)

---

## 项目结构

```
mental-health/
├── index.html                  # Vite 入口 HTML
├── vite.config.js              # Vite 配置（代理 /api 到后端）
├── package.json                # 前端依赖
│
├── src/                        # ── 前端源码 ──
│   ├── main.js                 # Vue 入口，挂载 App、Router、Pinia
│   ├── App.vue                 # 根组件
│   ├── config/index.js         # 配置（fileBaseUrl：后端地址）
│   ├── utils/request.js        # Axios 封装（拦截器：Token、统一错误处理）
│   ├── api/admin.js            # 所有后端 API 调用函数
│   ├── stores/admin.js         # Pinia 全局状态（侧边栏折叠）
│   │
│   ├── router/index.js         # 路由表（前端路由 + 后台路由 + 认证路由）
│   │
│   ├── views/                  # 页面组件
│   │   ├── home.vue            # 首页
│   │   ├── login.vue           # 登录页
│   │   ├── register.vue        # 注册页
│   │   ├── consultation.vue    # 【核心】AI 心理咨询对话页
│   │   ├── emotionDiary.vue    # 情绪日记记录页
│   │   ├── frontendKnowledge.vue # 知识文章列表（用户端）
│   │   ├── articleDetail.vue   # 文章详情页
│   │   ├── dashboard.vue       # 管理台 - 数据看板（ECharts）
│   │   ├── knowledge.vue       # 管理台 - 文章管理
│   │   ├── consultations.vue   # 管理台 - 咨询记录查看
│   │   └── emotional.vue       # 管理台 - 情绪日志管理
│   │
│   └── components/             # 复用组件
│       ├── FrontendLayout.vue  # 前台布局（Header）
│       ├── BackendLayout.vue   # 后台布局（Sidebar + Header）
│       ├── AuthLayout.vue      # 登录/注册布局
│       ├── Sidebar.vue         # 后台侧边栏
│       ├── Navbar.vue          # 导航栏
│       ├── PageHead.vue        # 页面标题
│       ├── TableSearch.vue     # 通用搜索表单
│       ├── ArticleDialog.vue   # 文章编辑弹窗（含图片上传）
│       ├── RichTextEditor.vue  # 富文本编辑器（wangeditor）
│       └── MarkdownRenderer.vue # Markdown 渲染器
│
└── server/                     # ── 后端源码 ──
    ├── .env                    # 环境变量（数据库、JWT、DeepSeek Key）
    ├── package.json            # 后端依赖 + 启动脚本
    │
    ├── prisma/
    │   ├── schema.prisma       # 数据库表定义（7 张表）
    │   └── seed.js             # 种子数据（管理员 + 分类）
    │
    ├── uploads/                # 上传文件存储目录
    │
    └── src/
        ├── index.js            # Express 入口：中间件、路由挂载、启动
        ├── config/index.js     # 配置（读取 .env，导出统一配置对象）
        ├── middleware/auth.js  # JWT 认证中间件（3 个：必需/可选/管理员）
        ├── routes/index.js     # 路由汇总，挂载到 /api
        └── controllers/        # 控制器（每个文件处理一组业务）
            ├── userController.js        # 登录、注册、退出
            ├── knowledgeController.js   # 文章 CRUD + 分类树
            ├── chatController.js        # 会话管理 + SSE 流式对话
            ├── diaryController.js       # 情绪日记
            ├── fileController.js        # 文件上传（Multer）
            └── analyticsController.js   # 数据看板统计
```

---

## 技术栈

| 层 | 技术 | 用途 |
|---|---|---|
| 前端框架 | Vue 3.5 (Composition API) | 响应式 UI |
| 构建 | Vite 8 | 开发服务器 + 打包 |
| UI 库 | Element Plus 2.13 | 表格、表单、弹窗、上传 |
| 路由 | Vue Router 4.6 | 前端路由 + 导航守卫 |
| 状态 | Pinia 3.0 | 全局状态 |
| HTTP | Axios 1.16 | API 请求 + 拦截器 |
| 图表 | ECharts 6.0 | 数据看板图表 |
| SSE | @microsoft/fetch-event-source | AI 流式对话接收 |
| 后端框架 | Express 4.21 | HTTP 服务 + 路由 |
| ORM | Prisma 6 | 数据库操作 |
| 数据库 | MySQL 8.0 | 数据持久化 |
| 认证 | jsonwebtoken 9.0 | JWT 签发与验证 |
| 密码 | bcryptjs 2.4 | 密码哈希 |
| 文件 | Multer 1.4 | 文件上传中间件 |
| AI | OpenAI SDK 4.70 → DeepSeek API | 心理咨询对话 |
| 部署 | Railway | 云平台托管 |

---

## 数据库设计

**7 张表，Prisma Schema 路径：** `server/prisma/schema.prisma`

```
users                    文章分类 categories
  ├─ id                    ├─ id
  ├─ username (唯一)       ├─ name
  ├─ password (哈希)       ├─ parentId（树形父节点）
  ├─ nickname             ├─ sort
  ├─ userType (1用户 2管理员) └─ articles[]
  ├─ sessions[]                ↓
  └─ diaries[]            articles 知识文章
       ↓                   ├─ id
emotion_diaries 情绪日记    ├─ title
  ├─ userId → users       ├─ content（LongText）
  ├─ moodScore (1-10)     ├─ summary
  ├─ dominantEmotion      ├─ cover（封面图路径）
  ├─ emotionTriggers      ├─ categoryId → categories
  ├─ diaryContent        ├─ status（0草稿 1发布 2下线）
  ├─ sleepQuality (1-5)   ├─ tags
  ├─ stressLevel (1-5)    ├─ viewCount
  ├─ diaryDate            └─ category
  └─ aiEmotionAnalysis (JSON)

chat_sessions 咨询会话     files 上传文件
  ├─ userId → users       ├─ filename
  ├─ sessionTitle         ├─ url
  ├─ status (ACTIVE)      ├─ businessType
  ├─ lastMessageContent   ├─ businessId
  ├─ messageCount         └─ size
  └─ messages[]
       ↓
chat_messages 会话消息
  ├─ sessionId → sessions（级联删除）
  ├─ senderType（USER / AI）
  ├─ content
  └─ createdAt
```

### 表关系速览

| 关系 | 类型 |
|---|---|
| User → ChatSession | 一对多（一个用户多个会话） |
| User → EmotionDiary | 一对多（一个用户多条日记） |
| ChatSession → ChatMessage | 一对多（一个会话多条消息），**级联删除** |
| Category → Article | 一对多（一个分类多篇文章） |

---

## 后端架构

### 请求处理流程

```
浏览器 → Vite Dev Server (5173)
           │
           │  /api/* 走代理
           ↓
       Express (3001/8080)
           │
           ├── cors()              ← 跨域
           ├── express.json()      ← 解析 JSON body
           ├── /uploads 静态文件   ← 上传图片访问
           ├── success 中间件       ← 自动补充 success:true
           │
           ├── /api/user           ← userRoutes
           ├── /api/knowledge      ← knowledgeRoutes
           ├── /api/file           ← fileRoutes
           ├── /api/psychological-chat ← chatRoutes
           ├── /api/emotion-diary  ← diaryRoutes
           └── /api/data-analytics ← analyticsRoutes
                  │
                  └── 每个路由 → auth 中间件（验证 JWT）→ controller → Prisma → MySQL
```

### 统一响应格式

```json
{
  "code": 200,       // 200=成功, -1=登录过期, 403=无权限, 400=参数错误
  "success": true,   // 所有成功响应自动添加
  "msg": "success",
  "data": { ... }    // 业务数据
}
```

### 三种认证中间件

| 中间件 | 未登录 | 用途 |
|---|---|---|
| `authRequired` | 返回 code=-1，前端跳转登录页 | 用户接口 |
| `authOptional` | 不拦截，req.user 为 undefined | 可选登录 |
| `adminRequired` | 返回 code=403 或 -1 | 管理员接口 |

---

## API 文档

### 用户模块 `/api/user`

| 方法 | 路径 | 认证 | 请求体 | 返回 |
|---|---|---|---|---|
| POST | `/login` | 无 | `{username, password}` | `{token, userInfo}` |
| POST | `/add` | 无 | `{username, password, nickname}` | 注册结果 |
| POST | `/logout` | 无 | - | 退出成功 |

**登录返回的 userInfo 结构：**
```json
{
  "id": 1, "userId": 1, "username": "admin",
  "nickname": "管理员", "userType": 2
}
```
- `userType: 1` → 普通用户，登录后跳到首页
- `userType: 2` → 管理员，登录后跳到 `/back/dashboard`

### 知识文章 `/api/knowledge`

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/category/tree` | 无 | 分类树（节点含 children） |
| GET | `/article/page?currentPage&pageSize&title&categoryId&status` | 无 | 文章分页 |
| GET | `/article/:id` | 无 | 文章详情 |
| POST | `/article` | **管理员** | 创建文章 `{title, content, summary, coverImage, categoryId, status, tags}` |
| PUT | `/article/:id` | **管理员** | 更新文章（发布/下线/编辑都用此接口） |
| DELETE | `/article/:id` | **管理员** | 删除文章 |

**文章状态：** `0` = 草稿，`1` = 已发布，`2` = 已下线

### 文件上传 `/api/file`

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/upload` | **登录** | multipart/form-data: `file` + `businessType` + `businessId` |

返回 `{url: "/uploads/xxx.jpg"}`，前端配合 `fileBaseUrl` 拼接完整 URL。

### 心理咨询 `/api/psychological-chat` 🔥核心

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/sessions?pageNum&pageSize` | **登录** | 会话列表（用户看自己，管理员看全部） |
| GET | `/sessions/:id/messages` | **登录** | 会话消息列表 |
| GET | `/session/:id/emotion` | **登录** | 会话情绪分析 |
| POST | `/session/start` | **登录** | 创建新会话 `{initialMessage, sessionTitle}` |
| **POST** | **`/stream`** | **登录** | **SSE 流式对话** `{sessionId, userMessage}` |
| DELETE | `/sessions/:id` | **登录** | 删除会话（级联删除消息） |

### 情绪日记 `/api/emotion-diary`

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/` | **登录** | 创建日记 `{moodScore, dominantEmotion, emotionTriggers, diaryContent, sleepQuality, stressLevel, diaryDate}` |
| GET | `/admin/page` | **登录** | 分页查询（非管理员自动限制只看自己） |
| DELETE | `/admin/:id` | **管理员** | 删除 |

### 数据看板 `/api/data-analytics`

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/overview` | **管理员** | 返回 `{systemOverview, emotionTrend, userActivity}` |

---

## 核心流程

### 1. 用户注册/登录

```
注册页 → POST /api/user/add → bcrypt 哈希密码 → 存入 users 表
登录页 → POST /api/user/login → bcrypt 验证 → JWT 签发（7天过期）
       → 前端存 localStorage: token + userInfo
       → 路由守卫根据 userType 跳转首页或管理台
```

### 2. AI 心理咨询流式对话（整个系统最核心的流程）

```
用户输入消息（consultation.vue）
  │
  ├─ 首次对话（TEMP 状态）：
  │   1. POST /session/start  → 创建会话，返回 sessionId
  │   2. POST /stream          → 流式获取 AI 回复
  │
  └─ 后续对话：
      直接 POST /stream

POST /stream 后端处理（chatController.chatStream）：
  │
  ├─ 1. 设置 SSE 响应头（Content-Type: text/event-stream）
  ├─ 2. 保存用户消息到 chat_messages 表
  ├─ 3. 读取最近 40 条历史消息作为上下文
  ├─ 4. 构建 messages 数组：[system prompt, ...历史消息]
  ├─ 5. 调用 DeepSeek API（stream: true）
  │      openai.chat.completions.create({
  │        model: 'deepseek-chat',
  │        messages,
  │        stream: true
  │      })
  ├─ 6. 逐 chunk 推送前端：data: {"code":200,"data":{"content":"..."}}
  │      前端 fetchEventSource 逐字接收 → MarkdownRenderer 渲染
  ├─ 7. 流结束后保存 AI 完整回复到 chat_messages
  ├─ 8. 更新会话的 lastMessageContent 和 messageCount
  └─ 9. 发送 done 事件：event: done / data: [DONE]
```

### 3. 文件上传

```
ArticleDialog → el-upload → handleUploadRequest
  → POST /api/file/upload (multipart/form-data)
  → Multer 存到 server/uploads/
  → 返回 {url: "/uploads/uuid.jpg"}
  → 前端拼接 fileBaseUrl + url → 显示预览
  → 存入文章 cover 字段
```

### 4. 管理台数据看板

```
dashboard.vue → mounted → GET /api/data-analytics/overview
  → 后端执行 20+ 条 SQL 统计：
     总用户数、今日新增、活跃用户、情绪趋势（30天）、用户活跃趋势（30天）
  → 前端 ECharts 渲染 3 张图：
     - 情绪趋势折线图（avgMoodScore + recordCount）
     - 咨询会话柱状图
     - 用户活跃度趋势图（4 条折线）
```

---

## 本地开发

### 前提

- Node.js 22+
- MySQL 8.0 已安装并运行
- DeepSeek API Key（[platform.deepseek.com](https://platform.deepseek.com) 获取）

### 第一步：配置数据库

```bash
# 登录 MySQL，创建数据库
mysql -u root -p
CREATE DATABASE IF NOT EXISTS mental_health DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

### 第二步：配置后端

```bash
cd server

# 编辑 .env，修改三处：
#   DATABASE_URL="mysql://root:你的密码@localhost:3306/mental_health"
#   DEEPSEEK_API_KEY="你的DeepSeek-API-Key"

# 安装依赖
npm install

# 生成 Prisma 客户端 + 建表
npx prisma generate
npx prisma db push

# 初始化种子数据（管理员 + 分类）
node prisma/seed.js

# 启动后端（端口 3001）
npm run dev
```

### 第三步：启动前端

```bash
# 回到项目根目录
cd ..

# 安装依赖
npm install

# 启动前端（端口 5173）
npm run dev
```

### 第四步：打开浏览器

访问 `http://localhost:5173`

- **管理员登录：** `admin` / `admin123`
- **注册普通用户：** 点"去注册"，登录后体验咨询和日记功能

### 开发调试技巧

| 场景 | 方法 |
|---|---|
| 查看后端日志 | 终端 `npm run dev` 的输出 |
| 测试 API | `curl http://localhost:3001/api/knowledge/category/tree` |
| 查看数据库 | MySQL Workbench 或 `mysql -u root -p mental_health` |
| 重置数据库 | `npx prisma db push --force-reset && node prisma/seed.js` |

---

## 部署 (Railway)

当前已部署在 Railway：`https://robust-charisma-production-5871.up.railway.app`

### 部署架构

```
GitHub (cenweichuan/mental-health-ai)
  │  push 触发
  ↓
Railway
  ├── robust-charisma (Node.js Express)  ← 你的后端服务
  │     ├── PORT: 8080 (Railway 自动设置)
  │     ├── DATABASE_URL: 由 MySQL 服务自动注入
  │     ├── JWT_SECRET: 手动设置
  │     └── DEEPSEEK_API_KEY: 手动设置
  │
  └── MySQL (mysql:9.4)                  ← 数据库服务
        ├── MYSQL_URL: mysql://root:xxx@mysql.railway.internal:3306/railway
        └── 持久化卷: 500MB
```

### 如何更新部署

```bash
# 1. 修改代码后 commit + push
git add .
git commit -m "描述修改内容"
git push origin main

# 2. Railway 自动检测 push → 自动构建 + 部署（约 2-3 分钟）
```

### Railway CLI 常用命令

```bash
# 登录
export RAILWAY_API_TOKEN=你的token
npx @railway/cli link --project 项目ID

# 查看状态
npx @railway/cli status --json

# 查看日志
npx @railway/cli logs --service robust-charisma --lines 50

# 设置变量
npx @railway/cli variable set KEY=VALUE --service robust-charisma

# 进入 Railway 环境执行命令
echo "npx prisma db push" | npx @railway/cli shell --service robust-charisma
```

---

## 如何学习这个项目

### 建议的学习路径

**第一层：看懂前端页面怎么跳的**

1. 打开 `src/router/index.js` — 理解路由表结构
   - `/` → 前台布局 → 首页、咨询、日记、知识文章
   - `/back` → 后台布局 → 看板、文章管理、咨询记录、情绪日志
   - `/auth` → 登录/注册
2. 看 `router.beforeEach` 导航守卫 — 理解登录拦截逻辑
3. 看 `src/api/admin.js` — 每个 API 函数对应一个后端接口

**第二层：看懂数据怎么流转的**

4. 看 `src/utils/request.js` — Axios 拦截器做的事：
   - 请求拦截：自动带上 Token
   - 响应拦截：code=200 放行，code=-1 跳登录
5. 挑一个页面跟踪完整流程，推荐 `knowledge.vue`（文章管理）：
   - mounted → `categoryTree()` 获取分类 → 填下拉框
   - `handleSearch` → `articlePage(params)` → 渲染表格
   - `handlePublish` → `publishArticle(id, {status:1})` → 刷新

**第三层：看懂后端怎么处理的**

6. 看 `server/src/index.js` — Express 中间件链条
7. 看 `server/prisma/schema.prisma` — 7 张表的关系
8. 选一个模块跟踪，推荐 `chatController.js`：
   - `startSession` 创建会话
   - `chatStream` SSE 流式对话 → 调用 DeepSeek → 逐字推送
   - `getSessions` 管理员/用户数据隔离

**第四层：理解核心机制**

9. **JWT 认证**：`middleware/auth.js` → jwt.sign/jwt.verify
10. **SSE 流式传输**：`chatController.chatStream` → 设置 SSE 头 → stream 循环
11. **数据隔离**：管理员看全部 / 用户只看自己的数据（`getSessions`、`getAdminDiaryPage`）
12. **字段映射**：`knowledgeController.flattenArticle` → DB 字段与前端字段名不一致时的转换

### 各文件的阅读优先级

| 优先级 | 前端文件 | 后端文件 |
|---|---|---|
| ⭐⭐⭐ | `router/index.js`, `api/admin.js`, `utils/request.js` | `index.js`, `schema.prisma`, `chatController.js` |
| ⭐⭐ | `consultation.vue`, `knowledge.vue`, `dashboard.vue` | `userController.js`, `knowledgeController.js` |
| ⭐ | `emotionDiary.vue`, `ArticleDialog.vue`, `stores/admin.js` | `diaryController.js`, `analyticsController.js`, `auth.js` |

---

## 环境变量参考

```bash
# server/.env
DATABASE_URL="mysql://root:123456@localhost:3306/mental_health"  # 数据库连接
JWT_SECRET="mental-health-jwt-secret-key-2024"                    # JWT 签名密钥
DEEPSEEK_API_KEY="sk-xxxxxxxx"                                    # DeepSeek API Key
DEEPSEEK_BASE_URL="https://api.deepseek.com"                      # DeepSeek 接口地址
PORT=3001                                                         # 服务端口
UPLOAD_DIR="uploads"                                              # 文件上传目录
```

---

## 常见问题

**Q: 前端页面打不开 / 白屏？**
A: 确保同时启动了前端和后端。前端 `npm run dev`（端口 5173），后端 `cd server && npm run dev`（端口 3001）。

**Q: AI 咨询不回复？**
A: 检查 `server/.env` 中的 `DEEPSEEK_API_KEY` 是否正确。去 [platform.deepseek.com](https://platform.deepseek.com) 确认 key 有效且余额充足。

**Q: 图片上传失败？**
A: 检查 `server/uploads/` 目录是否存在。检查 `vite.config.js` 的 proxy target 和 `src/config/index.js` 的 fileBaseUrl 是否指向正确的后端地址。

**Q: 登录后立即跳回登录页？**
A: 后端 JWT 验证失败。检查前后端的 JWT_SECRET 是否一致，Token header 是否正确（前端用 `token` 小写）。

**Q: 数据库连接失败？**
A: 确认 MySQL 服务正在运行，`.env` 中的用户名和密码正确，数据库 `mental_health` 已创建。
