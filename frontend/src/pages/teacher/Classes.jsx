import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiUsers, FiEdit2, FiTrash2, FiLock, FiUnlock, FiMoreVertical, FiCalendar, FiCopy } from 'react-icons/fi';
import teacherService from '../../services/teacherService';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const TeacherClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Student Modal State
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
    const [selectedClassStudents, setSelectedClassStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const res = await teacherService.getClasses();
            setClasses(res.data?.classes || res.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
            toast.error("Failed to load classes");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return;

        try {
            setSubmitting(true);
            if (editingId) {
                await teacherService.updateClass(editingId, formData);
                toast.success("Class updated successfully");
            } else {
                await teacherService.createClass(formData);
                toast.success("Class created successfully");
            }
            setIsModalOpen(false);
            setFormData({ name: '', description: '' });
            setEditingId(null);
            fetchClasses();
        } catch (error) {
            console.error(error);
            toast.error(editingId ? "Failed to update class" : "Failed to create class");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (cls) => {
        setFormData({ name: cls.name, description: cls.description || '' });
        setEditingId(cls._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the class and all associated data.")) return;
        try {
            await teacherService.deleteClass(id);
            toast.success("Class deleted");
            setClasses(classes.filter(c => c._id !== id));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete class");
        }
    };

    const toggleLock = async (id, currentStatus) => {
        try {
            await teacherService.toggleClassLock(id);
            toast.success(currentStatus ? "Class unlocked" : "Class locked");
            setClasses(classes.map(c =>
                c._id === id ? { ...c, isLocked: !currentStatus } : c
            ));
        } catch (error) {
            console.error(error);
            toast.error("Failed to toggle lock status");
        }
    };

    const openCreateModal = () => {
        setFormData({ name: '', description: '' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleViewStudents = async (cls) => {
        setSelectedClass(cls);
        setIsStudentsModalOpen(true);
        setLoadingStudents(true);
        try {
            const res = await teacherService.getClassStudents(cls._id);
            // The backend endpoint returns { students: [...] }
            setSelectedClassStudents(res.data?.students || []);
        } catch (error) {
            console.error("Failed to load students:", error);
            toast.error("Failed to load students for this class.");
            setSelectedClassStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Classes</h1>
                    <p className="text-slate-600 dark:text-slate-400">Create and manage your student groups</p>
                </div>
                <Button variant="primary" onClick={openCreateModal} className="bg-neon-purple border-none hover:bg-purple-600">
                    <FiPlus className="mr-2" /> Create Class
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
                </div>
            ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Card key={cls._id} className="group hover:border-neon-purple transition-all duration-300 relative overflow-hidden bg-white dark:bg-slate-800">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleEdit(cls)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:text-neon-cyan transition-colors text-slate-600 dark:text-slate-400"
                                    title="Edit Class"
                                >
                                    <FiEdit2 />
                                </button>
                                <button
                                    onClick={() => handleDelete(cls._id)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:text-red-500 transition-colors text-slate-600 dark:text-slate-400"
                                    title="Delete Class"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 pr-12">{cls.name}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 min-h-[40px]">
                                    {cls.description || "No description provided."}
                                </p>
                            </div>

                            <div className="mt-4 mb-4">
                                <Link to={`/teacher/exams/create?classId=${cls._id}`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-neon-blue/30 text-neon-blue hover:bg-neon-blue font-bold px-2 py-1.5 h-auto text-[11px]"
                                    >
                                        <FiPlus className="mr-1.5" /> CREATE EXAM
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div
                                        className="flex items-center gap-1.5 cursor-pointer hover:text-neon-blue transition-colors p-1 -ml-1 rounded hover:bg-neon-blue/10"
                                        title="Click to view students"
                                        onClick={() => handleViewStudents(cls)}
                                    >
                                        <FiUsers className="text-neon-blue" />
                                        <span className="font-bold">{cls.students?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Created At">
                                        <FiCalendar className="text-slate-400 dark:text-slate-600" />
                                        <span>{new Date(cls.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleLock(cls._id, cls.isLocked)}
                                        className={`text-lg transition-colors ${cls.isLocked ? 'text-red-500' : 'text-green-500'}`}
                                        title={cls.isLocked ? "Class Locked (No new joins)" : "Class Open (Students can join)"}
                                    >
                                        {cls.isLocked ? <FiLock /> : <FiUnlock />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(cls.code);
                                            toast.success("Class code copied!");
                                        }}
                                        className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-xs font-mono tracking-wider text-neon-purple border border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all flex items-center gap-2 cursor-pointer group/code"
                                        title="Click to copy code"
                                    >
                                        <span className="font-bold">{cls.code}</span>
                                        <FiCopy className="opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="bg-slate-100 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiUsers className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No classes yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                        Create your first class to start adding students and conducting exams.
                    </p>
                    <Button variant="primary" onClick={openCreateModal} className="bg-neon-purple border-none">
                        Create Class
                    </Button>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Class" : "Create New Class"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Class Name"
                        placeholder="e.g. CS101 - Intro to Programming"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                        className="bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Description
                        </label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all min-h-[100px]"
                            placeholder="Optional description about the class..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1 bg-neon-purple border-none hover:bg-purple-600"
                            disabled={submitting || !formData.name}
                        >
                            {submitting ? 'Saving...' : (editingId ? 'Update Class' : 'Create Class')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Students List Modal */}
            <Modal
                isOpen={isStudentsModalOpen}
                onClose={() => setIsStudentsModalOpen(false)}
                title={`Enrolled Students - ${selectedClass?.name || 'Class'}`}
                size="lg"
            >
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-500 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <tr>
                                <th className="pb-3 pl-2">#</th>
                                <th className="pb-3">Student Name</th>
                                <th className="pb-3">Register Number</th>
                                <th className="pb-3 text-center">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loadingStudents ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-slate-500">
                                        Loading students...
                                    </td>
                                </tr>
                            ) : selectedClassStudents.length > 0 ? (
                                selectedClassStudents.map((student, i) => (
                                    <tr key={student._id || i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3 pl-2 text-slate-500">{i + 1}</td>
                                        <td className="py-3 font-medium text-slate-900 dark:text-slate-200">
                                            {student.name || '-'}
                                        </td>
                                        <td className="py-3 font-mono text-neon-blue">
                                            {student.registrationNumber || student.rollNo || '-'}
                                        </td>
                                        <td className="py-3 text-center text-slate-500 text-xs">
                                            {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-slate-500">
                                        No students found in this class.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => setIsStudentsModalOpen(false)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};

export default TeacherClasses;
