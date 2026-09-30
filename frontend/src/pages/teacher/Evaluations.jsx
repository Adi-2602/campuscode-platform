import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiBarChart2, FiCheckCircle, FiClock, FiAlertCircle, FiSend } from 'react-icons/fi';
import teacherService from '../../services/teacherService';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const TeacherEvaluations = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const classesRes = await teacherService.getClasses();
            const classesData = classesRes.data?.classes || classesRes.data || [];

            // Fetch exams for all classes
            const examsPromises = classesData.map(cls =>
                teacherService.getClassExams(cls._id).catch(err => ({ data: [] }))
            );

            const examsResponses = await Promise.all(examsPromises);

            let allExams = [];
            examsResponses.forEach((res, index) => {
                const classExams = res.data?.exams || res.data || [];
                // Add class info
                const formattedExams = classExams.map(exam => ({
                    ...exam,
                    className: classesData[index].name,
                    classId: classesData[index]._id
                }));
                allExams = [...allExams, ...formattedExams];
            });

            // Filter for exams that are at least published, or maybe only those with submissions?
            // For now, show all published exams as they are candidates for evaluation.
            const evaluatableExams = allExams.filter(e => e.isPublished);

            // Fetch basic stats for each exam (optional, but good for UI)
            // We can fetch stats lazily or just show the list first. 
            // Let's just show the list for now to keep it fast.

            // Sort by most recent
            evaluatableExams.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

            setExams(evaluatableExams);
        } catch (error) {
            console.error("Error fetching evaluations:", error);
            toast.error("Failed to load evaluations");
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
        // Custom status logic could go here
        return matchesSearch;
    });

    const handleViewReport = (examId) => {
        // Placeholder for detailed report view
        // In the future, this should navigate to /teacher/exams/:examId/report or /auto-evaluations
        toast('Detailed report view coming soon', { icon: '📊' });
        // Could also trigger the auto-eval stats modal if we implemented it
    };

    const handlePublishResults = async (examId) => {
        if (!window.confirm("Are you sure you want to publish results for this exam? Students will be able to see their scores immediately.")) {
            return;
        }

        try {
            const loadingToast = toast.loading("Publishing results...");
            await teacherService.publishResults(examId);
            toast.dismiss(loadingToast);
            toast.success("Results published successfully!");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to publish results");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Evaluations & Results</h1>
                <p className="text-slate-600 dark:text-slate-400">Track student performance and exam statistics</p>
            </div>

            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex gap-4">
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
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
                </div>
            ) : filteredExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => (
                        <Card key={exam._id} className="p-6 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex flex-col h-full bg-white dark:bg-slate-800">
                            <div className="mb-4">
                                <span className="text-xs font-mono text-neon-purple mb-1 block">
                                    {exam.className}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1" title={exam.title}>
                                    {exam.title}
                                </h3>
                                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <FiCalendar /> {new Date(exam.startTime).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                                    <div className="text-xs text-slate-500 mb-1">Total Marks</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">{exam.totalMarks}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                                    <div className="text-xs text-slate-500 mb-1">Items</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">{exam.questions?.length || 0}</div>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-center group hover:border-neon-cyan hover:text-neon-cyan"
                                    onClick={() => handleViewReport(exam._id)}
                                >
                                    <FiBarChart2 className="mr-2 group-hover:scale-110 transition-transform" /> View Analytics
                                </Button>
                                <Button
                                    variant="primary"
                                    className="w-full justify-center bg-neon-purple border-none hover:bg-purple-600"
                                    onClick={() => handlePublishResults(exam._id)}
                                >
                                    <FiSend className="mr-2" /> Publish Results
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="bg-slate-100 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCheckCircle className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No evaluations found</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Once you publish exams, they will appear here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TeacherEvaluations;
