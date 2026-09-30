import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 100000,
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
            return Promise.reject(error);
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            toast.error('You do not have permission to perform this action.');
        }

        // Handle 500 Server Error
        if (error.response?.status === 500 && !originalRequest._skipErrorToast) {
            toast.error('Internal Server Error. Please try again later.');
        }

        // Handle Network Errors
        if (!error.response) {
            toast.error('Network Error. Please check your connection.');
        }

        return Promise.reject(error);
    }
);

export default api;
