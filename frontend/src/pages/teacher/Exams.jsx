import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiFilter, FiSearch, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiChevronRight, FiBook } from 'react-icons/fi';
import teacherService from '../../services/teacherService';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const TeacherExams = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [filterClass, setFilterClass] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const classesRes = await teacherService.getClasses();
            const classesData = classesRes.data?.classes || classesRes.data || [];
            setClasses(classesData);

            // Fetch exams for all classes
            const examsPromises = classesData.map(cls =>
                teacherService.getClassExams(cls._id).catch(err => ({ data: [] }))
            );

            const examsResponses = await Promise.all(examsPromises);

            // Flatten and format exams
            let allExams = [];
            examsResponses.forEach((res, index) => {
                const classExams = res.data?.exams || res.data || [];
                // Add class info to each exam if not present
                const formattedExams = classExams.map(exam => ({
                    ...exam,
                    className: classesData[index].name,
                    classId: classesData[index]._id,
                    isPublished: exam.state === 'published' || exam.status === 'published'
                }));
                allExams = [...allExams, ...formattedExams];
            });

            // Sort by date (newest first)
            allExams.sort((a, b) => new Date(b.startTime || b.createdAt) - new Date(a.startTime || a.createdAt));

            setExams(allExams);
        } catch (error) {
            console.error("Error fetching exams:", error);
            toast.error("Failed to load exams");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (examId) => {
        if (!window.confirm("Are you sure you want to publish this exam? Students will be able to see it.")) return;

        try {
            await teacherService.publishExam(examId);
            toast.success("Exam published successfully");

            // Update local state
            setExams(exams.map(exam =>
                exam._id === examId ? { ...exam, isPublished: true, status: 'published' } : exam
            ));
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to publish exam");
        }
    };

    const handleViewResults = (examId) => {
        // Navigate to results/evaluations page
        // Since we verify auto-evaluation routes, we can reuse that or a dedicated results page
        // For now, let's assume there's a results view or we'll direct to the auto-eval link
        // Based on routes: /teacher/exams/:examId/auto-evaluations
        // But maybe we don't have a UI for that yet? 
        // We will just show a toast for now or navigate if the route exists.
        // Actually, let's keep it simple: Navigate to evaluation page if exists, or show info.
        // There is 'Evaluations' link in sidebar -> /teacher/evaluations.
        // Maybe we just navigate to a details page?
        // Let's hold off on specific navigation and just reload for now, or maybe navigate to nothing.
        // Better: Navigate to a placeholder or alert.
        toast('Result view logic to be implemented', { icon: '🚧' });
    };

    const filteredExams = exams.filter(exam => {
        const matchesClass = filterClass === 'all' || exam.classId === filterClass;
        const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesClass && matchesSearch;
    });

    const getStatusColor = (status, isPublished) => {
        if (!isPublished) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        if (status === 'completed') return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        if (status === 'live') return 'bg-green-500/10 text-green-500 border-green-500/20';
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'; // Scheduled/Upcoming
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Exams</h1>
                    <p className="text-slate-600 dark:text-slate-400">Manage and monitor your class assessments</p>
                </div>
                <Link to="/teacher/exams/create">
                    <Button variant="primary" className="bg-neon-blue hover:bg-blue-600 border-none text-white shadow-lg shadow-blue-500/20">
                        <FiPlus className="mr-2" /> Create New Exam
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-neon-blue focus:border-neon-blue outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="md:w-64 relative">
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-neon-blue focus:border-neon-blue outline-none appearance-none transition-all"
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                        >
                            <option value="all">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Exams List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
                </div>
            ) : filteredExams.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredExams.map((exam) => (
                        <Card key={exam._id} className="p-0 overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-colors group bg-white dark:bg-slate-800">
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                                {/* Date/Time Box */}
                                <div className="flex md:flex-col items-center justify-center md:w-32 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shrink-0 gap-3 md:gap-1">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {new Date(exam.startTime).getDate()}
                                    </div>
                                    <div className="text-sm text-neon-blue font-medium uppercase tracking-wider">
                                        {new Date(exam.startTime).toLocaleString('default', { month: 'short' })}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden md:block">
                                        {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="text-xs font-mono text-neon-purple mb-1 block">
                                                {exam.className}
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-neon-blue transition-colors truncate">
                                                {exam.title}
                                            </h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(exam.status, exam.isPublished)}`}>
                                            {exam.isPublished ? (exam.status || 'PUBLISHED') : 'DRAFT'}
                                        </span>
                                    </div>

                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                                        {exam.description || "No description provided."}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <FiClock className="text-neon-cyan" />
                                            {exam.duration} mins
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FiAlertCircle className="text-orange-500 dark:text-orange-400" />
                                            {exam.totalMarks} Marks
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        {!exam.isPublished ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="hover:text-green-500 dark:hover:text-green-400 hover:border-green-500/50"
                                                onClick={() => handlePublish(exam._id)}
                                            >
                                                <FiCheckCircle className="mr-2" /> Publish Now
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewResults(exam._id)}
                                            >
                                                View Results
                                            </Button>
                                        )}
                                        {/* Additional actions like Edit can go here */}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="bg-slate-100 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiBook className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No exams found</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                        You haven't created any exams yet, or they don't match your search filters.
                    </p>
                    <Link to="/teacher/exams/create">
                        <Button variant="primary">
                            Create First Exam
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default TeacherExams;
