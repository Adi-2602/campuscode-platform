import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import clsx from 'clsx';

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex font-sans text-slate-800 dark:text-slate-200 selection:bg-neon-blue selection:text-white transition-colors duration-300">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />

            <div
                className={clsx(
                    "flex-1 flex flex-col min-h-screen transition-all duration-300",
                    isSidebarOpen ? "md:ml-64" : "md:ml-20"
                )}
            >
                <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
