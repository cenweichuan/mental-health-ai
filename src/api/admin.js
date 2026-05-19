import service from '@/utils/request'

export function login(data) {
    return service.post('/user/login', data)
}

export function categoryTree() {
    return service.get('/knowledge/category/tree')
}

export function articlePage(params) {
    return service.get('/knowledge/article/page', { params })
}

// 获取知识文章详情
export function getArticle(id) {
    return service.get(`/knowledge/article/${id}`)
}

// 创建知识文章
export function createArticle(data) {
    return service.post('/knowledge/article', data)
}

// 更新知识文章
export function updateArticle(id, data) {
    return service.put(`/knowledge/article/${id}`, data)
}

// 删除知识文章
export function deleteArticle(id) {
    return service.delete(`/knowledge/article/${id}`)
}

// 发布文章
export function publishArticle(id, data) {
    return service.put(`/knowledge/article/${id}`, data)
}

// 下线文章
export function offlineArticle(id, data) {
    return service.put(`/knowledge/article/${id}`, data)
}

export function uploadFile(file, businessInfo) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('businessType', 'ARTICLE')
    formData.append('businessId', businessInfo.businessId)
    return service.post('/file/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

// 后台管理 - 咨询记录分页
export function getConsultationPage(params) {
    return service.get('/psychological-chat/sessions', { params })
}

// 后台管理 - 获取会话详情（消息列表）
export function getSessionDetail(SessionId) {
    return service.get(`/psychological-chat/sessions/${SessionId}/messages`)
}

// 前端用户 - 获取会话消息列表
export function getSessionMessages(sessionId) {
    return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

// 前端用户 - 获取会话情绪分析数据
export function getSessionEmotion(sessionId) {
    return service.get(`/psychological-chat/session/${sessionId}/emotion`)
}

// 后台管理 - 情绪日志分页
export function getEmotionalPage(params) {
    return service.get('/emotion-diary/admin/page', { params })
}

// 后台管理 - 删除情绪日志
export function deleteEmotional(id) {
    return service.delete(`/emotion-diary/admin/${id}`)
}

// 后台管理 - 数据分析概览
export function getAnalyticsOverview() {
    return service.get(`/data-analytics/overview`)
}

// 退出登录
export function logout() {
    return service.post(`/user/logout`)
}

// 注册用户
export function register(data) {
    return service.post(`/user/add`, data)
}

// 前端用户 - 创建新会话
export function newMessage(data) {
    return service.post('/psychological-chat/session/start', data)
}

// 前端用户 - 获取会话列表
export function getSessionList(params) {
    return service.get('/psychological-chat/sessions', { params })
}

// 前端用户 - 删除会话
export function deleteSession(id) {
    return service.delete(`/psychological-chat/sessions/${id}`)
}

// 前端用户 - 创建或更新情绪日记
export function emotionDiarySave(data) {
    return service.post('/emotion-diary', data)
}