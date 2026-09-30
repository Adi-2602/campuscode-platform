import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Student Pages
import ExamInterface from './pages/student/ExamInterface';
import StudentClasses from './pages/student/Classes';
import StudentExams from './pages/student/Exams';
import StudentResults from './pages/student/Results';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import CreateExam from './pages/teacher/CreateExam';
import QuestionBank from './pages/teacher/QuestionBank';
import TeacherClasses from './pages/teacher/Classes';
import TeacherExams from './pages/teacher/Exams';
import TeacherEvaluations from './pages/teacher/Evaluations';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminMonitoring from './pages/admin/Monitoring';
import AdminScheduleTimeSetup from './pages/admin/SystemSetup';
import AdminUserManagement from './pages/admin/UserManagement';
import AdminDatabase from './pages/admin/Database';
import AdminNotifications from './pages/admin/Notifications';
import AdminReports from './pages/admin/Reports';
import AdminDataUpload from './pages/admin/DataUpload';

// Placeholder Components
const StudentDashboard = () => <div className="p-8 text-center text-neon-cyan text-2xl">Student Dashboard</div>;
const Unauthorized = () => <div className="p-8 text-center text-red-500 text-2xl">403 - Access Denied</div>;

import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-sans selection:bg-neon-blue selection:text-white transition-colors duration-300">
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />

              <Routes>
                <Route path="/" element={
                  <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                    <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan bg-clip-text text-transparent animate-pulse relative z-10">
                      Online Exam System
                    </h1>

                    <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center space-y-6 relative z-10 border-neon-blue/30 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                      <p className="text-slate-300 text-lg">
                        Next-Gen Assessment Platform with Judge0 Integration
                      </p>
                      <div className="flex justify-center gap-4">
                        <a href="/login" className="btn-primary py-3 px-8 rounded-lg shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all">
                          Login
                        </a>
                        <a href="/register" className="btn-outline py-3 px-8 rounded-lg transform hover:scale-105 transition-all">
                          Register
                        </a>
                      </div>
                    </div>
                  </div>
                } />

                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/403" element={<Unauthorized />} />

                {/* Protected Routes wrapped in DashboardLayout */}
                <Route element={<DashboardLayout />}>

                  {/* Student Routes */}
                  <Route path="/student/dashboard" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/student/exams" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentExams />
                    </ProtectedRoute>
                  } />
                  <Route path="/student/results" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentResults />
                    </ProtectedRoute>
                  } />
                  <Route path="/student/classes" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentClasses />
                    </ProtectedRoute>
                  } />
                  <Route path="/student/exam/:examId" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <ExamInterface />
                    </ProtectedRoute>
                  } />

                  {/* Teacher Routes */}
                  <Route path="/teacher/dashboard" element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/teacher/classes" element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <TeacherClasses />
                    </ProtectedRoute>
                  } />
                  <Route path="/teacher/exams" element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <TeacherExams />
                    </ProtectedRoute>
                  } />
                  <Route path="/teacher/exams/create" element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <CreateExam />
                    </ProtectedRoute>
                  } />
                  <Route path="/teacher/questions" element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <QuestionBank />
                    </ProtectedRoute>
                  } />
                  <Route path="/teacher/evaluations" element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <TeacherEvaluations />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/monitoring" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminMonitoring initialTab="realtime" />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/database" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminDatabase />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/setup" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminScheduleTimeSetup />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminUserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/notifications" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminNotifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/upload" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminDataUpload />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Catch all - 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
