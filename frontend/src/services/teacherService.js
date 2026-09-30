import api from './api';

const teacherService = {
    // Dashboard
    getWeeklySchedule: () => api.get('/teacher/schedule/weekly'),
    getDailySchedule: (day) => api.get(`/teacher/schedule/day/${day}`),
    getUpcomingClasses: () => api.get('/teacher/classes/upcoming'),
    getAllClassesStats: () => api.get('/teacher/classes/all'),
    getLoadSummary: () => api.get('/teacher/load/summary'),

    // Class Management
    createClass: (data) => api.post('/teacher/classes', data),
    getClasses: () => api.get('/teacher/classes'),
    getClassDetails: (classId) => api.get(`/teacher/classes/${classId}`),
    updateClass: (classId, data) => api.patch(`/teacher/classes/${classId}`, data),
    toggleClassLock: (classId) => api.patch(`/teacher/classes/${classId}/lock`),
    deleteClass: (classId) => api.delete(`/teacher/classes/${classId}`),
    getClassStudents: (classId) => api.get(`/teacher/classes/${classId}/students`),

    // Lab Schedule
    getClassSchedule: (classId) => api.get(`/teacher/classes/${classId}/schedule`),
    getExamSlotSuggestions: (classId) => api.get(`/teacher/classes/${classId}/exam-slots/suggestions`),
    validateExamSlot: (classId, startTime, endTime) => api.post(`/teacher/classes/${classId}/exam-slots/validate`, { startTime, endTime }),
    getExamPrefill: (classId) => api.get(`/teacher/classes/${classId}/exam-prefill`),

    // Question Management
    createQuestion: (data) => api.post('/teacher/questions', data),
    getQuestions: (params) => api.get('/teacher/questions', { params }), // params: classId, difficulty
    getClassQuestions: (classId) => api.get(`/teacher/classes/${classId}/questions`),
    getQuestion: (questionId) => api.get(`/teacher/questions/${questionId}`),
    updateQuestion: (questionId, data) => api.put(`/teacher/questions/${questionId}`, data),
    deleteQuestion: (questionId) => api.delete(`/teacher/questions/${questionId}`),

    // Exam Management
    createExam: (data) => api.post('/teacher/exams', data),
    getClassExams: (classId) => api.get(`/teacher/classes/${classId}/exams`),
    publishExam: (examId) => api.patch(`/teacher/exams/${examId}/publish`),

    // Evaluation (Auto)
    triggerAutoEvaluation: (examId, studentId) => api.post(`/teacher/exams/${examId}/students/${studentId}/auto-evaluate`),
    getAutoEvaluationResults: (examId) => api.get(`/teacher/exams/${examId}/auto-evaluations`),
    getStudentAutoEvaluation: (studentId, examId) => api.get(`/teacher/students/${studentId}/exams/${examId}/auto-evaluation`),
    getAutoEvaluationStats: (examId) => api.get(`/teacher/exams/${examId}/auto-evaluation-stats`),

    // Evaluation (Manual)
    getSubmissions: (examId) => api.get(`/teacher/exams/${examId}/submissions`),
    createRubric: (data) => api.post('/teacher/evaluation-criteria', data),
    submitManualGrade: (data) => api.post('/teacher/manual-evaluation', data),

    // Result Publishing
    publishResults: (examId) => api.post(`/teacher/exams/${examId}/publish-results`),
    scheduleResult: (data) => api.post(`/teacher/exams/${data.examId}/schedule-result`, data),
};

export default teacherService;
