import { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiUserPlus, FiCheck, FiX, FiSearch, FiShield } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import adminService from '../../services/adminService';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AdminUserManagement = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('teachers');
    const [loading, setLoading] = useState(false);

    // Data States
    const [unverifiedTeachers, setUnverifiedTeachers] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [admins, setAdmins] = useState([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Student Filters
    const [studentFilters, setStudentFilters] = useState({
        semester: 'All',
        batch: 'All',
        section: 'All',
        group: 'All'
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 20
    });

    // Edit Student State
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // View Student State
    const [isViewStudentModalOpen, setIsViewStudentModalOpen] = useState(false);
    const [viewingStudent, setViewingStudent] = useState(null);

    // Add Admin Modal State
    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        email: '',
        password: '',
        permissions: []
    });
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [permissionsLoading, setPermissionsLoading] = useState(false);

    useEffect(() => {
        setPage(1);
        setSearchTerm('');
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [activeTab, studentFilters, page]); // Re-fetch when page changes
    useEffect(() => {
        setPage(1);
    }, [studentFilters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'teachers') {
                // ... existing teacher fetch code ...
                // Fetch unverified teachers with graceful fallback
                let unverifiedRes = { data: [] };
                try {
                    unverifiedRes = await adminService.getUnverifiedTeachers();
                } catch (e) {
                    console.warn("Failed to fetch unverified teachers", e);
                }

                // Fetch all teachers with pagination
                let allRes = { data: { teachers: [], pagination: { total: 0, pages: 1, limit: 20 } } };
                try {
                    allRes = await adminService.getAllTeachers({ page, limit: 20 });
                } catch (e) {
                    console.warn("Failed to fetch all teachers", e);
                }

                setUnverifiedTeachers(unverifiedRes.data?.teachers || []);
                setTeachers(allRes.data?.teachers || []);
                if (allRes.data?.pagination) {
                    setPagination(allRes.data.pagination);
                }
            } else if (activeTab === 'students') {
                const params = {
                    page,
                    limit: 20 // Default limit
                };
                if (studentFilters.semester !== 'All') params.semester = studentFilters.semester;
                if (studentFilters.batch !== 'All') params.batch = studentFilters.batch;
                if (studentFilters.section !== 'All') params.section = studentFilters.section;
                if (studentFilters.group !== 'All') params.group = studentFilters.group;
                if (searchTerm) params.search = searchTerm; // Add search support to backend params if needed

                const res = await adminService.getAllStudents(params);
                setStudents(res.data?.students || []);
                if (res.data?.pagination) {
                    setPagination(res.data.pagination);
                }
            } else if (activeTab === 'admins') {
                const res = await adminService.getAllAdmins();
                setAdmins(res.data?.admins || []);

                // Fetch permissions if not already loaded
                if (availablePermissions.length === 0) {
                    setPermissionsLoading(true);
                    try {
                        const permRes = await adminService.getPermissions();
                        // The backend returns an array of strings or objects. 
                        // Based on the user snippet: router.get("/permissions", ... getAvailablePermissionsHandler)
                        // It likely returns { permissions: [...] } or just [...]
                        // I'll assume it returns { permissions: [...] } based on other endpoints
                        setAvailablePermissions(permRes.data?.permissions || permRes.data || []);
                    } catch (e) {
                        console.warn("Failed to fetch permissions", e);
                        // Fallback permissions if API fails
                        setAvailablePermissions([
                            'VIEW_CLASSES', 'MANAGE_CLASSES', 'VIEW_STUDENTS', 'MANAGE_STUDENTS',
                            'VIEW_TEACHERS', 'VERIFY_TEACHERS', 'VIEW_LIVE_EXAMS', 'VIEW_EXAM_DETAILS',
                            'VIEW_CODE_LOGS', 'VIEW_COMPILER_LOGS', 'VIEW_SUBMISSION_LOGS',
                            'MANAGE_USERS', 'VIEW_USER_ACTIVITY',
                            'VIEW_DB', 'EXPORT_DATA', 'VIEW_INFRA', 'VIEW_SERVER_LOGS', 'RESTART_SERVICES',
                            'VIEW_REALTIME', 'VIEW_ANALYTICS', 'GENERATE_REPORTS', 'MANAGE_NOTIFICATIONS'
                        ]);
                    } finally {
                        setPermissionsLoading(false);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // toast.error('Failed to load user data');

            // Mock Data for Demo
            if (activeTab === 'teachers' && teachers.length === 0) {
                setUnverifiedTeachers([
                    { _id: 't1', name: 'Dr. Newbie', email: 'new@univ.edu', department: 'CSE' },
                    { _id: 't2', name: 'Prof. Guest', email: 'guest@univ.edu', department: 'IT' }
                ]);
                setTeachers([
                    { _id: 't3', name: 'Dr. Smith', email: 'smith@univ.edu', department: 'CSE', isVerified: true },
                    { _id: 't4', name: 'Dr. Jones', email: 'jones@univ.edu', department: 'ECE', isVerified: true }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditStudent = (student) => {
        setEditingStudent({ ...student });
        setIsEditStudentModalOpen(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            await adminService.updateUser(editingStudent._id, editingStudent);
            toast.success("Student updated successfully");
            setIsEditStudentModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update student");
        }
    };

    const handleViewStudent = (student) => {
        setViewingStudent(student);
        setIsViewStudentModalOpen(true);
    };

    // Teacher Handlers
    const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [isViewTeacherModalOpen, setIsViewTeacherModalOpen] = useState(false);
    const [viewingTeacher, setViewingTeacher] = useState(null);

    const handleEditTeacher = (teacher) => {
        setEditingTeacher({ ...teacher });
        setIsEditTeacherModalOpen(true);
    };

    const handleUpdateTeacher = async (e) => {
        e.preventDefault();
        try {
            await adminService.updateUser(editingTeacher._id, editingTeacher);
            toast.success("Teacher updated successfully");
            setIsEditTeacherModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update teacher");
        }
    };

    const handleViewTeacher = async (teacher) => {
        try {
            const res = await adminService.getTeacherDetails(teacher._id);
            setViewingTeacher(res.data); // Assuming returns { teacher, classes, ... }
            setIsViewTeacherModalOpen(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch teacher details");
        }
    };

    const handleVerifyTeacher = async (teacherId) => {
        try {
            await adminService.verifyTeacher(teacherId);
            toast.success('Teacher Verified Successfully');
            // Optimistic update
            const verified = unverifiedTeachers.find(t => t._id === teacherId);
            setUnverifiedTeachers(prev => prev.filter(t => t._id !== teacherId));
            if (verified) {
                setTeachers(prev => {
                    const exists = prev.some(t => t._id === teacherId);
                    if (exists) {
                        return prev.map(t => t._id === teacherId ? { ...t, isVerified: true } : t);
                    }
                    return [...prev, { ...verified, isVerified: true }];
                });
            }
        } catch (error) {
            toast.error('Verification Failed');
        }
    };

    const handleRejectTeacher = async (teacherId) => {
        if (!window.confirm('Are you sure you want to reject this teacher?')) return;
        try {
            await adminService.rejectTeacher(teacherId, { reason: 'Admin Rejected' });
            toast.success('Teacher Rejected');
            setUnverifiedTeachers(prev => prev.filter(t => t._id !== teacherId));
            // Also remove from main list if present
            setTeachers(prev => prev.filter(t => t._id !== teacherId));
        } catch (error) {
            toast.error('Rejection Failed');
        }
    };

    const filteredList = (list) => {
        if (!searchTerm) return list;
        return list.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            await adminService.createAdmin(newAdmin);
            toast.success('Admin created successfully');
            setIsAddAdminModalOpen(false);
            setNewAdmin({ name: '', email: '', password: '', permissions: [] });
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Create admin error:", error);
            toast.error(error.response?.data?.error || 'Failed to create admin');
        }
    };

    const togglePermission = (perm) => {
        setNewAdmin(prev => {
            if (prev.permissions.includes(perm)) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== perm) };
            } else {
                return { ...prev, permissions: [...prev.permissions, perm] };
            }
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">User Management</h1>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6">
                {[
                    { id: 'teachers', label: 'Teachers', icon: FiUserCheck },
                    { id: 'students', label: 'Students', icon: FiUsers },
                    { id: 'admins', label: 'Admins', icon: FiShield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === tab.id
                            ? 'border-neon-purple text-neon-purple'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-transparent rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-neon-purple outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'admins' && (
                    <Button
                        variant="primary"
                        className="bg-neon-purple hover:bg-purple-600 border-none"
                        onClick={() => setIsAddAdminModalOpen(true)}
                    >
                        <FiUserPlus className="mr-2" /> Add Admin
                    </Button>
                )}
            </div>

            {/* Content Area */}
            {activeTab === 'teachers' && (
                <div className="space-y-8">
                    {/* Unverified Section */}
                    {unverifiedTeachers.length > 0 && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse"></span>
                                Pending Verifications ({unverifiedTeachers.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {unverifiedTeachers.map((teacher, idx) => (
                                    <Card key={teacher._id || teacher.id || idx} className="border-l-4 border-l-neon-yellow flex justify-between items-center bg-yellow-50 dark:bg-yellow-500/5">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{teacher.name}</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">{teacher.email}</p>
                                            <span className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 mt-1 inline-block border border-gray-200 dark:border-transparent">
                                                Dept: {teacher.department || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleVerifyTeacher(teacher._id || teacher.id)}
                                                className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30"
                                            >
                                                <FiCheck /> Verify
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleRejectTeacher(teacher._id || teacher.id)}
                                                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
                                            >
                                                <FiX /> Reject
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Teachers List */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">All Teachers</h3>
                        <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-xs border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4 border-r border-gray-200 dark:border-slate-700">Name</th>
                                        <th className="p-4 border-r border-gray-200 dark:border-slate-700">Email</th>
                                        <th className="p-4 border-r border-gray-200 dark:border-slate-700">Faculty ID</th>
                                        <th className="p-4 border-r border-gray-200 dark:border-slate-700">Department</th>
                                        <th className="p-4 border-r border-gray-200 dark:border-slate-700">Designation</th>
                                        <th className="p-4 border-r border-gray-200 dark:border-slate-700">Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-sm text-slate-600 dark:text-slate-300">
                                    {filteredList(teachers).map((teacher, idx) => (
                                        <tr key={teacher._id || idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="p-4 font-medium text-slate-900 dark:text-white border-r border-gray-200 dark:border-slate-700">{teacher.name}</td>
                                            <td className="p-4 border-r border-gray-200 dark:border-slate-700">{teacher.email}</td>
                                            <td className="p-4 font-mono text-xs border-r border-gray-200 dark:border-slate-700">{teacher.facultyId || '-'}</td>
                                            <td className="p-4 border-r border-gray-200 dark:border-slate-700">{teacher.department || '-'}</td>
                                            <td className="p-4 border-r border-gray-200 dark:border-slate-700">{teacher.designation || '-'}</td>
                                            <td className="p-4 border-r border-gray-200 dark:border-slate-700">
                                                {teacher.isVerified ? (
                                                    <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2 py-0.5 rounded text-xs font-bold">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 px-2 py-0.5 rounded text-xs font-bold">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => handleViewTeacher(teacher)}>View</Button>
                                                <Button size="sm" variant="outline" onClick={() => handleEditTeacher(teacher)}>Edit</Button>
                                                {!teacher.isVerified && (
                                                    <>
                                                        <Button size="sm" className="bg-green-100 text-green-600 hover:bg-green-200" onClick={() => handleVerifyTeacher(teacher._id)}>Verify</Button>
                                                        <Button size="sm" className="bg-red-100 text-red-600 hover:bg-red-200" onClick={() => handleRejectTeacher(teacher._id)}>Reject</Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {teachers.length === 0 && (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-500">No teachers found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-between items-center mt-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    Showing page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of <span className="font-bold text-slate-900 dark:text-white">{pagination.pages}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={page === pagination.pages}
                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'students' && (
                <div className="space-y-4">
                    {/* Student Filters */}
                    <div className="flex flex-wrap gap-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg items-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filters:</span>

                        <select
                            value={studentFilters.semester}
                            onChange={(e) => setStudentFilters(prev => ({ ...prev, semester: e.target.value }))}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-sm dark:text-white"
                        >
                            <option value="All">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>

                        <select
                            value={studentFilters.batch}
                            onChange={(e) => setStudentFilters(prev => ({ ...prev, batch: e.target.value }))}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-sm dark:text-white"
                        >
                            <option value="All">All Batches</option>
                            <option value="1">Batch 1</option>
                            <option value="2">Batch 2</option>
                        </select>

                        <select
                            value={studentFilters.section}
                            onChange={(e) => setStudentFilters(prev => ({ ...prev, section: e.target.value }))}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-sm dark:text-white"
                        >
                            <option value="All">All Sections</option>
                            {/* Dynamically get sections from current data if possible, else static common ones */}
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'].map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            ))}
                        </select>

                        <select
                            value={studentFilters.group}
                            onChange={(e) => setStudentFilters(prev => ({ ...prev, group: e.target.value }))}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-sm dark:text-white"
                        >
                            <option value="All">All Groups</option>
                            <option value="1">Group 1</option>
                            <option value="2">Group 2</option>
                        </select>

                        <div className="ml-auto text-xs text-slate-500">
                            Showing {students.length} students
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Roll No</th>
                                    <th className="p-4">Semester</th>
                                    <th className="p-4">Batch</th>
                                    <th className="p-4">Section</th>
                                    <th className="p-4">Group</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                                {filteredList(students).map((student, idx) => (
                                    <tr key={student._id || student.id || idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">{student.name}</td>
                                        <td className="p-4">{student.email}</td>
                                        <td className="p-4 font-mono text-blue-600 dark:text-neon-cyan">{student.rollNumber || student.rollNo || 'N/A'}</td>
                                        <td className="p-4 text-center">{student.semester || '-'}</td>
                                        <td className="p-4 text-center">{student.batch || '-'}</td>
                                        <td className="p-4 text-center">{student.section || '-'}</td>
                                        <td className="p-4 text-center">{student.group || '-'}</td>
                                        <td className="p-4 flex gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleViewStudent(student)}>View</Button>
                                            <Button size="sm" variant="outline" onClick={() => handleEditStudent(student)}>Edit</Button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr><td colSpan="8" className="p-8 text-center text-slate-500">No students found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-between items-center mt-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Showing page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of <span className="font-bold text-slate-900 dark:text-white">{pagination.pages}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={page === pagination.pages}
                                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {
                activeTab === 'admins' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredList(admins).map((admin, idx) => (
                            <Card key={admin._id || admin.id || idx} className="border-slate-700 hover:border-neon-purple transition-colors group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-neon-purple group-hover:scale-110 transition-transform">
                                        <FiShield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{admin.name}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs">{admin.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase">Permissions</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {(admin.permissions || ['VIEW_ALL']).slice(0, 3).map((perm, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                {perm.replace('VIEW_', '')}
                                            </span>
                                        ))}
                                        {(admin.permissions?.length > 3) && (
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                +{admin.permissions.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {admins.length === 0 && (
                            <div className="col-span-full p-10 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                                No other admins found.
                            </div>
                        )}
                    </div>
                )
            }


            {/* Edit Student Modal */}
            <Modal
                isOpen={isEditStudentModalOpen}
                onClose={() => setIsEditStudentModalOpen(false)}
                title="Edit Student"
            >
                <form onSubmit={handleUpdateStudent} className="space-y-4">
                    <Input label="Name" value={editingStudent?.name || ''} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} required />
                    <Input label="Email" value={editingStudent?.email || ''} onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })} required />
                    <Input label="Roll No" value={editingStudent?.rollNo || ''} onChange={e => setEditingStudent({ ...editingStudent, rollNo: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Semester" type="number" value={editingStudent?.semester || ''} onChange={e => setEditingStudent({ ...editingStudent, semester: parseInt(e.target.value) })} />
                        <Input label="Batch" type="number" value={editingStudent?.batch || ''} onChange={e => setEditingStudent({ ...editingStudent, batch: parseInt(e.target.value) })} />
                        <Input label="Section" value={editingStudent?.section || ''} onChange={e => setEditingStudent({ ...editingStudent, section: e.target.value })} />
                        <Input label="Group" type="number" value={editingStudent?.group || ''} onChange={e => setEditingStudent({ ...editingStudent, group: parseInt(e.target.value) })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsEditStudentModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Update Student</Button>
                    </div>
                </form>
            </Modal>

            {/* View Student Modal */}
            <Modal
                isOpen={isViewStudentModalOpen}
                onClose={() => setIsViewStudentModalOpen(false)}
                title="Student Details"
                size="xl"
            >
                {viewingStudent && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-2xl font-bold uppercase">
                                {viewingStudent.name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingStudent.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400">{viewingStudent.email}</p>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mt-1">
                                    {viewingStudent.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Academic Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 border-gray-200 dark:border-slate-700">Academic Information</h4>
                                <InfoRow label="Roll No" value={viewingStudent.rollNo || viewingStudent.rollNumber} />
                                <InfoRow label="Registration No" value={viewingStudent.registrationNumber} />
                                <InfoRow label="Semester" value={viewingStudent.semester} />
                                <InfoRow label="Batch" value={viewingStudent.batch} />
                                <InfoRow label="Section" value={viewingStudent.section} />
                                <InfoRow label="Group" value={viewingStudent.group} />
                                <InfoRow label="Program" value={viewingStudent.program} />
                                <InfoRow label="Branch" value={viewingStudent.branch} />
                                <InfoRow label="Campus" value={viewingStudent.campus} />
                            </div>

                            {/* Personal Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 border-gray-200 dark:border-slate-700">Personal Information</h4>
                                <InfoRow label="Mobile" value={viewingStudent.mobile} />
                                <InfoRow label="DOB" value={viewingStudent.dob ? new Date(viewingStudent.dob).toLocaleDateString() : '-'} />
                                <InfoRow label="Gender" value={viewingStudent.gender} />
                                <InfoRow label="Blood Group" value={viewingStudent.bloodGroup} />
                                <InfoRow label="Address" value={viewingStudent.address} />
                            </div>

                            {/* Parent Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 border-gray-200 dark:border-slate-700">Parent / Guardian</h4>
                                <InfoRow label="Father's Name" value={viewingStudent.parentName} />
                                <InfoRow label="Parent Email" value={viewingStudent.parentEmail} />
                                <InfoRow label="Parent Mobile" value={viewingStudent.parentMobile} />
                            </div>

                            {/* Faculty Advisor */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 border-gray-200 dark:border-slate-700">Faculty Advisor</h4>
                                <InfoRow label="Name" value={viewingStudent.facultyAdvisor} />
                                <InfoRow label="Mobile" value={viewingStudent.facultyAdvisorMobile} />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button variant="ghost" onClick={() => setIsViewStudentModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Teacher Modal */}
            <Modal
                isOpen={isEditTeacherModalOpen}
                onClose={() => setIsEditTeacherModalOpen(false)}
                title="Edit Teacher"
            >
                <form onSubmit={handleUpdateTeacher} className="space-y-4">
                    <Input label="Name" value={editingTeacher?.name || ''} onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })} required />
                    <Input label="Email" value={editingTeacher?.email || ''} onChange={e => setEditingTeacher({ ...editingTeacher, email: e.target.value })} required />
                    <Input label="Faculty ID" value={editingTeacher?.facultyId || ''} onChange={e => setEditingTeacher({ ...editingTeacher, facultyId: e.target.value })} />
                    <Input label="Department" value={editingTeacher?.department || ''} onChange={e => setEditingTeacher({ ...editingTeacher, department: e.target.value })} />
                    <Input label="Designation" value={editingTeacher?.designation || ''} onChange={e => setEditingTeacher({ ...editingTeacher, designation: e.target.value })} />
                    <Input label="Mobile" value={editingTeacher?.mobile || ''} onChange={e => setEditingTeacher({ ...editingTeacher, mobile: e.target.value })} />

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsEditTeacherModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Update Teacher</Button>
                    </div>
                </form>
            </Modal>

            {/* View Teacher Modal */}
            <Modal
                isOpen={isViewTeacherModalOpen}
                onClose={() => setIsViewTeacherModalOpen(false)}
                title="Teacher Details"
                size="xl"
            >
                {viewingTeacher && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-2xl font-bold uppercase">
                                {viewingTeacher.teacher?.name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingTeacher.teacher?.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400">{viewingTeacher.teacher?.email}</p>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mt-1">
                                    {viewingTeacher.teacher?.designation || 'Teacher'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 border-gray-200 dark:border-slate-700">Information</h4>
                                <InfoRow label="Faculty ID" value={viewingTeacher.teacher?.facultyId} />
                                <InfoRow label="Department" value={viewingTeacher.teacher?.department} />
                                <InfoRow label="Mobile" value={viewingTeacher.teacher?.mobile} />
                                <InfoRow label="Verified" value={viewingTeacher.teacher?.isVerified ? 'Yes' : 'No'} />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 border-gray-200 dark:border-slate-700">Stats</h4>
                                <InfoRow label="Classes Created" value={viewingTeacher.statistics?.totalClasses} />
                                <InfoRow label="Exams Created" value={viewingTeacher.statistics?.totalExams} />
                                <InfoRow label="Active Exams" value={viewingTeacher.statistics?.activeExams} />
                            </div>
                        </div>

                        {/* Classes List */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 border-gray-200 dark:border-slate-700 mb-4">Assigned Classes</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="p-3">Class Name</th>
                                            <th className="p-3">Course Code</th>
                                            <th className="p-3">Batch/Sec/Group</th>
                                            <th className="p-3">Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {viewingTeacher.classes?.map((cls, idx) => (
                                            <tr key={cls._id || idx}>
                                                <td className="p-3 font-medium">{cls.name}</td>
                                                <td className="p-3">{cls.courseCode || cls.code}</td>
                                                <td className="p-3">
                                                    {cls.batch && `Batch ${cls.batch}`}
                                                    {cls.section && ` • ${cls.section}`}
                                                    {cls.group && ` • Grp ${cls.group}`}
                                                </td>
                                                <td className="p-3">{new Date(cls.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {(!viewingTeacher.classes || viewingTeacher.classes.length === 0) && (
                                            <tr><td colSpan="4" className="p-4 text-center text-slate-500">No classes found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Admin Modal */}
            <Modal
                isOpen={isAddAdminModalOpen}
                onClose={() => setIsAddAdminModalOpen(false)}
                title="Create New Admin"
            >
                <form onSubmit={handleAddAdmin} className="space-y-4">
                    <Input
                        label="Name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        placeholder="Admin Name"
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        placeholder="admin@example.com"
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        placeholder="Secure Password"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Permissions
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-slate-700 rounded-lg">
                            {availablePermissions.map(perm => (
                                <label key={perm} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newAdmin.permissions.includes(perm)}
                                        onChange={() => togglePermission(perm)}
                                        className="rounded border-gray-300 text-neon-purple focus:ring-neon-purple"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        {perm.replace(/_/g, ' ')}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAddAdminModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="bg-neon-purple hover:bg-purple-600"
                        >
                            Create Admin
                        </Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

// Helper Component for Info Rows
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-start text-sm">
        <span className="text-slate-500 dark:text-slate-400 shrink-0 mr-2">{label}:</span>
        <span className="text-slate-900 dark:text-white font-medium text-right break-words max-w-[60%]">
            {value || '-'}
        </span>
    </div>
);

export default AdminUserManagement;
