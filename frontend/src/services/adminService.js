import api from './api';

const adminService = {
    // Verification
    verifyTeacher: (teacherId) => api.post('/admin/verify-teacher', { teacherId }),
    updateTeacherEmail: (teacherId, email) => api.put(`/admin/teachers/${teacherId}/email`, { email }),

    // Teacher Verification Enhancements (Phase 7)
    getTeacherVerificationStats: () => api.get('/admin/teachers/verification-stats'),
    // Reverting to old endpoint as new one behaves as 404
    getUnverifiedTeachers: () => api.get('/admin/monitoring/teachers', { params: { isVerified: false } }),
    bulkVerifyTeachers: (teacherIds) => api.post('/admin/teachers/verify-bulk', { teacherIds }),
    resendTeacherCredentials: (teacherId) => api.post(`/admin/teachers/${teacherId}/resend-credentials`),
    rejectTeacher: (teacherId, reason) => api.post(`/admin/teachers/${teacherId}/reject`, { reason }),

    // Mapped methods to use the specific monitoring endpoints
    getAllTeachers: (params) => api.get('/admin/monitoring/teachers', { params }),
    getTeacherDetails: (id) => api.get(`/admin/monitoring/teachers/${id}`),
    getAllStudents: (params) => api.get('/admin/monitoring/students', { params }),
    getStudentDetails: (id) => api.get(`/admin/monitoring/students/${id}`),
    getAllClasses: (params) => api.get('/admin/monitoring/classes', { params }),
    getClassDetails: (id) => api.get(`/admin/monitoring/classes/${id}`),
    getLiveExams: () => api.get('/admin/monitoring/live-exams'),
    getExamDetails: (id) => api.get(`/admin/monitoring/exams/${id}`),
    getAllSubmissions: (params) => api.get('/admin/monitoring/submissions', { params }),
    getCompilerLogs: (params) => api.get('/admin/monitoring/compiler-logs', { params }),
    getUserActivity: (params) => api.get('/admin/monitoring/user-activity', { params }),
    getMonitoringStats: () => api.get('/admin/monitoring/stats'),
    getAllAdmins: () => adminService.getAdmins(),
    getAllSemesters: (params) => adminService.getSemesters(params),

    // Admin Management
    getAdmins: () => api.get('/admin/monitoring/admins'),
    createAdmin: (data) => api.post('/admin/monitoring/admins/create', data),
    getPermissions: () => api.get('/admin/monitoring/permissions'),
    updateAdminPermissions: (id, permissions) => api.patch(`/admin/monitoring/admins/${id}/permissions`, { permissions }),
    addPermissions: (id, permissions) => api.post(`/admin/monitoring/admins/${id}/permissions/add`, { permissions }),
    removePermissions: (id, permissions) => api.post(`/admin/monitoring/admins/${id}/permissions/remove`, { permissions }),
    removeAdmin: (id) => api.delete(`/admin/monitoring/admins/${id}`),
    toggleAdminStatus: (id) => api.patch(`/admin/monitoring/admins/${id}/status`),
    getAdminActivityLogs: (adminId, params) => api.get(`/admin/monitoring/admins/${adminId}/logs`, { params }),
    getAdminStats: () => api.get('/admin/monitoring/admins/stats'),
    getAdminById: (id) => api.get(`/admin/monitoring/admins/${id}`),

    // Audit & Health
    getAuditLogs: (params) => api.get('/admin/monitoring/audit-logs', { params }),
    getAuditLog: (id) => api.get(`/admin/monitoring/audit-logs/${id}`),
    getUserAuditLogs: (userId) => api.get(`/admin/monitoring/audit-logs/user/${userId}`),
    getAuditStats: () => api.get('/admin/monitoring/audit-logs/stats'),
    exportAuditLogs: (filters) => api.post('/admin/monitoring/audit-logs/export', filters, { responseType: 'blob' }),
    cleanupAuditLogs: (daysOld) => api.delete('/admin/monitoring/audit-logs/cleanup', { data: { daysOld } }),

    // Infrastructure Monitoring (Phase 2)
    getSystemInfo: () => api.get('/admin/monitoring/infrastructure/system-info'),
    getCpuUsage: () => api.get('/admin/monitoring/infrastructure/cpu'),
    getMemoryUsage: () => api.get('/admin/monitoring/infrastructure/memory'),
    getDiskUsage: () => api.get('/admin/monitoring/infrastructure/disk'),
    getNetworkInfo: () => api.get('/admin/monitoring/infrastructure/network'),
    getProcessInfo: () => api.get('/admin/monitoring/infrastructure/process'),
    getDatabaseStatus: () => api.get('/admin/monitoring/infrastructure/database'),
    getAllMetrics: () => api.get('/admin/monitoring/infrastructure/metrics'),
    getHealthStatus: () => api.get('/admin/monitoring/infrastructure/health'),

    // Server Logs (Phase 2)
    getLogFiles: () => api.get('/admin/monitoring/logs/files'),
    readLogFile: (filename, params) => api.get(`/admin/monitoring/logs/files/${filename}`, { params }),
    searchLogs: (data) => api.post('/admin/monitoring/logs/search', data),
    getAppLogs: (params) => api.get('/admin/monitoring/logs/app', { params }),
    getErrorLogs: (params) => api.get('/admin/monitoring/logs/errors', { params }),
    getAccessLogs: (params) => api.get('/admin/monitoring/logs/access', { params }),
    getParsedLogs: (params) => api.get('/admin/monitoring/logs/parsed', { params }),
    getLogStats: () => api.get('/admin/monitoring/logs/stats'),
    clearLogFile: (filename) => api.delete(`/admin/monitoring/logs/files/${filename}`),

    // Service Control (Phase 2)
    restartApp: () => api.post('/admin/monitoring/services/restart'),
    clearCache: () => api.post('/admin/monitoring/services/cache/clear'),
    clearDbConnections: () => api.post('/admin/monitoring/services/database/clear-connections'),
    runGc: () => api.post('/admin/monitoring/services/gc'),
    getServiceStatus: () => api.get('/admin/monitoring/services/status'),
    runHealthCheck: () => api.post('/admin/monitoring/services/health-check'),
    getPm2Processes: () => api.get('/admin/monitoring/services/pm2/processes'),
    restartPm2Process: (name) => api.post(`/admin/monitoring/services/pm2/restart/${name}`),
    performMaintenance: () => api.post('/admin/monitoring/services/maintenance'),

    // Real-Time Monitoring (Phase 3)
    getActiveConnections: () => api.get('/admin/monitoring/realtime/connections'),
    getExamRoomUsers: (examId) => api.get(`/admin/monitoring/realtime/exams/${examId}/users`),
    getClassRoomUsers: (classId) => api.get(`/admin/monitoring/realtime/classes/${classId}/users`),
    getActiveRooms: () => api.get('/admin/monitoring/realtime/rooms'),
    getRealTimeStats: () => api.get('/admin/monitoring/realtime/stats'),

    // Notification Management
    // Notification Management
    createNotification: (data) => api.post('/notifications/admin/create', data),
    createBulkNotifications: (data) => api.post('/notifications/admin/create-bulk', data),
    getNotificationStats: () => api.get('/notifications/admin/stats'),
    cleanupNotifications: (daysOld) => api.post('/notifications/admin/cleanup', { daysOld }),

    // Report Generation
    getReportTypes: () => api.get('/admin/monitoring/reports/types'),
    generateStudentReport: (data) => api.post('/admin/monitoring/reports/student-performance', data, { responseType: 'blob' }),
    generateExamReport: (data) => api.post('/admin/monitoring/reports/exam-analysis', data, { responseType: 'blob' }),
    generateClassReport: (data) => api.post('/admin/monitoring/reports/class-performance', data, { responseType: 'blob' }),
    generateTeacherReport: (data) => api.post('/admin/monitoring/reports/teacher-activity', data, { responseType: 'blob' }),
    generateCustomReport: (data) => api.post('/admin/monitoring/reports/custom', data, { responseType: 'blob' }),

    // Data Exports (Phase 2)
    exportStudents: (data) => api.post('/admin/monitoring/export/students', data, { responseType: 'blob' }),
    exportTeachers: (data) => api.post('/admin/monitoring/export/teachers', data, { responseType: 'blob' }),
    exportClasses: (data) => api.post('/admin/monitoring/export/classes', data, { responseType: 'blob' }),
    exportExams: (data) => api.post('/admin/monitoring/export/exams', data, { responseType: 'blob' }),
    exportSubmissions: (data) => api.post('/admin/monitoring/export/submissions', data, { responseType: 'blob' }),
    exportResults: (data) => api.post('/admin/monitoring/export/results', data, { responseType: 'blob' }),

    // User Management
    getUsers: (params) => api.get('/admin/monitoring/users', { params }),
    searchUsers: (query) => api.get(`/admin/monitoring/users/search?q=${query}`),
    getUserDetails: (id) => api.get(`/admin/monitoring/users/${id}`),
    updateUser: (id, data) => api.patch(`/admin/monitoring/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/monitoring/users/${id}`),
    blockUser: (id) => api.post(`/admin/monitoring/users/${id}/block`),
    unblockUser: (id) => api.post(`/admin/monitoring/users/${id}/unblock`),
    promoteToAdmin: (id, permissions) => api.post(`/admin/monitoring/users/${id}/promote-admin`, { permissions }),
    setUserPermissions: (id, permissions) => api.patch(`/admin/monitoring/users/${id}/permissions`, { permissions }),

    // Analytics
    getDashboardAnalytics: () => api.get('/admin/monitoring/analytics/dashboard'),
    getSystemStats: () => api.get('/admin/monitoring/analytics/system-stats'),
    getStudentPerformance: (params) => api.get('/admin/monitoring/analytics/student-performance', { params }),
    getExamStatistics: (params) => api.get('/admin/monitoring/analytics/exam-statistics', { params }),
    getClassPerformance: (classId) => api.get(`/admin/monitoring/analytics/classes/${classId}/performance`),
    getTeacherActivity: (teacherId) => api.get(`/admin/monitoring/analytics/teachers/${teacherId}/activity`),
    getSubmissionTrends: (params) => api.get('/admin/monitoring/analytics/submission-trends', { params }),
    getLeaderboard: (params) => api.get('/admin/monitoring/analytics/leaderboard', { params }),
    getExamSummary: (examId) => api.get(`/admin/monitoring/analytics/exams/${examId}/summary`),
    compareClasses: (classIds) => api.post('/admin/monitoring/analytics/classes/compare', { classIds }),

    // Reports
    generateReport: (type, body) => api.post(`/admin/monitoring/reports/${type}`, body, { responseType: 'blob' }),
    // Reports - Data Retrieval
    getEnrollmentStats: (semesterId) => api.get(`/admin/reports/semester/${semesterId}/enrollment`),
    getLabUtilization: (semesterId) => api.get(`/admin/reports/semester/${semesterId}/lab-utilization`),
    getTeacherLoad: (semesterId) => api.get(`/admin/reports/teacher-load`, { params: { semesterId } }),

    // Reports - CSV Exports
    exportEnrollmentCSV: (semesterId) => api.get(`/admin/reports/exports/semester/${semesterId}/enrollment`, { responseType: 'blob' }),
    exportTeachersCSV: (semesterId) => api.get(`/admin/reports/exports/semester/${semesterId}/teachers`, { responseType: 'blob' }),
    exportStudentsCSV: (semesterId) => api.get(`/admin/reports/exports/semester/${semesterId}/students`, { responseType: 'blob' }),
    exportLabUtilizationCSV: (semesterId) => api.get(`/admin/reports/exports/semester/${semesterId}/lab-utilization`, { responseType: 'blob' }),

    // Data Upload
    uploadSemesterData: (formData) => api.post('/admin/upload/semester-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getUploads: (params) => api.get('/admin/uploads', { params }),
    getUploadStatus: (id) => api.get(`/admin/uploads/${id}/status`),

    // Semesters & Lab Slots
    getSemesters: (params) => api.get('/admin/semesters', { params }),
    getActiveSemester: () => api.get('/admin/semesters/active'),
    getSemesterStats: () => api.get('/admin/semesters/stats'),
    getSemesterById: (id) => api.get(`/admin/semesters/${id}`),
    createSemester: (data) => api.post('/admin/semesters', data),
    updateSemester: (id, data) => api.put(`/admin/semesters/${id}`, data),
    activateSemester: (id) => api.patch(`/admin/semesters/${id}/activate`),
    deleteSemester: (id) => api.delete(`/admin/semesters/${id}`),

    getLabSlots: (params) => api.get('/admin/lab-slots', { params }),
    getLabSlotStats: () => api.get('/admin/lab-slots/stats'),
    getLabSlotsByBatch: (batch) => api.get(`/admin/lab-slots/batch/${batch}`),
    getTimetableView: (batch) => api.get(`/admin/lab-slots/timetable/${batch}`),
    getLabSlotById: (id) => api.get(`/admin/lab-slots/${id}`),
    createLabSlot: (data) => api.post('/admin/lab-slots', data),
    updateLabSlot: (id, data) => api.put(`/admin/lab-slots/${id}`, data),
    deleteLabSlot: (id) => api.delete(`/admin/lab-slots/${id}`),
    bulkUploadLabSlots: (file) => api.post('/admin/lab-slots/bulk', file, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Slot Timetable (Database Mappings)
    bulkCreateSlotTimetable: (data) => api.post('/admin/slot-timetable/bulk', data),
    createSlotTimetable: (data) => api.post('/admin/slot-timetable', data),
    getSlotTimetableStats: (params) => api.get('/admin/slot-timetable/stats', { params }),
    exportSlotTimetable: (params) => api.get('/admin/slot-timetable/export', { params }),
    getAllSlotTimetables: (params) => api.get('/admin/slot-timetable', { params }),

    // Bulk Import
    bulkImportClassSchedules: (payload) => api.post('/admin/class-schedules/bulk-import', payload),
    bulkImportStudents: (payload) => api.post('/admin/students/bulk-import', payload),

    deleteAllSlotTimetables: () => api.delete('/admin/slot-timetable'),
    getSlotTimetableByCode: (code) => api.get(`/admin/slot-timetable/${code}`),
    updateSlotTimetable: (id, data) => api.put(`/admin/slot-timetable/${id}`, data),
    deleteSlotTimetable: (id) => api.delete(`/admin/slot-timetable/${id}`),

    // Class Schedule Templates
    getTemplateStats: () => api.get('/admin/class-schedules/stats'),
    getTemplatesBySemester: (semesterId) => api.get(`/admin/class-schedules/semester/${semesterId}`),
    getTemplatesByBatchSection: (semesterId, batch, section) => api.get(`/admin/class-schedules/semester/${semesterId}/batch/${batch}/section/${section}`),
    getAllClassScheduleTemplates: (params) => api.get('/admin/class-schedules', { params }),
    getClassScheduleTemplateById: (id) => api.get(`/admin/class-schedules/${id}`),
    createClassScheduleTemplate: (data) => api.post('/admin/class-schedules', data),
    updateClassScheduleTemplate: (id, data) => api.put(`/admin/class-schedules/${id}`, data),
    duplicateTemplate: (id, data) => api.post(`/admin/class-schedules/${id}/duplicate`, data),
    deleteClassScheduleTemplate: (id) => api.delete(`/admin/class-schedules/${id}`),

    // Data Upload (Section 2.18)
    uploadSemesterData: (formData) => api.post('/admin/upload/semester-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getUploadStatistics: () => api.get('/admin/upload/stats'),
    getAllUploads: (params) => api.get('/admin/upload', { params }),
    getUploadStatus: (id) => api.get(`/admin/upload/${id}/status`),
    getUploadReport: (id) => api.get(`/admin/upload/${id}/report`),
    sendUploadEmails: (id, credentials) => api.post(`/admin/upload/${id}/send-emails`, credentials),

    // Database Explorer
    getDbStats: () => api.get('/admin/monitoring/database/stats'),
    getCollections: () => api.get('/admin/monitoring/database/collections'),
    getDocuments: (collection, params) => api.get(`/admin/monitoring/database/collections/${collection}/documents`, { params }),
    getDocument: (collection, id) => api.get(`/admin/monitoring/database/collections/${collection}/documents/${id}`),
    searchDocuments: (collection, params) => api.get(`/admin/monitoring/database/collections/${collection}/search`, { params }),
    getCollectionStats: (collection, config) => api.get(`/admin/monitoring/database/collections/${collection}/stats`, config),
    getCollectionIndexes: (collection) => api.get(`/admin/monitoring/database/collections/${collection}/indexes`),
    countDocumentsBy: (collection, field) => api.get(`/admin/monitoring/database/collections/${collection}/count-by/${field}`),
};

export default adminService;
