import axios from 'axios'
import { ElMessage } from 'element-plus'

//创建axios实例
const service = axios.create({
    baseURL: '/api',
    timeout: 5000
})

//请求拦截器
service.interceptors.request.use(
    config => {
        // 在发送请求之前做些什么
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['token'] = token
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

//响应拦截器
service.interceptors.response.use(
    response => {
        // 对响应数据做点什么
        const { data, config } = response
        
        // 处理业务状态码（兼容字符串和数字）
        if (data.code == 200) {
            return data  // 返回完整的 data，包含 code、msg、data
        } else {
            // 处理登录过期
            if (data.code == -1 || data.code == '-1') {
                if (!config.url?.includes('/login')) {
                    ElMessage.error(data.msg || '登录过期，请重新登录')
                    //清除登入信息
                    localStorage.removeItem('token')
                    //清除用户信息
                    localStorage.removeItem('userInfo')
                    //跳转登录页
                    window.location.href = '/auth/login'
                } else {
                    ElMessage.error(data.msg || '登录过期，请重新登录')
                    return Promise.reject(data)
                }
            } else {
                // 其他业务错误
                ElMessage.error(data.msg || data.message || '请求失败')
                return Promise.reject(data)
            }
        }
    },
    error => {
        // 网络错误处理
        ElMessage.error('网络请求失败，请检查网络连接')
        return Promise.reject(error)
    }
)

export default service