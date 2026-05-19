<template>
    <el-dialog
        :title="isEdit ? '编辑文章' : '新增文章'"
        v-model="dialogVisible"
        width="50%"
        @close="handleDialogClose"
    >
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
            <el-form-item label="文章标题" prop="title">
                <el-input 
                    v-model="formData.title" 
                    placeholder="请输入文章标题" 
                    maxlength="200" 
                    show-word-limit 
                    clearable 
                />
            </el-form-item>
            
            <el-form-item label="所属分类" prop="categoryId">
                <el-select 
                    v-model="formData.categoryId" 
                    placeholder="请选择分类" 
                    style="width: 100%;"
                >
                    <el-option 
                        v-for="item in props.categories" 
                        :key="item.value" 
                        :label="item.label" 
                        :value="item.value" 
                    />
                </el-select>
            </el-form-item>
            
            <el-form-item label="文章摘要" prop="summary">
                <el-input 
                    type="textarea" 
                    v-model="formData.summary" 
                    placeholder="请输入文章摘要(可选)" 
                    maxlength="1000" 
                    show-word-limit 
                    :rows="4" 
                />
            </el-form-item>
            
            <el-form-item label="标签" prop="tags">
                <el-select 
                    v-model="formData.tagArray" 
                    placeholder="请输入文章标签(可多选)" 
                    multiple 
                    filterable 
                    allow-create 
                    style="width: 100%;"
                >
                    <el-option 
                        v-for="tag in commonTags" 
                        :key="tag" 
                        :label="tag" 
                        :value="tag" 
                    />
                </el-select>
            </el-form-item>
            
            <el-form-item label="封面图片">
                <el-upload 
                    class="avatar-uploader" 
                    :http-request="handleUploadRequest" 
                    accept="image/*" 
                    :show-file-list="false"
                >
                    <div v-if="!imgUrl" class="cover-placeholder">
                        <p>点击上传封面图片</p>
                    </div>
                    <img v-else :src="imgUrl" alt="封面图片" class="cover-image" />
                </el-upload>
                <div v-if="imgUrl" class="cover-remove">
                </div>
            </el-form-item>
            
            <el-form-item label="文章内容" prop="content">
                <RichTextEditor 
                    v-model="formData.content" 
                    placeholder="请输入文章内容" 
                    :maxlength="5000" 
                    @change="handleContentChange" 
                    @created="handleEditorCreated" 
                    min-height="400px" 
                />
            </el-form-item>
        </el-form>
        
        <div v-if="btnPreview">
            <h3>内容预览</h3>
            <div v-html="formData.content"></div>
        </div>
        
        <template #footer>
            <el-button @click="btnPreview = !btnPreview">
                {{ btnPreview ? '隐藏预览' : '预览效果' }}
            </el-button>
            <el-button @click="handleClose">取消</el-button>
            <el-button 
                type="primary" 
                @click="handleSubmit" 
                :loading="loading"
            >
                {{ isEdit ? '更新文章' : '提交创建文章' }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile, createArticle, updateArticle, getArticle } from '@/api/admin'
import { fileBaseUrl } from '@/config/index'
import RichTextEditor from '@/components/RichTextEditor.vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    categories: { type: Array, default: () => [] },
    articleData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref(null)
const editorInstance = ref(null)
const btnPreview = ref(false)
const loading = ref(false)
const imgUrl = ref('')

// 判断是编辑还是新增
const isEdit = computed(() => {
    return props.articleData && props.articleData.id
})

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const formData = reactive({
    title: "",
    content: "",
    coverImage: "",
    categoryId: 1,
    summary: "",
    tags: "",
    id: "",
    tagArray: []
})

const rules = reactive({
    title: [
        { required: true, message: '请输入文章标题', trigger: 'blur' },
        { max: 200, message: '文章标题最多200个字符', trigger: 'blur' }
    ],
    categoryId: [
        { required: true, message: '请选择分类', trigger: 'change' }
    ],
    content: [
        { required: true, message: '请输入文章内容', trigger: 'blur' },
        { max: 5000, message: '文章内容最多5000个字符', trigger: 'blur' }
    ]
})

const commonTags = [
    '情绪管理', '焦虑', '抑郁', '压力', '睡眠', '冥想', '正念', 
    '放松', '心理健康', '自我成长', '人际关系', '工作压力', 
    '学习方法', '生活技巧'
]

