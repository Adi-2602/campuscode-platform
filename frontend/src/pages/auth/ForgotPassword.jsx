import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import commonService from '../../services/commonService';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await commonService.forgotPassword(email);
            setSubmitted(true);
            toast.success('Password reset email sent!');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            <div className="glass-card max-w-md w-full p-8 rounded-2xl relative z-10 border-neon-blue/20 shadow-xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                        Forgot Password
                    </h2>
                    <p className="text-slate-500 mt-2">
                        Enter your email to receive a reset link
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-500">
                                    <FiMail />
                                </span>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
                                    placeholder="student@srmist.edu.in"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full bg-neon-blue hover:bg-blue-600 border-none py-3"
                            disabled={loading}
                        >
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 text-2xl">
                            <FiMail />
                        </div>
                        <h3 className="text-xl font-bold text-white">Check your email</h3>
                        <p className="text-slate-400">
                            We have sent a password reset link to <span className="text-neon-cyan">{email}</span>
                        </p>
                        <p className="text-sm text-slate-500">
                            Did not receive the email? Check your spam folder or try again.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => setSubmitted(false)}
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                        <FiArrowLeft /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
