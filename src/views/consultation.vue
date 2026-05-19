<template>
    <div class="consultation-container">
        <div class="sidebar">
            <!-- AI 助手信息 -->
            <div class="ai-assistant-info">
                <div class="breathing-circle">
                    <el-image :src="iconUrl" style="width: 40px; height: 40px;" alt="AI咨询助手"></el-image>
                </div>
                <div class="assistant-name">AI咨询助手</div>
                <div class="online-status">
                    <span class="status-dot"></span>
                    在线
                </div>
            </div>

            <!-- 会话列表 -->
            <div class="session-history">
                <div class="section-title">
                    <span>会话列表</span>
                </div>
                <div class="session-list">
                    <div class="session-item" v-for="session in sessionList" :key="session.id"
                        @click="handelSessionClick(session)" :class="{ active: currentSession?.sessionId === session.id }">
                        <div class="session-info">
                            <div class="session-title">
                                <span>{{ session.sessionTitle }}</span>
                            </div>
                            <div class="session-meta">
                                <span class="session-time">{{ session.startedAt }}</span>
                            </div>
                            <div class="session-preview">{{ session.lastMessageContent }}</div>
                            <div class="session-stats">
                                <span>
                                    <el-icon><ChatRound /></el-icon>
                                    {{ session.messageCount || 0 }}
                                </span>
                                <span>
                                    <el-icon><Clock /></el-icon>
                                    {{ ((session.durationMinutes / 60).toFixed(1)) || 0 }}h
                                </span>
                            </div>
                        </div>
                        <div class="session-actions">
                            <el-button type="danger" :icon="Delete" circle size="small"
                                @click.stop="handeldeleteSession(session.id)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="chat-main" :class="messages.length > 0 ? 'has-messages' : 'no-messages'">
            <div class="chat-header">
                <div class="header-left">
                    <div class="chat-avatar">
                        <el-image :src="iconUrl1" style="width: 30px; height: 30px;"></el-image>
                    </div>
                    <div class="chat-info">
                        <h2>情绪分析结果</h2>
                        <p>根据您的输入，分析出当前的情绪状态</p>
                    </div>
                </div>
                <el-button circle @click="CreatNewSession" title="新建会话" class="new-session-btn">
                    <el-icon><Plus /></el-icon>
                </el-button>
            </div>

            <div class="chat-messages" ref="chatMessagesRef">
                <div class="message-item ai-message" v-if="messages.length === 0">
                    <div class="message-avatar">
                        <el-image :src="iconUrl" style="width: 32px; height: 32px;"></el-image>
                    </div>
                    <div class="message-content">
                        <div class="message-bubble">
                            <p>您好！我是您的情绪分析助手。请告诉我您目前的感受，我将为您进行分析。</p>
                        </div>
                        <div class="message-time">刚刚</div>
                    </div>
                </div>

                <div v-for="(msg, index) in messages" :key="msg.id || index"
                    :class="['message-item', msg.senderType === 1 ? 'user-message' : 'ai-message']">
                    
                    <template v-if="msg.senderType === 2">
                        <div class="message-avatar">
                            <el-image :src="iconUrl" style="width: 32px; height: 32px;"></el-image>
                        </div>
                        <div class="message-content">
                            <div class="message-bubble">
                                <div v-if="msg.isTyping && !msg.content" class="typing-indicator">
                                    <div class="typing-dot"></div>
                                    <div class="typing-dot"></div>
                                    <div class="typing-dot"></div>
                                </div>
                                <div v-else-if="msg.isError" class="error-message">
                                    <p>{{ msg.content }}</p>
                                </div>
                                <MarkdownRenderer v-else :content="msg.content" :is-ai-message="true" />
                            </div>
                            <div class="message-time">
                                {{ msg.isTyping ? '正在输入中...' : (msg.createdAt || '') }}
                            </div>
                        </div>
                    </template>

                    <template v-else>
                        <div class="message-content">
                            <div class="message-bubble">
                                <p v-if="msg.content" v-html="formatMessageContent(msg.content)"></p>
                            </div>
                            <div class="message-time">{{ msg.createdAt || '' }}</div>
                        </div>
                        <div class="message-avatar">
                            <el-avatar :size="32" icon="UserFilled" />
                        </div>
                    </template>
                </div>
            </div>

            <div class="chat-input">
                <el-input 
                    class="message-input" 
                    placeholder="请输入您想分享的..." 
                    @keyup.enter="sendMessage"
                    v-model="userMessage" 
                    type="textarea" 
                    :autosize="{ minRows: 3, maxRows: 10 }"
                    :disabled="isAiTying" 
                    maxlength="500" 
                    show-word-limit>
                </el-input>
                <el-button class="send-btn" type="primary" @click="sendMessage" :disabled="isAiTying">
                    <el-icon><Promotion /></el-icon>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { newMessage, getSessionList, deleteSession, getSessionMessages } from '../api/admin';
