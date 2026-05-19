<template>
    <div class="page-head">
        <h1 class="page-title">{{props.title}}</h1>
        <div class="action-btn">
            <slot name="buttons"></slot>
        </div>
    </div>
</template>
<script setup>
const props = defineProps({
    title: {
        type: String,
        default: '页面标题'
    }
})
</script>
<style lang="scss" scoped>
.page-head {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .page-title {
        font-size: 24px;
        color: #1f2937;
    }
}
</style>