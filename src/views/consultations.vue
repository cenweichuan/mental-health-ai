<template>
    <div>
        <PageHead title="咨询记录" />
        <el-table :data="tableData" style="width: 100%">
            <el-table-column label="会话ID" width="100" prop="id" />
            
            <el-table-column label="用户" width="120">
                <template #default="scope">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <el-avatar :size="32">{{ scope.row.userNickname?.charAt(0) }}</el-avatar>
                        <span>{{ scope.row.userNickname }}</span>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="情绪日志">
                <template #default="scope">
                    <div class="session-title">{{ scope.row.sessionTitle }}</div>
                    <div class="session-preview">{{ scope.row.lastMessageContent }}</div>
                </template>
            </el-table-column>
            <el-table-column label="消息数" prop="messageCount" width="100" />
            <el-table-column label="时间" prop="lastMessageTime" width="180" />
            <el-table-column label="操作" width="100" >
                <template #default="scope">
                    <el-button type="primary" text @click="viewSessionDetail(scope.row)">详情</el-button>
                </template>
            </el-table-column>
        </el-table>
        
        <!-- 自定义分页组件 -->
        <div class="pagination-container">
            <span class="pagination-info">共 {{ pagination.total }} 条</span>
            <span class="pagination-info">共 {{ totalPages }} 页</span>
            <span class="pagination-jumper">
                前往
                <el-input 
                    v-model="jumpPage" 
                    size="small" 
                    class="jump-input"
                    @keyup.enter="handleJump"
                />
                页
            </span>
        </div>
        
        <el-dialog v-model="showDetailDialog"
         title="会话详情"
         :close-on-click-modal="false"
         width="70%">
            <div class="session-detail">
                <div class="detail-header">
                    <div class="detail-row">
                        <div class="detail-label">用户:</div>
                        <div class="detail-value">{{ sessionDetail.userNickname }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">开始时间: </div>
                        <div class="detail-value">{{ sessionDetail.startAt }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">消息数: </div>
                        <div class="detail-value">{{ sessionDetail.messageCount }}</div>
                    </div>
                </div>
                
                <!-- 消息列表 -->
                <div class="messages-container">
                    <div class="messages-header">
                        <h4>对话记录</h4>
                    </div>
                    <div class="messages-list" v-if="sessionMessages.length > 0">
                        <div 
                            v-for="message in sessionMessages" 
                            :key="message.id"
                            class="message-item"
                            :class="message.senderType === 1 ? 'user-message' : 'ai-message'"
                        >
                            <div class="message-header">
                                <div class="sender">
                                    <span>{{ message.senderType === 1 ? '用户' : 'AI助手' }}</span>
                                </div>
                                <span class="time">{{ message.createAt }}</span>
                            </div>
                            <div class="message-content">{{ message.content }}</div>
                        </div>
                    </div>
                    <div v-else class="messages-list">
                        <p style="text-align: center; color: #999;">暂无消息记录</p>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { getConsultationPage, getSessionDetail } from '@/api/admin'
import PageHead from '@/components/PageHead.vue'

const tableData = ref([])
const showDetailDialog = ref(false)
const sessionDetail = ref({})
const sessionMessages = ref([])
const jumpPage = ref('')

const pagination = reactive({
    total: 0,
    currentPage: 1
})

// 计算总页数
const totalPages = computed(() => {
    return Math.ceil(pagination.total / 10) || 0
})

// 跳转到指定页
const handleJump = () => {
    const page = Number(jumpPage.value)
    if (!page || page < 1) {
        jumpPage.value = ''
        return
    }
    if (page > totalPages.value) {
        jumpPage.value = totalPages.value.toString()
        pagination.currentPage = totalPages.value
    } else {
        pagination.currentPage = page
        // 不清空 jumpPage，保持显示的值
    }
    handleSearch()
}

const viewSessionDetail = async (row) => {
    try {
        const res = await getSessionDetail(row.id)
        console.log('会话详情完整数据:', res.data)
        
        // res.data 直接就是消息数组
        if (res.data && Array.isArray(res.data)) {
            sessionMessages.value = res.data
            console.log('消息数量:', sessionMessages.value.length)
        } else {
            sessionMessages.value = []
        }
        
        sessionDetail.value = row
        showDetailDialog.value = true
    } catch (err) {
        console.error('获取会话详情失败:', err)
    }
}

const handleSearch = async () => {
    try {
        const res = await getConsultationPage({
            currentPage: pagination.currentPage,
            pageSize: 10
        })
        console.log('完整响应:', res.data)
        
        const data = res.data
        if (data.data && data.data.records) {
            tableData.value = data.data.records
            pagination.total = data.data.total
        } else if (data.records) {
            tableData.value = data.records
            pagination.total = data.total
        } else if (Array.isArray(data)) {
            tableData.value = data
            pagination.total = data.length
        } else if (data.data && Array.isArray(data.data)) {
            tableData.value = data.data
            pagination.total = data.total || data.data.length
        } else {
            console.error('未知的数据格式:', data)
            tableData.value = []
            pagination.total = 0
        }
        
        // 更新跳转输入框为当前页码
        jumpPage.value = pagination.currentPage.toString()
    } catch (err) {
        console.error('请求失败:', err)
    }
}

onMounted(() => {
    handleSearch()
})
</script>

<style lang="scss" scoped>
.session-title {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.session-preview {
    font-size: 13px;
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

// 自定义分页样式
.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    
    .pagination-info {
        font-size: 14px;
        color: #606266;
    }
    
    .pagination-jumper {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #606266;
        
        .jump-input {
            width: 60px;
            
            :deep(.el-input__inner) {
                text-align: center;
            }
        }
    }
}

.session-detail {
    max-height: 70vh;
    overflow-y: auto;
    
    .detail-header {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .detail-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        
        &:last-child {
            margin-bottom: 0;
        }
        
        .detail-label {
            font-weight: 500;
            color: #495057;
            min-width: 80px;
            margin-right: 8px;
        }

        .detail-value {
            color: #333;
        }
    }
}

.messages-container {
    margin-top: 20px;
    
    .messages-header {
        margin-bottom: 16px;
        
        h4 {
            margin: 0;
            color: #333;
            font-size: 16px;
            font-weight: 500;
        }
    }
    
    .messages-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 16px;
        background: #fff;
        
        .message-item {
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            
            &:last-child {
                margin-bottom: 0;
            }
            
            &.user-message {
                background: #e8f4fd;
            }

            &.ai-message {
                background: #f0f9f0;
            }
            
            .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                
                .sender {
                    font-weight: 500;
                    color: #333;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .time {
                    font-size: 12px;
                    color: #999;
                }
            }
            
            .message-content {
                color: #333;
                line-height: 1.6;
                white-space: pre-wrap;
                font-size: 14px;
            }
        }
    }
}
</style>