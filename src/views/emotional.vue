<template>
    <div>
        <PageHead title="情绪日志" />
        <TableSearch :formItem="formItem" @search="handleSearch" />

        <el-table :data="tableData" style="width: 100%" v-loading="loading">
            <!-- 用户ID -->
            <el-table-column prop="userId" label="用户ID" width="90" />
            
            <!-- 昵称 -->
            <el-table-column prop="nickname" label="用户昵称" width="130">
                <template #default="scope">
                    <div class="user-info">
                        <el-avatar :size="28" class="user-avatar">
                            {{ scope.row.nickname?.charAt(0) || '用' }}
                        </el-avatar>
                        <span class="user-name">{{ scope.row.nickname || '匿名用户' }}</span>
                    </div>
                </template>
            </el-table-column>
            
            <!-- 记录日期 -->
            <el-table-column prop="diaryDate" label="记录日期" width="120">
                <template #default="scope">
                    <div class="date-info">
                        <el-icon><Calendar /></el-icon>
                        <span>{{ scope.row.diaryDate || '-' }}</span>
                    </div>
                </template>
            </el-table-column>
            
            <!-- 主要情绪 -->
            <el-table-column prop="dominantEmotion" label="主要情绪" width="100">
                <template #default="scope">
                    <el-tag 
                        v-if="scope.row.dominantEmotion"
                        :type="getEmotionTagType(scope.row.dominantEmotion)"
                        effect="plain"
                        size="default"
                    >
                        {{ scope.row.dominantEmotion }}
                    </el-tag>
                    <span v-else class="text-muted">-</span>
                </template>
            </el-table-column>
            
            <!-- 情绪评分 -->
            <el-table-column label="情绪评分" width="240">
                <template #default="scope">
                    <div class="mood-score-wrapper">
                        <el-rate 
                            v-model="scope.row.moodScore" 
                            :max="10" 
                            disabled
                            size="small"
                            class="mood-rate"
                        />
                        <span class="score-text">{{ scope.row.moodScore }}/10</span>
                        <el-tag :type="getMoodType(scope.row.moodScore)" size="small" class="mood-tag">
                            {{ getMoodStatus(scope.row.moodScore) }}
                        </el-tag>
                    </div>
                </template>
            </el-table-column>
            
            <!-- 生活指标 -->
            <el-table-column label="生活指标" width="200">
                <template #default="scope">
                    <div class="life-indicators-wrapper">
                        <div class="indicator-row">
                            <span class="indicator-label">😴 睡眠</span>
                            <el-rate 
                                v-model="scope.row.sleepQuality" 
                                :max="5" 
                                disabled 
                                size="small"
                            />
                        </div>
                        <div class="indicator-row">
                            <span class="indicator-label">😰 压力</span>
                            <el-rate 
                                v-model="scope.row.stressLevel" 
                                :max="5" 
                                disabled 
                                size="small"
                                :colors="['#67c23a', '#e6a23c', '#f56c6c']"
                            />
                        </div>
                    </div>
                </template>
            </el-table-column>
            
            <!-- ✅ 操作 - 上下排列 -->
            <el-table-column label="操作" width="100" fixed="right" align="center">
                <template #default="scope">
                    <div class="action-buttons">
                        <el-button 
                            @click="viewDetail(scope.row)" 
                            type="primary" 
                            size="small"
                            class="action-btn"
                        >
                            <el-icon><View /></el-icon>
                            详情
                        </el-button>
                        <el-button 
                            type="danger" 
                            size="small" 
                            @click="handleDelete(scope.row)"
                            class="action-btn"
                        >
                            <el-icon><Delete /></el-icon>
                            删除
                        </el-button>
                    </div>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <div class="pagination-container">
            <el-pagination
                v-model:current-page="pagination.currentPage"
                v-model:page-size="pagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="pagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
            />
        </div>
        
        <!-- 详情弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            title="情绪日志详情"
            width="750px"
            :close-on-click-modal="false"
            class="detail-dialog"
        >
            <div v-if="currentDetail" class="detail-wrapper">
                <!-- 用户基本信息 -->
                <div class="detail-section">
                    <h4>
                        <el-icon><User /></el-icon>
                        基本信息
                    </h4>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="用户ID">{{ currentDetail.userId || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="用户昵称">
                            <div class="user-info-inline">
                                <el-avatar :size="24" class="user-avatar-small">
                                    {{ currentDetail.nickname?.charAt(0) || '用' }}
                                </el-avatar>
                                <span>{{ currentDetail.nickname || '匿名用户' }}</span>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="记录日期">{{ currentDetail.diaryDate || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="记录时间">{{ currentDetail.createdAt || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 情绪状态 -->
                <div class="detail-section">
                    <h4>
                        <el-icon><Sunny /></el-icon>
                        情绪状态
                    </h4>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="主要情绪">
                            <el-tag 
                                v-if="currentDetail.dominantEmotion"
                                :type="getEmotionTagType(currentDetail.dominantEmotion)"
                                effect="plain"
                            >
                                {{ currentDetail.dominantEmotion }}
                            </el-tag>
                            <span v-else>-</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="情绪评分">
                            <div class="detail-score">
                                <el-rate :model-value="currentDetail.moodScore || 0" disabled :max="10" size="small" />
                                <span class="detail-score-text">{{ currentDetail.moodScore || 0 }}/10</span>
                                <el-tag :type="getMoodType(currentDetail.moodScore)" size="small">
                                    {{ getMoodStatus(currentDetail.moodScore) }}
                                </el-tag>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="睡眠质量">
                            <div class="detail-indicator">
                                <el-rate :model-value="currentDetail.sleepQuality || 0" disabled :max="5" size="small" />
                                <span class="indicator-value">{{ currentDetail.sleepQuality || 0 }}/5</span>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="压力等级">
                            <div class="detail-indicator">
                                <el-rate 
                                    :model-value="currentDetail.stressLevel || 0" 
                                    disabled 
                                    :max="5" 
                                    size="small"
                                    :colors="['#67c23a', '#e6a23c', '#f56c6c']"
                                />
                                <span class="indicator-value">{{ currentDetail.stressLevel || 0 }}/5</span>
                            </div>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 日记内容 -->
                <div class="detail-section">
                    <h4>
                        <el-icon><Document /></el-icon>
                        日记内容
                    </h4>
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="触发因素">
                            <div v-if="getTriggerField(currentDetail)" class="triggers-display">
                                <el-tag 
                                    v-for="(trigger, index) in parseTriggers(getTriggerField(currentDetail))" 
                                    :key="index"
                                    size="small"
                                    type="info"
                                    class="trigger-tag"
                                >
                                    {{ trigger }}
                                </el-tag>
                            </div>
                            <span v-else class="text-muted">暂无触发因素</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="日记内容">
                            <div class="text-content">{{ currentDetail.diaryContent || '暂无内容' }}</div>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- AI情绪分析结果 -->
                <div class="detail-section" v-if="aiData && hasAiData">
                    <h4>
                        <el-icon><MagicStick /></el-icon>
                        AI情绪分析
                    </h4>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="主要情绪">
                            <el-tag :type="getAiEmotionTagType(aiData.primaryEmotion)">
                                {{ aiData.primaryEmotion || '-' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="情绪强度">
                            <el-progress 
                                :percentage="Number(aiData.emotionScore) || 0" 
                                :color="getEmotionScoreColor(Number(aiData.emotionScore) || 0)"
                                :stroke-width="6"
                            />
                        </el-descriptions-item>
                        <el-descriptions-item label="风险等级">
                            <el-tag :type="getRiskLevelTagType(aiData.riskLevel)">
                                {{ aiData.riskLevel || '-' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="情绪性质">
                            <el-tag :type="aiData.isNegative ? 'danger' : 'success'">
                                {{ aiData.isNegative ? '负向情绪' : '正向情绪' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="情绪标签" :span="2">
                            <el-tag 
                                v-for="(tag, index) in (aiData.label?.split(',') || [])" 
                                :key="index"
                                size="small"
                                type="info"
                                class="emotion-tag"
                            >
                                {{ tag }}
                            </el-tag>
                            <span v-if="!aiData.label">-</span>
                        </el-descriptions-item>
                    </el-descriptions>

                    <div class="ai-analysis-content" v-if="aiData.suggestion">
                        <h5>💡 专业建议</h5>
                        <div class="analysis-text">{{ aiData.suggestion }}</div>
                    </div>

                    <div class="ai-analysis-content" v-if="aiData.riskDescription">
                        <h5>⚠️ 风险描述</h5>
                        <div class="analysis-text risk-text">{{ aiData.riskDescription }}</div>
                    </div>

                    <div class="ai-analysis-content" v-if="aiData.improSuggestions?.length">
                        <h5>📋 改善建议</h5>
                        <div class="improvement-list">
                            <div v-for="(item, index) in aiData.improSuggestions" :key="index" class="improvement-item">
                                <span class="improvement-number">{{ index + 1 }}</span>
                                <span>{{ item }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <el-button @click="dialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { getEmotionalPage, deleteEmotional } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
    Edit, Delete, View, Calendar, 
    User, Sunny, Document, MagicStick 
} from '@element-plus/icons-vue'
import TableSearch from '@/components/TableSearch.vue'  
import PageHead from '@/components/PageHead.vue'

const formItem = [
    {
        label: '用户昵称',
        prop: 'nickname',
        comp: 'input',
        placeholder: '请输入用户昵称'
    },
    {
        label: '情绪评分',
        prop: 'moodScoreRange',
        comp: 'select',
        placeholder: '请选择情绪评分范围',
        options: [
            { label: '低分（0-3分）', value: '0-3' },
            { label: '中分（4-6分）', value: '4-6' }, 
            { label: '高分（7-10分）', value: '7-10' },
        ]
    }
]

// 表格数据
const tableData = ref([])
const loading = ref(false)
const searchFormData = ref({})

// 分页参数
const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
})

// 动态获取触发因素字段（兼容不同后端字段名）
const getTriggerField = (row) => {
    return row.emotionalTriggers || row.emotionTriggers || row.triggers || row.triggerFactors || ''
}

// 解析触发因素
const parseTriggers = (triggers) => {
    if (!triggers) return []
    if (typeof triggers === 'string') {
        return triggers.split(',').filter(t => t.trim())
    }
    if (Array.isArray(triggers)) {
        return triggers
    }
    return []
}

// 判断AI数据是否有效
const hasAiData = computed(() => {
    if (!aiData.value) return false
    return aiData.value.primaryEmotion || 
           aiData.value.emotionScore || 
           aiData.value.suggestion ||
           aiData.value.riskDescription
})

// 获取情绪状态
const getMoodStatus = (score) => {
    if (score >= 9) return '极好'
    if (score >= 8) return '愉悦'
    if (score >= 7) return '良好'
    if (score >= 6) return '较好'
    if (score >= 5) return '一般'
    if (score >= 4) return '稍差'
    if (score >= 3) return '低落'
    if (score >= 2) return '很差'
    return '极差'
}

// 获取情绪标签类型
const getMoodType = (score) => {
    if (score >= 8) return 'success'
    if (score >= 6) return ''
    if (score >= 4) return 'warning'
    return 'danger'
}

// 获取情绪类型标签
const getEmotionTagType = (emotion) => {
    if (!emotion) return 'info'
    const positiveEmotions = ['开心', '兴奋', '平静']
    const negativeEmotions = ['焦虑', '悲伤', '疲惫', '困惑']
    
    if (positiveEmotions.includes(emotion)) return 'success'
    if (negativeEmotions.includes(emotion)) return 'warning'
    return 'info'
}

// 获取AI情绪标签类型
const getAiEmotionTagType = (emotion) => {
    if (!emotion) return 'info'
    const positiveEmotions = ['开心', '兴奋', '快乐', '满足', '幸福', '愉悦', '平静']
    const negativeEmotions = ['焦虑', '悲伤', '愤怒', '恐惧', '抑郁', '低落']
    
    if (positiveEmotions.includes(emotion)) return 'success'
    if (negativeEmotions.includes(emotion)) return 'danger'
    return 'primary'
}

// 获取风险等级标签类型
const getRiskLevelTagType = (level) => {
    if (!level) return 'info'
    if (level === '低') return 'success'
    if (level === '中') return 'warning'
    if (level === '高') return 'danger'
    return 'info'
}

// 获取情绪强度颜色
const getEmotionScoreColor = (score) => {
    if (score >= 80) return '#f56c6c'
    if (score >= 60) return '#e6a23c'
    if (score >= 40) return '#409eff'
    return '#67c23a'
}

// 获取数据
const fetchData = async (formData = {}) => {
    loading.value = true
    try {
        let params = {
            ...formData,
            currentPage: pagination.currentPage,
            pageSize: pagination.pageSize
        }

        // 转换情绪区间
        if (formData.moodScoreRange) {
            const [min, max] = formData.moodScoreRange.split('-')
            params.minMoodScore = min
            params.maxMoodScore = max
            delete params.moodScoreRange
        }

        const res = await getEmotionalPage(params)

        const result = res.data || res

        if (result && result.records) {
            tableData.value = result.records
            pagination.total = result.total || 0
        } else {
            tableData.value = []
            pagination.total = 0
        }

    } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error('获取情绪日志失败')
    } finally {
        loading.value = false
    }
}

// 搜索处理
const handleSearch = (formData) => {
    searchFormData.value = formData || {}
    pagination.currentPage = 1
    fetchData(formData)
}

// 页码切换
const handlePageChange = (page) => {
    pagination.currentPage = page
    fetchData(searchFormData.value)
}

// 每页条数切换
const handleSizeChange = (size) => {
    pagination.pageSize = size
    pagination.currentPage = 1
    fetchData(searchFormData.value)
}

// 删除处理
const handleDelete = (row) => {
    ElMessageBox.confirm(
        `确定要删除用户"${row.nickname || '未知'}"的情绪日志吗？此操作不可恢复！`,
        '警告',
        {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
        }
    ).then(async () => {
        try {
            await deleteEmotional(row.id)
            ElMessage.success('删除成功')
            fetchData(searchFormData.value)
        } catch (error) {
            console.error('删除失败:', error)
            ElMessage.error('删除失败')
        }
    }).catch(() => {
        // 用户取消删除
    })
}

// 弹窗显示
const dialogVisible = ref(false)
const currentDetail = ref(null)
const aiData = ref(null)

// 查看详情
const viewDetail = (row) => {
    currentDetail.value = { ...row }
    
    if (row.aiEmotionAnalysis) {
        try {
            aiData.value = typeof row.aiEmotionAnalysis === 'string' 
                ? JSON.parse(row.aiEmotionAnalysis) 
                : row.aiEmotionAnalysis
        } catch (e) {
            console.error('解析AI分析数据失败:', e)
            aiData.value = null
        }
    } else {
        aiData.value = null
    }
    
    dialogVisible.value = true
}

// 初始化加载数据
onMounted(() => {
    fetchData()
})
</script>

<style scoped>
/* 用户信息 */
.user-info {
    display: flex;
    align-items: center;
    gap: 6px;
}

.user-name {
    font-weight: 500;
    color: #333;
    font-size: 13px;
}

/* 日期信息 */
.date-info {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #666;
    font-size: 13px;
}

/* 情绪评分 */
.mood-score-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.mood-rate {
    flex-shrink: 0;
}

.score-text {
    font-weight: bold;
    color: #409eff;
    font-size: 13px;
    white-space: nowrap;
}

.mood-tag {
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;
}

/* 生活指标 */
.life-indicators-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.indicator-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.indicator-label {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
    min-width: 55px;
}

/* ✅ 操作按钮 - 上下排列 */
.action-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.action-btn {
    width: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;
}

/* 文本样式 */
.text-muted {
    color: #999;
    font-size: 13px;
}

/* 分页 */
.pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding: 10px 0;
}

/* 详情弹窗 */
.detail-wrapper {
    max-height: 65vh;
    overflow-y: auto;
    padding: 10px 0;
}

.detail-section {
    margin-bottom: 24px;
}

.detail-section h4 {
    margin-bottom: 12px;
    color: #333;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
}

.user-info-inline {
    display: flex;
    align-items: center;
    gap: 8px;
}

.detail-score {
    display: flex;
    align-items: center;
    gap: 8px;
}

.detail-score-text {
    font-weight: 600;
    color: #409eff;
}

.detail-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.indicator-value {
    font-weight: 600;
    color: #333;
    font-size: 13px;
}

.text-content {
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.8;
    color: #333;
    font-size: 14px;
    max-height: 200px;
    overflow-y: auto;
}

.triggers-display {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.trigger-tag {
    margin: 0;
}

/* AI分析内容 */
.ai-analysis-content {
    margin-top: 16px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.ai-analysis-content h5 {
    margin: 0 0 10px 0;
    color: #495057;
    font-size: 14px;
    font-weight: 600;
}

.analysis-text {
    line-height: 1.6;
    color: #606266;
    font-size: 13px;
}

.risk-text {
    color: #f56c6c;
}

.improvement-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.improvement-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
}

.improvement-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: #409eff;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    flex-shrink: 0;
}

.emotion-tag {
    margin-right: 4px;
    margin-bottom: 4px;
}

/* 表格样式 */
:deep(.el-table) {
    margin-top: 16px;
}

:deep(.el-table th) {
    background-color: #f5f7fa;
    font-weight: bold;
    color: #333;
    font-size: 13px;
}

:deep(.el-table .el-table__row:hover) {
    background-color: #f0f9ff;
}

:deep(.el-table .cell) {
    padding: 10px 12px;
}

:deep(.el-table .el-rate) {
    display: inline-flex;
    align-items: center;
}

:deep(.el-table .el-rate__item) {
    display: inline-block;
}

:deep(.el-table td) {
    vertical-align: middle;
}

/* ✅ 操作列居中对齐 */
:deep(.el-table .el-table__cell:last-child .cell) {
    display: flex;
    justify-content: center;
    padding: 8px 4px;
}
</style>