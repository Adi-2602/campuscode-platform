import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { FiMail, FiLock, FiTerminal } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(email, password);
            console.log('Logged in user:', user);

            // Redirect based on role
            switch (user.role) {
                case 'student':
                    navigate('/student/dashboard');
                    break;
                case 'teacher':
                    navigate('/teacher/dashboard');
                    break;
                case 'admin':
                case 'superadmin':
                    navigate('/admin/dashboard');
                    break;
                default:
                    navigate('/');
            }
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-neon-blue/30 shadow-neon-blue/10">
                    <div className="text-center mb-8">
                        <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-blue/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <FiTerminal className="w-8 h-8 text-neon-blue" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="text-slate-400 mt-2">Enter the system to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={FiMail}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={FiLock}
                            required
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-slate-400 cursor-pointer hover:text-white transition-colors">
                                <input type="checkbox" className="mr-2 rounded border-gray-600 bg-gray-700 text-neon-blue focus:ring-offset-gray-900" />
                                Remember me
                            </label>
                            <Link to="/forgot-password" className="text-neon-blue hover:text-blue-400 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <Button type="submit" className="w-full py-3 text-lg shadow-neon-blue/25" isLoading={loading}>
                            Initialize Session
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-400">
                        Access denied?{' '}
                        <Link to="/register" className="text-neon-cyan hover:text-cyan-400 font-medium transition-colors">
                            Request Access (Register)
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
