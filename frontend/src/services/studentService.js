import api from './api';

const studentService = {
    // Dashboard & Timetable
    getWeeklyTimetable: () => api.get('/student/timetable/weekly'),
    getDailyTimetable: (day) => api.get(`/student/timetable/day/${day}`),
    getUpcomingLabs: () => api.get('/student/labs/upcoming'),

    // Class Management
    getAllClasses: () => api.get('/student/classes'),
    joinClass: (code) => api.post('/student/classes/join', { code }),
    leaveClass: (classId) => api.delete(`/student/classes/${classId}/leave`),
    getClassExams: (classId) => api.get(`/student/classes/${classId}/exams`),

    // Exam Management
    startExam: (examId) => api.post(`/student/exams/${examId}/start`),
    getExamQuestions: (examId) => api.get(`/student/exams/${examId}/questions`),
    submitExam: (examId) => api.post(`/student/exams/${examId}/submit`),

    // Code Draft & Auto-save
    autoSaveDraft: (examId, questionId, code, languageId) =>
        api.post(`/student/exams/${examId}/questions/${questionId}/autosave`, { code, languageId }),

    recoverDraft: (examId, questionId) =>
        api.get(`/student/exams/${examId}/questions/${questionId}/recover`),

    deleteDraft: (examId, questionId) =>
        api.delete(`/student/exams/${examId}/questions/${questionId}/draft`),

    // Code Submission & Execution
    submitQuestion: (examId, questionId, languageId, sourceCode, stdin) =>
        api.post(`/student/exams/${examId}/questions/${questionId}/submit`, { languageId, sourceCode, stdin }),

    runCode: (language_id, source_code, stdin) =>
        api.post('/compiler/run', { language_id, source_code, stdin }),

    getSubmissionResult: (token) => api.get(`/compiler/status/${token}`),

    getLanguages: () => api.get('/compiler/languages'),

    // Results
    getExamResult: (examId) => api.get(`/student/exams/${examId}/result`),

    // Profile
    getProfile: () => api.get('/student/profile'),
    updateProfile: (data) => api.patch('/student/profile', data),
};

export default studentService;
