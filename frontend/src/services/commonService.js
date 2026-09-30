import api from './api';

const commonService = {
    // Notifications
    getNotifications: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread/count'),
    getNotificationById: (id) => api.get(`/notifications/${id}`),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAsUnread: (id) => api.patch(`/notifications/${id}/unread`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    deleteAllRead: () => api.delete('/notifications/read-all'),

    // Password Reset
    forgotPassword: (email) => api.post('/auth/password/forgot', { email }),
    verifyResetToken: (token) => api.get(`/auth/password/verify/${token}`),
    resetPassword: (token, newPassword) => api.post(`/auth/password/reset/${token}`, { newPassword }),
    changePassword: (data) => api.post('/auth/password/change', data),

    // Profile
    updateProfileImage: (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return api.post('/user/profile/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default commonService;
