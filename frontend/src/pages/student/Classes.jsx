import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { FiPlus, FiUsers, FiLogOut, FiBook, FiHash } from 'react-icons/fi';
import studentService from '../../services/studentService';
import { toast } from 'react-hot-toast';

const StudentClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await studentService.getAllClasses();
            setClasses(response.data?.classes || response.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
            toast.error("Failed to load classes");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClass = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            setJoining(true);
            await studentService.joinClass(joinCode);
            toast.success("Successfully joined the class!");
            setIsJoinModalOpen(false);
            setJoinCode('');
            fetchClasses(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to join class. Check the code.");
        } finally {
            setJoining(false);
        }
    };

    const handleLeaveClass = async (classId, className) => {
        if (!window.confirm(`Are you sure you want to leave ${className}? You will lose access to its content.`)) {
            return;
        }

        try {
            await studentService.leaveClass(classId);
            toast.success("Left class successfully");
            setClasses(classes.filter(c => c._id !== classId));
        } catch (error) {
            console.error(error);
            toast.error("Failed to leave class");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Classes</h1>
                    <p className="text-slate-400">Manage your enrolled courses</p>
                </div>
                <Button variant="primary" onClick={() => setIsJoinModalOpen(true)}>
                    <FiPlus className="mr-2" /> Join Class
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
                </div>
            ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Card key={cls._id} className="group hover:border-neon-blue transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-neon-blue/10 text-neon-blue">
                                    <FiBook className="w-6 h-6" />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleLeaveClass(cls._id, cls.name)}
                                    title="Leave Class"
                                >
                                    <FiLogOut />
                                </Button>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">
                                {cls.name}
                            </h3>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                {cls.description || "No description provided."}
                            </p>

                            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <FiUsers className="text-neon-purple" />
                                    <span>{cls.students?.length || 0} Students</span>
                                </div>
                                <div className="bg-slate-800 px-2 py-1 rounded text-xs font-mono">
                                    {cls.code}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiBook className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No classes yet</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-6">
                        You haven't joined any classes yet. Ask your teacher for a class code to get started.
                    </p>
                    <Button variant="primary" onClick={() => setIsJoinModalOpen(true)}>
                        Join Your First Class
                    </Button>
                </div>
            )}

            {/* Join Class Modal */}
            <Modal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                title="Join a Class"
                size="sm"
            >
                <form onSubmit={handleJoinClass} className="space-y-6">
                    <div>
                        <Input
                            label="Class Code"
                            icon={FiHash}
                            placeholder="Enter 6-digit code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            autoFocus
                            className="uppercase tracking-widest font-mono text-center text-lg"
                        />
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Ask your teacher for the unique class code.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsJoinModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={joining || !joinCode || joinCode.length < 6}
                        >
                            {joining ? 'Joining...' : 'Join Class'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudentClasses;