// 加载文章详情（编辑模式）
const loadArticleDetail = async (id) => {
    try {
        loading.value = true
        const res = await getArticle(id)
        // ✅ 拦截器返回的是 { code, msg, data }，res.data 是文章详情
        const article = res.data
        
        if (res.code == 200 && res.success && article) {
            formData.id = article.id || ''
            formData.title = article.title || ''
            formData.content = article.content || ''
            formData.coverImage = article.coverImage || ''
            formData.categoryId = article.categoryId || 1
            formData.summary = article.summary || ''
            formData.tags = article.tags || ''
            
            // 处理标签数组
            if (article.tags && typeof article.tags === 'string') {
                formData.tagArray = article.tags.split(',').filter(tag => tag.trim())
            } else if (Array.isArray(article.tags)) {
                formData.tagArray = article.tags
            } else {
                formData.tagArray = []
            }
            
            // 处理封面图片
            if (article.coverImage) {
                imgUrl.value = article.coverImage.startsWith('http') 
                    ? article.coverImage 
                    : fileBaseUrl + article.coverImage
            }
            
            // 设置富文本编辑器内容
            if (editorInstance.value && article.content) {
                nextTick(() => {
                    editorInstance.value.setHtml(article.content)
                })
            }
        } else {
            ElMessage.error(res.msg || '获取文章详情失败')
        }
    } catch (error) {
        console.error('获取文章详情失败:', error)
        ElMessage.error('获取文章详情失败')
    } finally {
        loading.value = false
    }
}

// 监听弹窗打开，如果是编辑模式则加载数据
watch(() => [props.modelValue, props.articleData], ([newVisible, newArticle]) => {
    if (newVisible) {
        if (newArticle && newArticle.id) {
            // 编辑模式
            loadArticleDetail(newArticle.id)
        } else {
            // 新增模式，重置表单
            resetForm()
        }
    }
}, { deep: true })

const handleUploadRequest = async ({ file }) => {
    try {
        const res = await uploadFile(file, { businessId: crypto.randomUUID() })
        // ✅ 拦截器返回的是 { code, msg, data }，res.data 是文件信息
        const fileInfo = res.data
        
        if (res.code == 200 && res.success === true && fileInfo) {
            const filePath = fileInfo.filePath || fileInfo.url || fileInfo.path || fileInfo.fileName || fileInfo.fileUrl
            
            if (filePath) {
                imgUrl.value = filePath.startsWith('http') ? filePath : fileBaseUrl + filePath
                formData.coverImage = filePath
                ElMessage.success('图片上传成功')
            } else {
                ElMessage.error('图片上传失败：未获取到文件路径')
            }
        } else {
            ElMessage.error(res.msg || res.message || '上传失败')
        }
    } catch (error) {
        ElMessage.error('图片上传失败')
    }
}

const handleContentChange = (data) => {
    formData.content = data.html
}

const handleEditorCreated = (editor) => {
    editorInstance.value = editor
    if (formData.content && editor) {
        nextTick(() => editor.setHtml(formData.content))
    }
}

const handleClose = () => {
    resetForm()
    emit('update:modelValue', false)
}

const handleDialogClose = () => {
    resetForm()
    emit('update:modelValue', false)
}

const handleSubmit = async () => {
    if (!formRef.value) return
    
    try {
        await formRef.value.validate()
        loading.value = true
        
        const submitData = {
            title: formData.title,
            content: formData.content,
            coverImage: formData.coverImage,
            categoryId: formData.categoryId,
            summary: formData.summary,
            tags: formData.tagArray.join(',')
        }
        
        let res;
        
        if (isEdit.value) {
            // 编辑模式：调用更新接口
            res = await updateArticle(formData.id, submitData)
        } else {
            // 新增模式：调用创建接口
            res = await createArticle(submitData)
        }
        
        // ✅ 拦截器返回的是 { code, msg, data }，直接用 res
        if (res.code == 200 && res.success) {
            ElMessage.success(isEdit.value ? '文章更新成功' : '文章创建成功')
            resetForm()
            emit('success')
            emit('update:modelValue', false)
        } else {
            ElMessage.error(res.msg || '操作失败')
        }
        
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('请完善表单信息')
        }
    } finally {
        loading.value = false
    }
}

const resetForm = () => {
    Object.assign(formData, {
        title: "",
        content: "",
        coverImage: "",
        categoryId: 1,
        summary: "",
        tags: "",
        id: "",
        tagArray: []
    })
    imgUrl.value = ""
    btnPreview.value = false
    formRef.value?.resetFields()
}

defineExpose({ resetForm, formData })

watch(() => dialogVisible.value, (newVal) => {
    if (!newVal) {
        btnPreview.value = false
    }
})
</script>

<style lang="scss" scoped>
.cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 120px;
    color: #8b949e;
    background-color: #f6f8fa;
    cursor: pointer;
    &:hover { background-color: #eef2f5; }
}

.cover-image {
    width: 200px;
    height: 120px;
    object-fit: cover;
    cursor: pointer;
}

:deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
    &:hover { border-color: #409eff; }
}
</style>