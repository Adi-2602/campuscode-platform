import { useState, useEffect } from 'react';
import { FiUpload, FiFileText, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiXCircle, FiMail } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';

const DataUpload = () => {
    const [stats, setStats] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [emailSendingId, setEmailSendingId] = useState(null);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [selectedUploadId, setSelectedUploadId] = useState(null);
    const [senderCredentials, setSenderCredentials] = useState({ email: '', password: '' });

    // Upload Form State
    const [uploadLoading, setUploadLoading] = useState(false);
    const [semesterId, setSemesterId] = useState('');
    const [files, setFiles] = useState({
        students: null,
        teachers: null,
        facultyEmails: null
    });
    const [semesters, setSemesters] = useState([]);

    useEffect(() => {
        fetchData();
        fetchSemesters();
    }, []);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const [statsRes, uploadsRes] = await Promise.all([
                adminService.getUploadStatistics(),
                adminService.getAllUploads({ limit: 10 })
            ]);
            setStats(statsRes.data);
            setUploads(uploadsRes.data.uploads || []);
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchSemesters = async () => {
        try {
            const res = await adminService.getAllSemesters();
            setSemesters(Array.isArray(res.data) ? res.data : (res.data?.semesters || []));
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!semesterId || !files.students || !files.teachers || !files.facultyEmails) {
            toast.error('Please select a semester and all 3 files');
            return;
        }

        const formData = new FormData();
        formData.append('semesterId', semesterId);
        formData.append('students', files.students);
        formData.append('teachers', files.teachers);
        formData.append('facultyEmails', files.facultyEmails);

        setUploadLoading(true);
        const toastId = toast.loading("Uploading and processing data...");

        try {
            const res = await adminService.uploadSemesterData(formData);
            const result = res.data.result;
            const stats = result.stats;

            toast.dismiss(toastId);
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <FiCheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-white">
                                    Upload Completed Successfully!
                                </p>
                                <div className="mt-1 text-sm text-slate-400 space-y-1">
                                    <p><strong>Students:</strong> {stats.studentsCreated} created, {stats.studentsUpdated} updated (Total: {stats.studentsTotal})</p>
                                    <p><strong>Teachers:</strong> {stats.teachersCreated} created, {stats.teachersUpdated} updated</p>
                                    <p><strong>Assignments:</strong> {stats.teachersValid} valid / {stats.teachersTotal} total</p>
                                    <p><strong>Classes:</strong> {stats.classesCreated} created</p>
                                    <p><strong>Enrollments:</strong> {stats.enrollmentsCreated} entries</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-slate-700">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ), { duration: 10000 });

            setFiles({ students: null, teachers: null, facultyEmails: null });
            fetchData();
        } catch (error) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploadLoading(false);
        }
    };

    const handleSendEmails = (uploadId) => {
        setSelectedUploadId(uploadId);
        setIsCredentialsModalOpen(true);
    };

    const handleConfirmSendEmails = async (e) => {
        if (e) e.preventDefault();
        if (!senderCredentials.email || !senderCredentials.password) {
            toast.error('Email and Password are required');
            return;
        }

        setEmailSendingId(selectedUploadId);
        setIsCredentialsModalOpen(false);

        try {
            await adminService.sendUploadEmails(selectedUploadId, senderCredentials);
            toast.success('Emails dispatched successfully');
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to send emails');
        } finally {
            setEmailSendingId(null);
            setSelectedUploadId(null);
            setSenderCredentials({ email: '', password: '' });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-500';
            case 'processing': return 'text-blue-500';
            case 'failed': return 'text-red-500';
            default: return 'text-slate-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <FiCheckCircle />;
            case 'processing': return <FiRefreshCw className="animate-spin" />;
            case 'failed': return <FiXCircle />;
            default: return <FiAlertCircle />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Data Upload</h1>
                <Button onClick={fetchData} variant="outline" size="sm" disabled={refreshing}>
                    <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <Card className="lg:col-span-1 h-fit">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FiUpload className="text-neon-cyan" /> New Upload
                    </h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Target Semester</label>
                            <select
                                className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                value={semesterId}
                                onChange={(e) => setSemesterId(e.target.value)}
                                required
                            >
                                <option value="">Select Semester</option>
                                {semesters.map(sem => (
                                    <option key={sem._id} value={sem._id}>{sem.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="p-3 border border-dashed border-slate-700 rounded bg-slate-800/50">
                            <label className="block text-sm text-neon-cyan mb-1 font-medium">1. Student Data (Fake.json)</label>
                            <input
                                type="file"
                                name="students"
                                accept=".json"
                                onChange={handleFileChange}
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20"
                                required
                            />
                        </div>

                        <div className="p-3 border border-dashed border-slate-700 rounded bg-slate-800/50">
                            <label className="block text-sm text-neon-cyan mb-1 font-medium">2. Teachers (FilteredTeachers.json)</label>
                            <input
                                type="file"
                                name="teachers"
                                accept=".json"
                                onChange={handleFileChange}
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20"
                                required
                            />
                        </div>

                        <div className="p-3 border border-dashed border-slate-700 rounded bg-slate-800/50">
                            <label className="block text-sm text-neon-cyan mb-1 font-medium">3. Faculty Emails (FacultyEmailMapping.json)</label>
                            <input
                                type="file"
                                name="facultyEmails"
                                accept=".json"
                                onChange={handleFileChange}
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full bg-neon-cyan hover:bg-cyan-600 border-none text-black font-bold"
                            disabled={uploadLoading}
                        >
                            {uploadLoading ? 'Uploading...' : 'Start Data Processing'}
                        </Button>
                    </form>
                </Card>

                {/* Upload History & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-4 bg-slate-800/50 border-slate-700">
                                <div className="text-slate-400 text-xs uppercase tracking-wider">Total Uploads</div>
                                <div className="text-2xl font-bold text-white">{stats.totalUploads || 0}</div>
                            </Card>
                            <Card className="p-4 bg-slate-800/50 border-slate-700">
                                <div className="text-slate-400 text-xs uppercase tracking-wider">Completed</div>
                                <div className="text-2xl font-bold text-green-400">{stats.completed || 0}</div>
                            </Card>
                            <Card className="p-4 bg-slate-800/50 border-slate-700">
                                <div className="text-slate-400 text-xs uppercase tracking-wider">Processing</div>
                                <div className="text-2xl font-bold text-blue-400">{stats.processing || 0}</div>
                            </Card>
                            <Card className="p-4 bg-slate-800/50 border-slate-700">
                                <div className="text-slate-400 text-xs uppercase tracking-wider">Failed</div>
                                <div className="text-2xl font-bold text-red-400">{stats.failed || 0}</div>
                            </Card>
                        </div>
                    )}

                    <Card>
                        <h3 className="text-lg font-bold text-white mb-4">Recent Uploads</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                        <th className="p-3">Semester</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {uploads.length > 0 ? uploads.map(upload => (
                                        <tr key={upload._id} className="hover:bg-slate-800/30">
                                            <td className="p-3 font-medium">{upload.semester?.name || upload.semester}</td>
                                            <td className="p-3">
                                                <div className={`flex items-center gap-2 ${getStatusColor(upload.status)}`}>
                                                    {getStatusIcon(upload.status)}
                                                    <span className="capitalize">{upload.status}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-slate-400">
                                                {new Date(upload.uploadedAt).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <button className="text-neon-cyan hover:text-cyan-300 text-sm flex items-center gap-1">
                                                        <FiFileText /> Report
                                                    </button>
                                                    {upload.status === 'completed' && !upload.credentialsSent && (
                                                        <button
                                                            disabled={emailSendingId === upload._id}
                                                            onClick={() => handleSendEmails(upload._id)}
                                                            className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            {emailSendingId === upload._id ? (
                                                                <FiRefreshCw className="animate-spin" />
                                                            ) : (
                                                                <FiMail />
                                                            )}
                                                            Send Emails
                                                        </button>
                                                    )}
                                                    {upload.credentialsSent && (
                                                        <span className="text-green-500 text-xs flex items-center gap-1">
                                                            <FiCheckCircle /> Notified
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                No uploads found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-slate-800/50 border-slate-700">
                        <div className="text-slate-400 text-xs uppercase tracking-wider">Total Uploads</div>
                        <div className="text-2xl font-bold text-white">{stats.totalUploads || 0}</div>
                    </Card>
                    <Card className="p-4 bg-slate-800/50 border-slate-700">
                        <div className="text-slate-400 text-xs uppercase tracking-wider">Completed</div>
                        <div className="text-2xl font-bold text-green-400">{stats.completed || 0}</div>
                    </Card>
                    <Card className="p-4 bg-slate-800/50 border-slate-700">
                        <div className="text-slate-400 text-xs uppercase tracking-wider">Processing</div>
                        <div className="text-2xl font-bold text-blue-400">{stats.processing || 0}</div>
                    </Card>
                    <Card className="p-4 bg-slate-800/50 border-slate-700">
                        <div className="text-slate-400 text-xs uppercase tracking-wider">Failed</div>
                        <div className="text-2xl font-bold text-red-400">{stats.failed || 0}</div>
                    </Card>
                </div>
            )}

            <Card>
                <h3 className="text-lg font-bold text-white mb-4">Recent Uploads</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                <th className="p-3">Semester</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {uploads.length > 0 ? uploads.map(upload => (
                                <tr key={upload._id} className="hover:bg-slate-800/30">
                                    <td className="p-3 font-medium">{upload.semester?.name || upload.semester}</td>
                                    <td className="p-3">
                                        <div className={`flex items-center gap-2 ${getStatusColor(upload.status)}`}>
                                            {getStatusIcon(upload.status)}
                                            <span className="capitalize">{upload.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-slate-400">
                                        {new Date(upload.uploadedAt).toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <button className="text-neon-cyan hover:text-cyan-300 text-sm flex items-center gap-1">
                                                <FiFileText /> Report
                                            </button>
                                            {upload.status === 'completed' && !upload.credentialsSent && (
                                                <button
                                                    disabled={emailSendingId === upload._id}
                                                    onClick={() => handleSendEmails(upload._id)}
                                                    className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {emailSendingId === upload._id ? (
                                                        <FiRefreshCw className="animate-spin" />
                                                    ) : (
                                                        <FiMail />
                                                    )}
                                                    Send Emails
                                                </button>
                                            )}
                                            {upload.credentialsSent && (
                                                <span className="text-green-500 text-xs flex items-center gap-1">
                                                    <FiCheckCircle /> Notified
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        No uploads found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Credentials Modal */}
            <Modal
                isOpen={isCredentialsModalOpen}
                onClose={() => setIsCredentialsModalOpen(false)}
                title="Sender Email Credentials"
                footer={(
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsCredentialsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleConfirmSendEmails} className="bg-neon-cyan border-none text-black font-bold">
                            Dispatch Emails
                        </Button>
                    </div>
                )}
            >
                <form onSubmit={handleConfirmSendEmails} className="space-y-4">
                    <p className="text-slate-400 text-sm mb-4">
                        Please provide the SMTP credentials (e.g., Gmail and App Password) to be used for sending notifications for this upload.
                    </p>
                    <Input
                        label="Sender Email Address"
                        placeholder="e.g. admin@example.com"
                        value={senderCredentials.email}
                        onChange={(e) => setSenderCredentials(prev => ({ ...prev, email: e.target.value }))}
                        required
                    />
                    <Input
                        label="Password / App Password"
                        type="password"
                        placeholder="Enter your email password"
                        value={senderCredentials.password}
                        onChange={(e) => setSenderCredentials(prev => ({ ...prev, password: e.target.value }))}
                        required
                    />
                </form>
            </Modal>
        </div >
    );
};

export default DataUpload;
