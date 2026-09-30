import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";

const ThemeToggle = ({ className }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${theme === "dark"
                    ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                } ${className}`}
            aria-label="Toggle Theme"
        >
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: theme === "dark" ? 0 : 180 }}
                transition={{ duration: 0.3 }}
            >
                {theme === "dark" ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </motion.div>
        </button>
    );
};

export default ThemeToggle;