import { ChatRound, Clock, Plus, Promotion, Delete } from '@element-plus/icons-vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

const userMessage = ref('');
const isAiTying = ref(false);
const currentSession = ref(null);
const messages = ref([]);
const sessionList = ref([]);
const chatMessagesRef = ref(null);

const iconUrl = new URL('@/assets/images/robot-fill.png', import.meta.url).href;
const iconUrl1 = new URL('@/assets/images/like.png', import.meta.url).href;

const formatMessageContent = (content) => {
    if (!content) return '';
    return content.replace(/\n/g, '<br>');
};

const scrollToBottom = () => {
    nextTick(() => {
        if (chatMessagesRef.value) {
            chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
        }
    });
};

const handeldeleteSession = (sessionId) => {
    ElMessageBox.confirm('确定要删除这个会话吗？', '删除会话', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(() => {
        deleteSession(sessionId).then(() => {
            ElMessage.success('会话已删除');
            getSessionPage();
            if (currentSession.value?.sessionId === sessionId) {
                CreatNewSession();
            }
        }).catch(err => {
            ElMessage.error('删除失败');
            console.error(err);
        });
    }).catch(() => {
        ElMessage.info('已取消删除');
    });
};

const handelSessionClick = (session) => {
    currentSession.value = {
        sessionId: session.id || session.sessionId,
        status: 'ACTIVE',
        sessionTitile: session.sessionTitle || session.sessionTitile
    };

    getSessionMessages(session.id).then(res => {
        const data = res.data || res;
        const list = data.records || data.data || data;
        messages.value = (Array.isArray(list) ? list : []).map(msg => ({
            id: msg.id,
            senderType: (msg.senderType === 'USER' || msg.senderType === 1) ? 1 : 2,
            content: msg.content || msg.message || '',
            createdAt: msg.createdAt || msg.createTime || ''
        }));
        scrollToBottom();
    }).catch(err => {
        console.error('获取会话消息失败:', err);
        messages.value = [];
    });
};

const CreatNewSession = () => {
    currentSession.value = {
        sessionId: Date.now(),
        status: 'TEMP',
        sessionTitile: '新会话'
    };
    messages.value = [];
};

const startNewSession = (text) => {
    const sessionParams = {
        initialMessage: text,
        sessionTitle: '心理咨询AI助手-' + new Date().toLocaleString()
    };

    newMessage(sessionParams).then(res => {
        const data = res.data || res;
        const sessionData = {
            sessionId: data.sessionId || data.id,
            status: data.status || 'ACTIVE',
            sessionTitile: data.sessionTitle || sessionParams.sessionTitle
        };
        Object.assign(currentSession.value, sessionData);
        getSessionPage();
        startAiResponse(currentSession.value.sessionId, text);
    }).catch(err => {
        ElMessage.error('发送失败，请重试');
        console.error(err);
        isAiTying.value = false;
    });
};

const startAiResponse = (sessionId, userMessageText) => {
    isAiTying.value = true;

    const aiMsgId = 'ai_' + Date.now();
    messages.value.push({
        id: aiMsgId,
        senderType: 2,
        content: '',
        createdAt: new Date().toLocaleTimeString(),
        isError: false,
        isTyping: true
    });
    scrollToBottom();

    const aiMessage = messages.value.find(m => m.id === aiMsgId);
    const token = localStorage.getItem('token');

    fetchEventSource('/api/psychological-chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Token': token || ''
        },
        body: JSON.stringify({
            sessionId: String(sessionId),
            userMessage: userMessageText
        }),
        onopen(response) {
            if (!response.ok) {
                if (aiMessage) {
                    aiMessage.isError = true;
                    aiMessage.content = '连接失败: HTTP ' + response.status;
                    aiMessage.isTyping = false;
                }
                throw new Error('HTTP ' + response.status);
            }
        },
        onmessage(event) {
            const raw = event.data.trim();
            if (!raw) return;
            if (event.event === 'done' || raw === '[DONE]') {
                isAiTying.value = false;
                if (aiMessage) aiMessage.isTyping = false;
                scrollToBottom();
                return;
            }
            try {
                const payload = JSON.parse(raw);
                let chunk = '';
                if (String(payload.code) === '200' && payload.data) {
                    chunk = payload.data.content || payload.data.message || payload.data.text || '';
                } else if (payload.content) {
                    chunk = payload.content;
                } else if (payload.data) {
                    chunk = typeof payload.data === 'string' ? payload.data : '';
                }
                if (aiMessage && chunk) {
                    aiMessage.content += chunk;
                }
                scrollToBottom();
            } catch {
                if (aiMessage) aiMessage.content += raw;
                scrollToBottom();
            }
        },
        onerror(err) {
            console.error('[SSE] 错误:', err);
            if (aiMessage) {
                aiMessage.isError = true;
                aiMessage.content = '连接发生错误，请稍后再试';
                aiMessage.isTyping = false;
            }
            isAiTying.value = false;
            throw err;
        },
        onclose() {
            isAiTying.value = false;
            if (aiMessage) aiMessage.isTyping = false;
        }
    });
};

