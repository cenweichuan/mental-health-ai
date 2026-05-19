<template>
    <div>
        <PageHead title="知识文章">
            <template #buttons>
                <el-button @click="handleAdd" type="primary">新增</el-button>
            </template>
        </PageHead>
        
        <TableSearch :formItem="formItem" @search="handleSearch"></TableSearch>
        
        <el-table
            :data="tableData"
            style="width: 100%"
            margin-top="25px"
        >
            <el-table-column label="文章标题" width="200px">
                <template #default="scope">
                    <div style="display: flex; align-items: center;">
                        <el-icon><timer /></el-icon>
                        <span style="margin-left: 8px;">{{ scope.row.title }}</span>
                    </div>
                </template>
            </el-table-column>
            
            <el-table-column label="分类" width="120px">
                <template #default="scope">
                    <span>{{ scope.row.categoryName || categoryMap[scope.row.categoryId] || '未知分类' }}</span>
                </template>
            </el-table-column>
            
            <el-table-column prop="authorName" label="作者" width="120px"></el-table-column>
            
            <el-table-column label="状态" width="100px">
                <template #default="scope">
                    <el-tag v-if="scope.row.status === 1" type="success">已发布</el-tag>
                    <el-tag v-else-if="scope.row.status === 0" type="info">草稿</el-tag>
                    <el-tag v-else-if="scope.row.status === 2" type="warning">已下线</el-tag>
                    <span v-else>{{ scope.row.statusText || scope.row.status }}</span>
                </template>
            </el-table-column>
            
            <el-table-column prop="readCount" label="阅读量" width="100px"></el-table-column>
            
            <el-table-column label="发布时间" width="180px">
                <template #default="scope">
                    <span>{{ formatTime(scope.row.publishedAt || scope.row.createdAt) }}</span>
                </template>
            </el-table-column>
            
            <el-table-column label="操作" width="250px" fixed="right">
                <template #default="scope">
                    <el-button 
                        text 
                        type="primary" 
                        size="small" 
                        @click="handleEdit(scope.row)"
                    >
                        编辑
                    </el-button>
                    <el-button 
                        v-if="scope.row.status === 0 || scope.row.status === 2" 
                        text 
                        type="success" 
                        size="small"
                        @click="handlePublish(scope.row)"
                    >
                        发布
                    </el-button>
                    <el-button 
                        v-if="scope.row.status === 1" 
                        text 
                        type="warning" 
                        size="small"
                        @click="handleOffline(scope.row)"
                    >
                        下线
                    </el-button>
                    <el-button 
                        text 
                        type="danger" 
                        size="small" 
                        @click="handleDelete(scope.row)"
                    >
                        删除
                    </el-button>
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
        
        <!-- ArticleDialog -->
        <ArticleDialog 
            v-model="dialogVisible" 
            :article-data="currentArticle"
            @success="handleSuccess"
            :categories="categories"
        />
    </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHead from '@/components/PageHead.vue'
import TableSearch from '@/components/TableSearch.vue'
import { 
    categoryTree, 
    articlePage, 
    updateArticle, 
    deleteArticle,
    publishArticle,
    offlineArticle 
} from '@/api/admin'
import ArticleDialog from '@/components/ArticleDialog.vue'

const formItem = ref([
    {
        comp: 'input',
        prop: 'title',
        label: '文章标题',
        placeholder: '请输入文章标题'
    },
    {
        comp: 'select',
        prop: 'categoryId',
        label: '分类',
        placeholder: '请选择分类',
        options: []
    },
    {
        comp: 'select',
        prop: 'status',
        label: '状态',
        placeholder: '请选择状态',
        options: [
            { label: '已发布', value: 1 },
            { label: '草稿', value: 0 },
            { label: '已下线', value: 2 }
        ]
    }
])

// 分页参数
const pagination = reactive({
    currentPage: 1,
    total: 0
})

const jumpPage = ref('')

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
    }
    handleSearch({})
}

// 弹窗相关
const dialogVisible = ref(false)
const currentArticle = ref({})

