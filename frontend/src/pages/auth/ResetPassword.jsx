import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import commonService from '../../services/commonService';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, valid, invalid, success
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            await commonService.verifyResetToken(token);
            setStatus('valid');
        } catch (error) {
            console.error(error);
            setStatus('invalid');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            await commonService.resetPassword(token, password);
            setStatus('success');
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-neon-cyan animate-pulse text-xl">Verifying token...</div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center space-y-4 border-red-500/20">
                    <h2 className="text-2xl font-bold text-red-500">Invalid or Expired Token</h2>
                    <p className="text-slate-400">
                        The password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link to="/forgot-password">
                        <Button variant="primary" className="mt-4 w-full">Request New Link</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            <div className="glass-card max-w-md w-full p-8 rounded-2xl relative z-10 border-neon-blue/20 shadow-xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                        Reset Password
                    </h2>
                    <p className="text-slate-500 mt-2">
                        Create a new strong password
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 text-2xl">
                            <FiCheckCircle />
                        </div>
                        <h3 className="text-xl font-bold text-white">Password Reset Complete</h3>
                        <p className="text-slate-400">
                            Your password has been successfully updated. Redirecting to login...
                        </p>
                        <Button
                            variant="primary"
                            className="w-full mt-4"
                            onClick={() => navigate('/login')}
                        >
                            Login Now
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="New Password"
                            type="password"
                            required
                            minLength={8}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={FiLock}
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            required
                            minLength={8}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            icon={FiLock}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full bg-neon-blue hover:bg-blue-600 border-none py-3"
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