const sendFollowUp = (text) => {
    startAiResponse(currentSession.value.sessionId, text);
};

const getSessionPage = () => {
    getSessionList({
        pageNum: 1,
        pageSize: 50
    }).then(res => {
        const list = res.data?.records || res.records || res.data || res;
        sessionList.value = Array.isArray(list) ? list : [];
    }).catch(err => {
        console.error('获取会话列表失败:', err);
    });
};

const sendMessage = () => {
    const text = userMessage.value.trim();
    if (text === '') return;

    if (isAiTying.value) {
        ElMessage.warning('AI正在输入，请稍后...');
        return;
    }

    if (!currentSession.value) {
        ElMessage.error('会话未初始化，请刷新页面');
        return;
    }

    messages.value.push({
        id: 'user_' + Date.now(),
        senderType: 1,
        content: text,
        createdAt: new Date().toLocaleTimeString()
    });

    userMessage.value = '';
    scrollToBottom();

    if (currentSession.value.status === 'TEMP') {
        startNewSession(text);
    } else {
        sendFollowUp(text);
    }
};

onMounted(() => {
    CreatNewSession();
    getSessionPage();
});
</script>

<style scoped lang="scss">
.consultation-container {
    margin: 0 auto;
    width: 1200px;
    display: flex;
    gap: 20px;
    padding: 20px;
    min-height: calc(100vh - 200px);
    height: calc(100vh - 140px);
    max-height: calc(100vh - 100px);

    .sidebar {
        width: 320px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;
        max-height: 100%;

        .ai-assistant-info {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 252, 248, 0.95) 100%);
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 8px 32px rgba(251, 146, 60, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(251, 146, 60, 0.08);
            flex-shrink: 0;

            .breathing-circle {
                width: 60px; height: 60px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px;
                animation: breathing 4s ease-in-out infinite;
                box-shadow: 0 6px 24px rgba(251, 146, 60, 0.25);
            }

            .assistant-name {
                font-size: 16px;
                font-weight: 700;
                background: linear-gradient(135deg, #fb923c, #f59e0b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-align: center;
                background-clip: text;
                margin: 0 0 12px;
            }

            .online-status {
                display: flex;
                align-items: center;
                justify-content: center;
                color: #059669;
                font-size: 12px;
                font-weight: 600;

                .status-dot {
                    width: 8px; height: 8px;
                    background: #059669;
                    border-radius: 50%;
                    margin-right: 8px;
                    animation: pulse 2s infinite;
                }
            }
        }

        .session-history {
            background: white;
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;

            .section-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin: 0 0 16px;
                flex-shrink: 0;
            }

            .session-list {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding-right: 4px;

                &::-webkit-scrollbar {
                    width: 4px;
                }
                &::-webkit-scrollbar-track {
                    background: transparent;
                }
                &::-webkit-scrollbar-thumb {
                    background: #d4d4d4;
                    border-radius: 2px;
                    &:hover { background: #b0b0b0; }
                }

                .session-item {
                    position: relative;
                    padding: 12px 36px 12px 12px;
                    margin-bottom: 8px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;

                    &:hover {
                        background: #f8f9ff;
                        border-color: #e6f0ff;
                    }
                    &.active {
                        background: #e6f0ff;
                        border-color: #4096ff;
                    }

                    .session-info {
                        .session-title {
                            font-weight: 500;
                            font-size: 14px;
                            color: #333;
                            margin-bottom: 4px;
                            padding-right: 4px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .session-meta {
                            margin-bottom: 6px;
                            padding-right: 4px;
                            .session-time { font-size: 12px; color: #999; }
                        }
                        .session-preview {
                            font-size: 12px;
                            color: #666;
                            margin-bottom: 6px;
                            padding-right: 4px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .session-stats {
                            display: flex;
                            gap: 12px;
                            span {
                                font-size: 12px;
                                color: #999;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                            }
                        }
                    }

                    .session-actions {
                        position: absolute;
                        top: 50%;
                        right: 8px;
                        transform: translateY(-50%);
                        z-index: 2;
                    }
                }
            }
        }
    }

    .chat-main {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 12px 40px rgba(251, 146, 60, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(251, 146, 60, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
        height: 100%;

        .chat-header {
            background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            .header-left {
                display: flex;
                align-items: center;
                .chat-avatar {
                    width: 48px; height: 48px;
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                }
                .chat-info {
                    h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
                    p { font-size: 14px; opacity: 0.9; }
                }
            }
            .new-session-btn {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
                color: #fff;
                &:hover { background: rgba(255, 255, 255, 0.3); }
            }
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            background: #fafbfc;
            min-height: 0;

            .message-item {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                max-width: 80%;
                .message-avatar {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    overflow: hidden;
                    background: #e5e7eb;
                }
                &.ai-message {
                    align-self: flex-start;
                    .message-bubble {
                        background: #fff;
                        border: 1px solid #e5e7eb;
                    }
                }
                &.user-message {
                    align-self: flex-end;
                    .message-bubble {
                        background: linear-gradient(135deg, #4096ff 0%, #2563eb 100%);
                        color: #fff;
                        border: none;
                    }
                    .message-time { text-align: right; }
                }
                .message-content {
                    flex: 1;
                    min-width: 0;
                    .message-bubble {
                        padding: 12px 16px;
                        border-radius: 16px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                        word-break: break-word;
                        line-height: 1.6;
                        .typing-indicator {
                            display: flex; gap: 4px; padding: 8px 0;
                            .typing-dot {
                                width: 8px; height: 8px;
                                background: #ccc;
                                border-radius: 50%;
                                animation: typing 1.5s ease-in-out infinite;
                                &:nth-child(2) { animation-delay: 0.2s; }
                                &:nth-child(3) { animation-delay: 0.4s; }
                            }
                        }
                        .error-message {
                            background: #FEF2F2;
                            border: 1px solid #F87171;
                            border-radius: 12px;
                            padding: 12px 16px;
                            color: #991B1B;
                        }
                    }
                    .message-time { font-size: 11px; color: #999; margin-top: 4px; }
                }
            }
        }

        .chat-input {
            border-top: 1px solid #eee;
            padding: 16px 24px;
            display: flex;
            gap: 12px;
            background: #fff;
            flex-shrink: 0;
            
            .message-input { 
                flex: 1; 
                :deep(textarea) { resize: none; } 
            }
            .send-btn {
                height: 60px; width: 60px;
                border-radius: 16px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%) !important;
                border: none !important;
                box-shadow: 0 6px 20px rgba(251, 146, 60, 0.25);
                &:disabled { opacity: 0.6; cursor: not-allowed; }
            }
        }
    }

    // 有消息时的样式
    .chat-main.has-messages {
        .chat-input {
            margin-top: 0;
        }
    }

    // 没有消息时的样式
    .chat-main.no-messages {
        .chat-messages {
            flex: 0 0 auto;
            min-height: auto;
            padding: 24px;
        }
        
        .chat-input {
            margin-top: auto;
            padding-top: 60px;
            padding-bottom: 40px;
        }
    }
}

@keyframes breathing {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
@keyframes typing {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}
</style>