// 新增
const handleAdd = () => {
    currentArticle.value = {}
    dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
    currentArticle.value = { ...row }
    dialogVisible.value = true
}

// 发布文章
const handlePublish = async (row) => {
    ElMessageBox.confirm(`确认发布文章"${row.title}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
    }).then(async () => {
        try {
            const res = await publishArticle(row.id, { status: 1 })
            // ✅ 拦截器返回的是 { code, msg, data }，直接用 res
            if (res.code == 200 && res.success) {
                ElMessage.success('发布成功')
                handleSearch({})
            } else {
                ElMessage.error(res.msg || '发布失败')
            }
        } catch (error) {
            console.error('发布失败:', error)
            ElMessage.error('发布失败')
        }
    }).catch(() => {})
}

// 下线文章
const handleOffline = async (row) => {
    ElMessageBox.confirm(`确认下线文章"${row.title}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            const res = await offlineArticle(row.id, { status: 2 })
            // ✅ 拦截器返回的是 { code, msg, data }，直接用 res
            if (res.code == 200 && res.success) {
                ElMessage.success('下线成功')
                handleSearch({})
            } else {
                ElMessage.error(res.msg || '下线失败')
            }
        } catch (error) {
            console.error('下线失败:', error)
            ElMessage.error('下线失败')
        }
    }).catch(() => {})
}

// 删除文章
const handleDelete = async (row) => {
    ElMessageBox.confirm(`确认删除文章"${row.title}"吗？删除后无法恢复`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            const res = await deleteArticle(row.id)
            // ✅ 拦截器返回的是 { code, msg, data }，直接用 res
            if (res.code == 200 && res.success) {
                ElMessage.success('删除成功')
                if (tableData.value.length === 1 && pagination.currentPage > 1) {
                    pagination.currentPage -= 1
                }
                handleSearch({})
            } else {
                ElMessage.error(res.msg || '删除失败')
            }
        } catch (error) {
            console.error('删除失败:', error)
            ElMessage.error('删除失败')
        }
    }).catch(() => {})
}

// 操作成功回调
const handleSuccess = () => {
    handleSearch({})
}

// 时间格式化函数
const formatTime = (time) => {
    if (!time) return '未发布'
    
    if (typeof time === 'number') {
        return new Date(time).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }
    
    if (typeof time === 'string') {
        if (time.includes('-') || time.includes('/') || time.includes(':')) {
            return time
        }
        const date = new Date(time)
        if (!isNaN(date.getTime())) {
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
        return time
    }
    
    return String(time)
}

// 搜索处理
const handleSearch = async (formData = {}) => {
    const params = {
        currentPage: pagination.currentPage,
        pageSize: 10,
        ...formData
    }
    
    try {
        const res = await articlePage(params)
        // ✅ 拦截器返回的是 { code, msg, data }，res.data 是分页对象
        const result = res.data
        
        if (result && result.records) {
            tableData.value = result.records
            pagination.total = result.total || 0
        } else {
            tableData.value = []
            pagination.total = 0
        }
        
        jumpPage.value = pagination.currentPage.toString()
    } catch (error) {
        console.error('查询失败:', error)
        ElMessage.error('获取文章列表失败')
        tableData.value = []
        pagination.total = 0
    }
}

// 分类映射
const categoryMap = reactive({})
const categories = ref([])
const tableData = ref([])

onMounted(async () => {
    try {
        const res = await categoryTree()
        // ✅ 拦截器返回 { code, msg, data }，res.data 是业务数据
        const list = res.data
        
        if (Array.isArray(list)) {
            Object.keys(categoryMap).forEach(key => delete categoryMap[key])
            
            categories.value = list.map(item => {
                categoryMap[item.id] = item.categoryName
                return {
                    label: item.categoryName,
                    value: item.id
                }
            })
            
            formItem.value[1].options = categories.value
        }
        
        await handleSearch({})
    } catch (error) {
        console.error('初始化失败:', error)
        ElMessage.error('页面初始化失败')
    }
})
</script>

<style scoped>
:deep(.el-table) {
    margin-top: 20px;
}

:deep(.el-button + .el-button) {
    margin-left: 8px;
}

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
</style>