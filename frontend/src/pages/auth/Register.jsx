import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { FiUser, FiMail, FiLock, FiCpu } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        rollNumber: '',
        role: 'student', // Default role
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            navigate('/login');
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-neon-cyan/30 shadow-neon-cyan/10">
                    <div className="text-center mb-8">
                        <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                            <FiCpu className="w-8 h-8 text-neon-cyan" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            New User Entry
                        </h1>
                        <p className="text-slate-400 mt-2">Register to access the network</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Full Name"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            icon={FiUser}
                            required
                        />

                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            icon={FiMail}
                            required
                        />

                        {formData.role === 'student' && (
                            <Input
                                label="University Registration No."
                                name="rollNumber"
                                placeholder="RA2111003010xxx"
                                value={formData.rollNumber || ''}
                                onChange={handleChange}
                                icon={FiCpu} // Or any other appropriate icon
                                required
                            />
                        )}

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            icon={FiLock}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.role === 'student' ? 'border-neon-cyan bg-neon-cyan/10 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="student"
                                        checked={formData.role === 'student'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    Student
                                </label>
                                <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.role === 'teacher' ? 'border-neon-purple bg-neon-purple/10 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="teacher"
                                        checked={formData.role === 'teacher'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    Teacher
                                </label>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" className="w-full bg-neon-cyan hover:bg-cyan-600 shadow-neon-cyan/25 focus:ring-neon-cyan" isLoading={loading}>
                            Create ID
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-400">
                        Already registered?{' '}
                        <Link to="/login" className="text-neon-blue hover:text-blue-400 font-medium transition-colors">
                            Login System
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default Register;
