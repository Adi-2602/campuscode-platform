import { FiMenu, FiBell, FiSearch } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = ({ toggleSidebar }) => {
    const location = useLocation();

    // Helper to get page title from path
    const getPageTitle = () => {
        const path = location.pathname.split('/').pop();
        return path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';
    };

    return (
        <header className="h-16 bg-slate-900/80 dark:bg-slate-900/80 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                >
                    <FiMenu className="w-6 h-6" />
                </button>
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden md:block"
                >
                    <FiMenu className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-semibold text-slate-800 dark:text-white hidden sm:block">
                    {getPageTitle()}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-full pl-10 pr-4 py-2 text-slate-900 dark:text-slate-300 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all w-64"
                    />
                </div>

                <ThemeToggle />

                <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <FiBell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neon-red rounded-full shadow-[0_0_8px_#ef4444]"></span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;
