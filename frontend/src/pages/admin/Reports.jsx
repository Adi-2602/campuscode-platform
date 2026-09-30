import { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiUser, FiBook, FiUsers, FiAward } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';

const AdminReports = () => {
    const [activeTab, setActiveTab] = useState('student');
    const [loading, setLoading] = useState(false);

    // Form States
    const [studentId, setStudentId] = useState('');
    const [examId, setExamId] = useState('');
    const [classId, setClassId] = useState('');
    const [teacherId, setTeacherId] = useState('');

    const handleGenerateReport = async (type) => {
        setLoading(true);
        try {
            let res;
            let filename = 'report.pdf';

            switch (type) {
                case 'student':
                    if (!studentId) { toast.error("Student ID is required"); return; }
                    res = await adminService.generateStudentReport({ studentId });
                    filename = `student_report_${studentId}.pdf`;
                    break;
                case 'exam':
                    if (!examId) { toast.error("Exam ID is required"); return; }
                    res = await adminService.generateExamReport({ examId });
                    filename = `exam_report_${examId}.pdf`;
                    break;
                case 'class':
                    if (!classId) { toast.error("Class ID is required"); return; }
                    res = await adminService.generateClassReport({ classId });
                    filename = `class_report_${classId}.pdf`;
                    break;
                case 'teacher':
                    if (!teacherId) { toast.error("Teacher ID is required"); return; }
                    res = await adminService.generateTeacherReport({ teacherId });
                    filename = `teacher_report_${teacherId}.pdf`;
                    break;
                default:
                    return;
            }

            // Create blob and download
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Report successfully generated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate report. Check IDs and try again.');
        } finally {
            setLoading(false);
        }
    };

    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState('');

    useEffect(() => {
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        try {
            const res = await adminService.getAllSemesters();
            const sems = res.data?.semesters || res.data || [];
            setSemesters(sems);
            if (sems.length > 0) setSelectedSemester(sems[0]._id);
        } catch (error) {
            console.error("Failed to fetch semesters", error);
        }
    };

    const handleExportCSV = async (exportType) => {
        if (!selectedSemester) {
            toast.error("Please select a semester");
            return;
        }
        setLoading(true);
        try {
            let res;
            let filename = `${exportType}_${selectedSemester}.csv`;

            switch (exportType) {
                case 'enrollment':
                    res = await adminService.exportEnrollmentCSV(selectedSemester);
                    break;
                case 'teachers':
                    res = await adminService.exportTeachersCSV(selectedSemester);
                    break;
                case 'students':
                    res = await adminService.exportStudentsCSV(selectedSemester);
                    break;
                case 'lab-utilization':
                    res = await adminService.exportLabUtilizationCSV(selectedSemester);
                    break;
                default:
                    return;
            }

            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`${exportType} exported successfully`);
        } catch (error) {
            console.error(error);
            toast.error(`Failed to export ${exportType}`);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'student', label: 'Student Performance', icon: FiUser },
        { id: 'exam', label: 'Exam Analysis', icon: FiAward },
        { id: 'class', label: 'Class Performance', icon: FiUsers },
        { id: 'teacher', label: 'Teacher Activity', icon: FiBook },
        { id: 'exports', label: 'Data Exports (CSV)', icon: FiDownload },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <FiFileText className="text-neon-cyan" /> Reports & Analytics
            </h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 border-b-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'border-neon-cyan text-neon-cyan'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Active Tab */}
            <Card className="max-w-2xl mx-auto p-8 mt-8 bg-white dark:bg-slate-800 border dark:border-slate-700">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiDownload className="w-8 h-8 text-neon-cyan" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {activeTab === 'exports' ? 'Export Data (CSV)' : 'Generate PDF Report'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {activeTab === 'exports'
                            ? 'Select a semester and choose the data you want to export.'
                            : 'Enter the required ID to generate a comprehensive analysis report.'}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* ID Inputs for PDF Reports */}
                    {activeTab === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Student ID</label>
                            <input
                                type="text"
                                placeholder="Enter Student ID (e.g. 64f2...)"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-neon-cyan outline-none"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'exam' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Exam ID</label>
                            <input
                                type="text"
                                placeholder="Enter Exam ID (e.g. 64a1...)"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-neon-cyan outline-none"
                                value={examId}
                                onChange={(e) => setExamId(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'class' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Class ID</label>
                            <input
                                type="text"
                                placeholder="Enter Class ID (e.g. 64b8...)"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-neon-cyan outline-none"
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'teacher' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teacher ID</label>
                            <input
                                type="text"
                                placeholder="Enter Teacher ID (e.g. 64c9...)"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-neon-cyan outline-none"
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
                            />
                        </div>
                    )}

                    {/* CSV Export Section */}
                    {activeTab === 'exports' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Semester</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-neon-cyan outline-none"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map(sem => (
                                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <Button onClick={() => handleExportCSV('enrollment')} disabled={loading} variant="outline">
                                    Export Enrollment (CSV)
                                </Button>
                                <Button onClick={() => handleExportCSV('teachers')} disabled={loading} variant="outline">
                                    Export Teachers (CSV)
                                </Button>
                                <Button onClick={() => handleExportCSV('students')} disabled={loading} variant="outline">
                                    Export Students (CSV)
                                </Button>
                                <Button onClick={() => handleExportCSV('lab-utilization')} disabled={loading} variant="outline">
                                    Export Lab Utilization (CSV)
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'exports' && (
                        <Button
                            onClick={() => handleGenerateReport(activeTab)}
                            className="w-full bg-neon-cyan hover:bg-cyan-600 text-black font-bold py-3"
                            isLoading={loading}
                        >
                            <FiDownload className="mr-2" /> Download Report
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AdminReports;
