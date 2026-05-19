<!-- src/views/home.vue -->
<template>
    <div class="home-container">
        <div class="content">
            <div class="text">
                <h1 class="title">
                    一次温暖的对话<br/><span class="highlight-text">化孤独为慰藉</span>
                </h1>
                <p>我们致力于为您提供最专业的心理咨询服务。</p>
                <div class="hero-actions">
                    <!-- ✅ 添加点击事件跳转 -->
                    <el-button 
                        size="large" 
                        type="primary"
                        @click="goToConsultation"
                    >
                        开始诉说，获得陪伴
                    </el-button>
                    <el-button 
                        size="large" 
                        style="border-color: #fff" 
                        color="transparent"
                        @click="goToEmotionDiary"
                    >
                        记录心情，释放情感
                    </el-button>
                </div>
            </div>
            <div class="robot">
                <img :src="iconUrl" alt="AI助手" style="width: 150px; height: 150px;" class="robot-image" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const iconUrl = new URL('@/assets/images/robot-fill.png', import.meta.url).href

// ✅ 跳转到AI咨询页面
const goToConsultation = () => {
    router.push('/consultation')
}

// ✅ 跳转到情绪日记页面
const goToEmotionDiary = () => {
    router.push('/emotionDiary')
}
</script>

<style lang="scss" scoped>
.home-container {
    background: linear-gradient(90deg, rgb(74, 156, 140) 0%, rgb(61, 138, 122) 100%) rgba(74, 156, 140, 0.95);
    color: white;
    padding: 5rem 0;
    height: calc(100vh - 285px);
    display: flex;
    align-items: center;
    justify-content: center;
    .content {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 30px;
        .text {
            width: 500px;
            .title {
                font-size: 45px;
                font-weight: bold;
                margin-bottom: 15px;
                .highlight-text {
                    color: #ffd700;
                }
            }
            p {
                font-size: 16px;
                margin-bottom: 20px;
                opacity: 0.9;
            }
            .hero-actions {
                margin-top: 30px;
                display: flex;
                gap: 16px;
                
                .el-button {
                    min-width: 180px;
                    height: 48px;
                    font-size: 16px;
                    
                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }
                }
            }
        }
        .robot {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 260px;
            height: 260px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.2);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1),inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
    }
}
</style>