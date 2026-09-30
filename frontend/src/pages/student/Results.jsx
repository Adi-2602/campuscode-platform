import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import studentService from '../../services/studentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { FiActivity, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                // 1. Get all classes
                const classesResponse = await studentService.getAllClasses();
                const classesData = classesResponse.data;

                let classes = [];
                if (Array.isArray(classesData)) {
                    classes = classesData;
                } else if (classesData && Array.isArray(classesData.classes)) {
                    classes = classesData.classes;
                } else if (classesData && Array.isArray(classesData.data)) {
                    classes = classesData.data;
                }

                if (!classes) classes = [];

                // 2. Fetch exams for each class to find completed ones
                // Note: ideally there would be a specific API for "my local results"
                // For now, we'll fetch exams and check if they have a score/submission
                const examsPromises = classes.map(cls =>
                    studentService.getClassExams(cls.id).catch(() => ({ data: [] }))
                );

                const examsResponses = await Promise.all(examsPromises);
                const allExams = examsResponses.flatMap(res => res.data || []);
                const uniqueExams = Array.from(new Map(allExams.map(exam => [exam.id, exam])).values());

                // Filter for exams that are likely completed or have results
                // This logic depends on the backend. For now, we mock the result fetching behavior 
                // by checking getting individual exam result if the exam is closed or submitted.
                // Since we don't have a bulk "get all results" API, we might need to fetch individually
                // or just show the exams that are 'completed'.

                // For this demo/MVP, we'll assume completed exams have results.
                // Real implementation would utilize a specific endpoint like /student/results

                const completedExams = uniqueExams.filter(exam => exam.status === 'completed' || exam.status === 'closed');

                // Fetch results for these exams
                const resultsPromises = completedExams.map(exam =>
                    studentService.getExamResult(exam.id).then(res => ({
                        ...res.data,
                        examTitle: exam.title,
                        examId: exam.id
                    })).catch(err => null)
                );

                const resultsData = await Promise.all(resultsPromises);
                setResults(resultsData.filter(r => r !== null));

            } catch (error) {
                console.error('Failed to fetch results:', error);
                // toast.error('Failed to load results');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse">Loading results...</div>;
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Exam Results</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Performance history and feedback</p>
            </motion.div>

            {results.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiActivity className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Results Yet</h3>
                    <p className="text-slate-500 mt-2">Complete exams to see your performance here.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {results.map((result, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{result.examTitle}</h3>
                                    <p className="text-sm text-slate-500">Submitted on: {new Date(result.submittedAt || Date.now()).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-neon-blue">{result.score || 0}%</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${params => result.score >= 50 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {result.score >= 50 ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentResults;
