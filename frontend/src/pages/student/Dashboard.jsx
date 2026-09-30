import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import studentService from '../../services/studentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { FiClock, FiActivity, FiCheckCircle, FiBookOpen, FiCode } from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalExams: 12,
        completedExams: 10,
        averageScore: 85.5,
        pendingLabs: 2
    });

    // Dummy Data for Charts (Replace with API data later)
    const performanceData = [
        { name: 'Week 1', score: 65 },
        { name: 'Week 2', score: 72 },
        { name: 'Week 3', score: 68 },
        { name: 'Week 4', score: 85 },
        { name: 'Week 5', score: 90 },
        { name: 'Week 6', score: 88 },
    ];

    const skillData = [
        { subject: 'Algorithms', A: 120, fullMark: 150 },
        { subject: 'Data Structures', A: 98, fullMark: 150 },
        { subject: 'System Design', A: 86, fullMark: 150 },
        { subject: 'Testing', A: 99, fullMark: 150 },
        { subject: 'Debugging', A: 85, fullMark: 150 },
        { subject: 'Clean Code', A: 65, fullMark: 150 },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back, <span className="text-neon-cyan">{user?.name}</span>
                    </h1>
                    <p className="text-slate-400">
                        You have <span className="text-white font-semibold">2 upcoming labs</span> and <span className="text-white font-semibold">1 pending exam</span>.
                    </p>
                    <div className="mt-6 flex gap-4">
                        <Button variant="primary" className="shadow-neon-blue/20">
                            Resume Learning
                        </Button>
                        <Button variant="outline">
                            View Schedule
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Exams', value: stats.totalExams, icon: FiBookOpen, color: 'text-neon-blue', border: 'border-neon-blue/30' },
                    { label: 'Completed', value: stats.completedExams, icon: FiCheckCircle, color: 'text-neon-green', border: 'border-neon-green/30' },
                    { label: 'Avg. Score', value: `${stats.averageScore}%`, icon: FiActivity, color: 'text-neon-purple', border: 'border-neon-purple/30' },
                    { label: 'Pending Labs', value: stats.pendingLabs, icon: FiClock, color: 'text-neon-red', border: 'border-neon-red/30' },
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={`flex items-center gap-4 ${stat.border}`}>
                            <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center ${stat.color} shadow-lg`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <Card className="lg:col-span-2 min-h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <FiActivity className="text-neon-blue" />
                        Performance Trend
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Skills Radar */}
                <Card className="min-h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <FiCode className="text-neon-purple" />
                        Skill Analysis
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
                                <Radar
                                    name="Student"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.4}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
