import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiHome, FiUsers, FiBook, FiCode, FiSettings, FiActivity,
    FiDatabase, FiLogOut, FiMenu, FiX, FiServer, FiHardDrive, FiBell, FiFileText, FiUpload, FiCpu
} from 'react-icons/fi';
import { useState } from 'react';
import clsx from 'clsx';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const studentLinks = [
        { name: 'Dashboard', path: '/student/dashboard', icon: FiHome },
        { name: 'My Classes', path: '/student/classes', icon: FiUsers },
        { name: 'Exams', path: '/student/exams', icon: FiBook },
        { name: 'Results', path: '/student/results', icon: FiActivity },
    ];

    const teacherLinks = [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: FiHome },
        { name: 'Manage Classes', path: '/teacher/classes', icon: FiUsers },
        { name: 'Exams', path: '/teacher/exams', icon: FiBook },
        { name: 'Question Bank', path: '/teacher/questions', icon: FiCode },
        { name: 'Evaluations', path: '/teacher/evaluations', icon: FiActivity },
    ];

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
        { name: 'User Management', path: '/admin/users', icon: FiUsers },
        { name: 'System Monitoring', path: '/admin/monitoring', icon: FiActivity },
        { name: 'Database', path: '/admin/database', icon: FiDatabase },
        { name: 'Notifications', path: '/admin/notifications', icon: FiBell },
        { name: 'Reports', path: '/admin/reports', icon: FiFileText },
        { name: 'Data Upload', path: '/admin/upload', icon: FiUpload },
    ];

    let links = [];
    if (user?.role === 'student') links = studentLinks;
    else if (user?.role === 'teacher') links = teacherLinks;
    else if (['admin', 'superadmin'].includes(user?.role)) links = adminLinks;

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.div
                className={clsx(
                    "fixed top-0 left-0 h-full bg-white dark:bg-slate-900/90 backdrop-blur-xl border-r border-gray-200 dark:border-slate-800 z-50 transition-all duration-300 w-64",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    !isOpen && "md:w-20"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-white">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
                                <FiCpu className="text-white w-5 h-5" />
                            </div>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple font-extrabold tracking-tight"
                                >
                                    codeCampus
                                </motion.span>
                            )}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-3">
                        {links.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={clsx(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-neon-blue/20"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                                    )}
                                    title={!isOpen ? link.name : ''}
                                >
                                    <link.icon className={clsx("w-6 h-6 min-w-[24px]", isActive && "animate-pulse")} />
                                    {isOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="font-medium whitespace-nowrap"
                                        >
                                            {link.name}
                                        </motion.span>
                                    )}

                                    {/* Active Indicator Line */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-blue rounded-r-full shadow-[0_0_10px_#3b82f6]"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-gray-200 dark:border-slate-800 relative">
                        {isOpen ? (
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center border border-gray-300 dark:border-slate-600">
                                    <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{user?.name?.[0] || 'U'}</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.name || 'User'}</h4>
                                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600" title={user?.name}>
                                    <span className="text-lg font-bold text-slate-300">{user?.name?.[0] || 'U'}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={logout}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors",
                                !isOpen && "justify-center"
                            )}
                            title="Logout"
                        >
                            <FiLogOut className="w-5 h-5 min-w-[20px]" />
                            {isOpen && <span>Logout</span>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
