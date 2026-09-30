import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
    FiActivity, FiSettings, FiUsers, FiServer, FiDatabase,
    FiCpu, FiBookOpen, FiExternalLink, FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import adminService from '../../services/adminService';
import clsx from 'clsx';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [recentActivity, setRecentActivity] = useState([]);
    const [performance, setPerformance] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Classes Drill-down State
    const [showClassModal, setShowClassModal] = useState(false);
    const [allClasses, setAllClasses] = useState([]);
    const [filteredClasses, setFilteredClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);

    // Student List Modal State
    const [showStudentListModal, setShowStudentListModal] = useState(false);
    const [selectedClassStudents, setSelectedClassStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedClassForList, setSelectedClassForList] = useState(null);

    // Class Filters
    const [filterBatch, setFilterBatch] = useState('All');
    const [filterSection, setFilterSection] = useState('All');
    const [filterGroup, setFilterGroup] = useState('All');

    const fetchDashboardData = async () => {
        try {
            // Parallel data fetching for dashboard
            const [dashboardRes, activityRes, leaderboardRes] = await Promise.all([
                adminService.getDashboardAnalytics(),
                adminService.getSubmissionTrends({ period: 'daily', days: 7 }),
                adminService.getLeaderboard({ limit: 5 })
            ]);

            setStats(dashboardRes.data?.dashboard?.systemStats);
            setRecentActivity(activityRes.data?.trends || []);
            setLeaderboard(leaderboardRes.data?.leaderboard || []);

        } catch (error) {
            console.error("Failed to fetch dashboard analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = allClasses;

        if (filterBatch !== 'All') {
            result = result.filter(cls => cls.batch === parseInt(filterBatch));
        }
        if (filterSection !== 'All') {
            result = result.filter(cls => cls.section === filterSection);
        }
        if (filterGroup !== 'All') {
            result = result.filter(cls => cls.group === parseInt(filterGroup));
        }

        setFilteredClasses(result);
    }, [allClasses, filterBatch, filterSection, filterGroup]);

    const fetchStudentsForClass = async (cls) => {
        setLoadingStudents(true);
        setSelectedClassForList(cls);
        setShowStudentListModal(true);
        try {
            // Fetch students matching the class criteria
            const params = {
                role: 'student',
                limit: 100 // Reasonable limit for a single class view
            };

            if (cls.batch) params.batch = cls.batch;
            if (cls.section) params.section = cls.section;
            if (cls.group) params.group = cls.group;

            const res = await adminService.getAllStudents(params);
            setSelectedClassStudents(res.data?.students || []);
        } catch (error) {
            console.error("Failed to fetch students for class", error);
            setSelectedClassStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchAllActiveClasses = async () => {
        setLoadingClasses(true);
        setShowClassModal(true);
        try {
            const res = await adminService.getAllClasses({ limit: 100 });
            setAllClasses(res.data?.classes || []);
            setFilteredClasses(res.data?.classes || []); // Initialize filtered list
        } catch (error) {
            console.error("Failed to fetch all classes", error);
            setAllClasses([]);
            setFilteredClasses([]);
        } finally {
            setLoadingClasses(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const sections = [
        {
            title: 'System Monitoring',
            description: 'Real-time infrastructure health, logs, and active sessions.',
            icon: FiActivity,
            link: '/admin/monitoring',
            color: 'text-neon-blue',
            border: 'border-neon-blue/30',
            bg: 'bg-neon-blue/10'
        },
        {
            title: 'User Management',
            description: 'Manage students, teachers, and admins permissions.',
            icon: FiUsers,
            link: '/admin/users',
            color: 'text-neon-purple',
            border: 'border-neon-purple/30',
            bg: 'bg-neon-purple/10'
        },
        {
            title: 'Schedule Time Setup',
            description: 'Configure semesters, lab slots, and class schedules.',
            icon: FiSettings,
            link: '/admin/setup',
            color: 'text-neon-cyan',
            border: 'border-neon-cyan/30',
            bg: 'bg-neon-cyan/10'
        }
    ];

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Admin Console
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Welcome back, <span className="text-neon-blue font-semibold">{user?.name}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm border border-green-500/20 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        System Operational
                    </span>
                </div>
            </motion.div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((section, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link to={section.link}>
                            <Card
                                hover
                                className={`h-full border ${section.border} group transition-all duration-300 bg-white dark:bg-slate-800/40`}
                            >
                                <div className={`w-14 h-14 rounded-xl ${section.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <section.icon className={`w-8 h-8 ${section.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{section.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">{section.description}</p>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Analytics Stats Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex items-center gap-4 bg-gray-100 dark:bg-slate-800/50">
                    <FiUsers className="w-8 h-8 text-slate-500" />
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Total Students</p>
                        <p className="text-2xl font-mono text-slate-900 dark:text-white">
                            {loading ? '...' : (stats?.users?.students || 0)}
                        </p>
                    </div>
                </Card>
                <Card
                    hover
                    onClick={fetchAllActiveClasses}
                    className="flex items-center gap-4 bg-gray-100 dark:bg-sky-500/10 border-sky-500/20 cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FiBookOpen className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Active Classes</p>
                        <p className="text-2xl font-mono text-slate-900 dark:text-white">
                            {loading ? '...' : (stats?.classes || 0)}
                        </p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-gray-100 dark:bg-slate-800/50">
                    <FiDatabase className="w-8 h-8 text-slate-500" />
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Exams Conducted</p>
                        <p className="text-2xl font-mono text-slate-900 dark:text-white">
                            {loading ? '...' : (stats?.exams || 0)}
                        </p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-gray-100 dark:bg-slate-800/50">
                    <FiActivity className="w-8 h-8 text-slate-500" />
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Submissions</p>
                        <p className="text-2xl font-mono text-slate-900 dark:text-white">
                            {loading ? '...' : (stats?.submissions || 0)}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Recent Activity & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Chart / List */}
                <Card className="border-gray-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Submission Trends (Last 7 Days)</h3>
                    {loading ? (
                        <div className="h-48 flex items-center justify-center text-slate-500">Loading...</div>
                    ) : recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {/* Simple Bar Chart Visualization */}
                            <div className="flex items-end justify-between h-40 gap-2">
                                {recentActivity.map((item, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 group w-full">
                                        <div
                                            className="w-full bg-neon-blue/20 hover:bg-neon-blue/40 rounded-t transition-all relative group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                            style={{ height: `${Math.max(10, item.count * 5)}px` }} // scale height
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {item.count} submissions
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500 rotate-0 sm:rotate-45 sm:mt-2">{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-500">No recent activity</div>
                    )}
                </Card>

                {/* Leaderboard */}
                <Card className="border-gray-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Top Performing Students</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-500 border-b border-gray-200 dark:border-slate-800">
                                <tr>
                                    <th className="pb-3 pl-2">Rank</th>
                                    <th className="pb-3">Student</th>
                                    <th className="pb-3 text-right">Avg Score</th>
                                    <th className="pb-3 text-right">Exams</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-3 pl-2"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                                            <td className="py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                                            <td className="py-3"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                                            <td className="py-3"><div className="h-4 w-6 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : leaderboard.length > 0 ? (
                                    leaderboard.map((student, i) => (
                                        <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 pl-2 font-mono text-neon-yellow">#{student.rank}</td>
                                            <td className="py-3">
                                                <div className="font-medium text-slate-900 dark:text-slate-200">{student.studentName}</div>
                                                <div className="text-xs text-slate-500">{student.studentRollNo}</div>
                                            </td>
                                            <td className="py-3 text-right font-bold text-green-500">{student.averagePercentage}%</td>
                                            <td className="py-3 text-right text-slate-500">{student.totalExams}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-500">No data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Active Classes Detail Modal */}
            <Modal
                isOpen={showClassModal}
                onClose={() => setShowClassModal(false)}
                title="Active Classes Detailed View"
                size="xl"
            >
                <div className="space-y-4">
                    {/* Filters Header */}
                    <div className="flex flex-wrap gap-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg items-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filters:</span>

                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-sm dark:text-white"
                        >
                            <option value="All">All Batches</option>
                            <option value="1">Batch 1</option>
                            <option value="2">Batch 2</option>
                        </select>

                        <select
                            value={filterSection}
                            onChange={(e) => setFilterSection(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-sm dark:text-white"
                        >
                            <option value="All">All Sections</option>
                            {/* Dynamically get sections from current data if possible, else static common ones */}
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'].map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            ))}
                        </select>

                        <select
                            value={filterGroup}
                            onChange={(e) => setFilterGroup(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-sm dark:text-white"
                        >
                            <option value="All">All Groups</option>
                            <option value="1">Group 1</option>
                            <option value="2">Group 2</option>
                        </select>

                        <div className="ml-auto text-xs text-slate-500">
                            Showing {filteredClasses.length} class(es)
                        </div>
                    </div>

                    {loadingClasses ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <FiRefreshCw className="w-10 h-10 animate-spin text-neon-blue" />
                            <p className="animate-pulse">Fetching class details...</p>
                        </div>
                    ) : filteredClasses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredClasses.map((cls) => (
                                <Card
                                    key={cls._id}
                                    className="border-slate-800 bg-slate-800/20 hover:border-neon-blue transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">{cls.name}</h4>
                                            <p className="text-xs text-neon-blue font-mono uppercase tracking-wider">{cls.code}</p>
                                        </div>
                                        <div className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                                            cls.isLocked
                                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                : "bg-green-500/10 text-green-400 border-green-500/20"
                                        )}>
                                            {cls.isLocked ? 'LOCKED' : 'ACTIVE'}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-2">
                                            <div className="bg-slate-900/40 p-1.5 rounded border border-slate-700/30">
                                                <span className="block text-[10px] text-slate-500">BATCH</span>
                                                <span className="font-mono text-white">{cls.batch || '-'}</span>
                                            </div>
                                            <div className="bg-slate-900/40 p-1.5 rounded border border-slate-700/30">
                                                <span className="block text-[10px] text-slate-500">SECTION</span>
                                                <span className="font-mono text-white">{cls.section || '-'}</span>
                                            </div>
                                            <div className="bg-slate-900/40 p-1.5 rounded border border-slate-700/30">
                                                <span className="block text-[10px] text-slate-500">GROUP</span>
                                                <span className="font-mono text-white">{cls.group || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/30 p-3 rounded border border-slate-700/30 space-y-2">
                                            <div className="flex flex-col text-sm text-slate-400">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Main Faculty</span>
                                                <span className="text-white font-medium">{cls.mainFaculty?.facultyName || cls.createdBy?.name || 'Unassigned'}</span>
                                            </div>

                                            {cls.coFaculties && cls.coFaculties.length > 0 && (
                                                <div className="flex flex-col text-sm text-slate-400 pt-2 border-t border-slate-700/30">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500">Co-Faculty</span>
                                                    <span className="text-sky-300">
                                                        {cls.coFaculties.map(f => f.facultyName).join(", ")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <div
                                                className="bg-slate-900/50 p-2 rounded text-center border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition-colors group/students"
                                                onClick={() => fetchStudentsForClass(cls)}
                                            >
                                                <span className="block text-lg font-bold text-white group-hover/students:text-neon-blue transition-colors">{cls.studentCount || 0}</span>
                                                <span className="text-[10px] text-slate-500 uppercase">Students</span>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded text-center border border-slate-700/50">
                                                <span className="block text-lg font-bold text-white">{cls.examCount || 0}</span>
                                                <span className="text-[10px] text-slate-500 uppercase">Exams</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        fullWidth
                                        size="sm"
                                        className="gap-2 border-neon-blue/30 hover:bg-neon-blue/10 text-neon-blue"
                                        onClick={() => navigate('/admin/monitoring')}
                                    >
                                        <FiExternalLink className="w-3 h-3" /> View Monitoring
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-500">
                            <FiBookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No active classes found match your filters.</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Student List Detail Modal */}
            <Modal
                isOpen={showStudentListModal}
                onClose={() => setShowStudentListModal(false)}
                title={`Enrolled Students - ${selectedClassForList?.name || 'Class'}`}
                size="lg"
            >
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-500 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <tr>
                                <th className="pb-3 pl-2">#</th>
                                <th className="pb-3">Student Name</th>
                                <th className="pb-3">RA Number</th>
                                <th className="pb-3 text-center">Batch</th>
                                <th className="pb-3 text-center">Section</th>
                                <th className="pb-3 text-center">Group</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loadingStudents ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-500">
                                        <FiRefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-neon-blue" />
                                        Loading students...
                                    </td>
                                </tr>
                            ) : selectedClassStudents.length > 0 ? (
                                selectedClassStudents.map((student, i) => (
                                    <tr key={student._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3 pl-2 text-slate-500">{i + 1}</td>
                                        <td className="py-3 font-medium text-slate-900 dark:text-slate-200">
                                            {student.studentName || student.name}
                                        </td>
                                        <td className="py-3 font-mono text-neon-blue">
                                            {student.registrationNumber || '-'}
                                        </td>
                                        <td className="py-3 text-center text-slate-500">{student.batch}</td>
                                        <td className="py-3 text-center text-slate-500">{student.section}</td>
                                        <td className="py-3 text-center text-slate-500">{student.group}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-500">
                                        No students found matching this criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => setShowStudentListModal(false)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
