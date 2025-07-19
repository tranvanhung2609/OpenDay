import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - không tự động thêm access token
api.interceptors.request.use((config) => {
    return config;
});

// Response interceptor - đơn giản hóa
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
