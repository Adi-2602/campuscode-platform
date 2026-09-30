import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { FiPlus, FiBook, FiCalendar, FiUsers, FiClock, FiCode } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import { toast } from 'react-hot-toast';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        activeExams: 0,
        totalStudents: 0,
        pendingEvaluations: 0,
        todayClassesCount: 0
    });

    const [upcomingClasses, setUpcomingClasses] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch data using safer endpoints to avoid backend route collisions
            // /teacher/classes (List) instead of /teacher/classes/all
            // /teacher/schedule/weekly instead of /teacher/classes/upcoming
            const [classesRes, scheduleRes] = await Promise.allSettled([
                teacherService.getClasses(),
                teacherService.getWeeklySchedule()
            ]);

            // Process Classes to Count Students
            let totalStudentsCount = 0;
            if (classesRes.status === 'fulfilled') {
                const classesResponse = classesRes.value.data;
                const classes = Array.isArray(classesResponse)
                    ? classesResponse
                    : (classesResponse?.classes || []);

                totalStudentsCount = classes.reduce((acc, cls) => acc + (cls.students?.length || 0), 0);
            }

            // Process Weekly Schedule to find "Today's" classes provided by the backend or derived
            let todayClasses = [];
            if (scheduleRes.status === 'fulfilled') {
                const scheduleData = scheduleRes.value.data;

                // The backend /schedule/weekly usually returns { schedule: { Monday: [], ... }, currentDay: {...} }
                // Use 'currentDay' if available, otherwise filter from 'schedule'
                if (scheduleData?.currentDay) {
                    // Normalize structure if needed
                    const currentDayData = scheduleData.currentDay; // Could be object or array
                    if (Array.isArray(currentDayData)) {
                        todayClasses = currentDayData;
                    } else if (typeof currentDayData === 'object') {
                        // Sometimes it returns { day: 'Monday', classes: [] }
                        todayClasses = currentDayData.classes || [];
                    }
                } else if (scheduleData?.schedule) {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = days[new Date().getDay()];
                    todayClasses = scheduleData.schedule[dayName] || [];
                }

                // Format for UI
                const formattedClasses = todayClasses.map(cls => ({
                    ...cls,
                    id: cls._id || Math.random(),
                    name: cls.subject?.name || cls.className || "Class",
                    time: `${cls.startTime} - ${cls.endTime}`,
                    room: cls.room || 'Online'
                }));

                setUpcomingClasses(formattedClasses.slice(0, 3));

                setStats(prev => ({
                    ...prev,
                    activeExams: 0,
                    totalStudents: totalStudentsCount,
                    pendingEvaluations: 0,
                    todayClassesCount: formattedClasses.length
                }));
            }

        } catch (error) {
            console.error("Dashboard data fetch error:", error);
            // Don't toast error here to avoid annoyance if just one fails, 
            // since we have 500s on some other endpoints the user might have seen.
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Teacher Dashboard
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Welcome back, <span className="text-neon-purple font-semibold">{user?.name}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/teacher/exams/create">
                        <Button variant="primary" className="bg-neon-purple hover:bg-purple-600 border-none">
                            <FiPlus className="mr-2" /> Create Exam
                        </Button>
                    </Link>
                    <Link to="/teacher/questions">
                        <Button variant="outline">
                            <FiCode className="mr-2" /> Question Bank
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Active Exams', value: stats.activeExams, icon: FiClock, color: 'text-neon-cyan', border: 'border-neon-cyan/30' },
                            { label: 'Total Students', value: stats.totalStudents, icon: FiUsers, color: 'text-neon-blue', border: 'border-neon-blue/30' },
                            { label: 'Pending Evaluations', value: stats.pendingEvaluations, icon: FiBook, color: 'text-neon-yellow', border: 'border-neon-yellow/30' },
                            { label: 'Classes Today', value: stats.todayClassesCount, icon: FiCalendar, color: 'text-neon-purple', border: 'border-neon-purple/30' },
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className={`hover:scale-105 transition-transform ${stat.border}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</p>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Upcoming Classes */}
                        <Card className="lg:col-span-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <FiCalendar className="text-neon-purple" /> Today's Schedule
                            </h3>
                            <div className="space-y-4">
                                {upcomingClasses.length > 0 ? (
                                    upcomingClasses.map((cls, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-neon-purple transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <span className="text-neon-purple font-bold text-lg">
                                                        {cls.time ? cls.time.split('-')[0].trim() : '00:00'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                                                        Start
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{cls.name || cls.subjectName}</h4>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        {cls.room || 'Online'}
                                                        <span className="mx-1">•</span>
                                                        {cls.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="secondary">Start Class</Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">No classes scheduled for today.</p>
                                )}
                            </div>
                        </Card>

                        {/* Quick Actions / Notifications */}
                        <div className="space-y-6">
                            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border-indigo-200 dark:border-indigo-500/30">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Exam Evaluation</h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                    Check for pending student submissions.
                                </p>
                                <Button
                                    className="w-full bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                                    onClick={() => navigate('/teacher/evaluations')}
                                >
                                    Review Submissions
                                </Button>
                            </Card>

                            <Card>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recent Question Bank Updates</h3>
                                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                    <li className="flex items-center gap-2">
                                        <FiPlus className="text-green-500 dark:text-green-400" /> Added "Binary Tree Traversal"
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <FiPlus className="text-green-500 dark:text-green-400" /> Added "Graph DFS"
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <FiBook className="text-blue-500 dark:text-blue-400" /> Updated "Linked List Cycle"
                                    </li>
                                </ul>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherDashboard;
