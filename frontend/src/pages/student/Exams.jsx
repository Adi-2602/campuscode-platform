import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import studentService from '../../services/studentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { FiClock, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const StudentExams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                // 1. Get all classes the student is enrolled in
                const classesResponse = await studentService.getAllClasses();
                console.log('Classes Response:', classesResponse); // Debugging

                let classes = [];
                if (Array.isArray(classesResponse.data)) {
                    classes = classesResponse.data;
                } else if (classesResponse.data && Array.isArray(classesResponse.data.classes)) {
                    classes = classesResponse.data.classes;
                } else if (classesResponse.data && Array.isArray(classesResponse.data.data)) {
                    classes = classesResponse.data.data;
                }

                if (!classes) classes = [];

                // 2. Fetch exams for each class
                const examsPromises = classes.map(cls =>
                    studentService.getClassExams(cls.id).catch(err => {
                        console.error(`Failed to fetch exams for class ${cls.id}`, err);
                        return { data: [] }; // Return empty array on failure
                    })
                );

                const examsResponses = await Promise.all(examsPromises);

                // 3. Aggregate all exams
                const allExams = examsResponses.flatMap(res => res.data || []);

                // Remove duplicates if any (based on ID)
                const uniqueExams = Array.from(new Map(allExams.map(exam => [exam.id, exam])).values());

                setExams(uniqueExams);
            } catch (error) {
                console.error('Failed to fetch exams:', error);
                toast.error('Failed to load exams');
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse">Loading exams...</div>;
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Exams</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">View and take your scheduled assessments</p>
            </motion.div>

            {exams.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiFileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Exams Found</h3>
                    <p className="text-slate-500 mt-2">You don't have any exams scheduled at the moment.</p>
                    <Link to="/student/classes" className="mt-6 inline-block">
                        <Button variant="primary">Browse Classes</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam, index) => (
                        <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full flex flex-col hover:shadow-neon-blue/20 border-t-4 border-t-neon-blue">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{exam.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        <FiClock />
                                        <span>{exam.duration} mins</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <FiAlertCircle className={exam.status === 'active' ? 'text-green-500' : 'text-slate-500'} />
                                        <span className="capitalize">{exam.status || 'Scheduled'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-800">
                                    <Link to={`/student/exam/${exam.id}`}>
                                        <Button className="w-full bg-neon-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                                            Start Exam
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentExams;
