import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';

const TimePicker = ({ label, value, onChange, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Initial value decomposition (HH:mm)
    const [hours, setHours] = useState(value ? value.split(':')[0] : '09');
    const [minutes, setMinutes] = useState(value ? value.split(':')[1] : '00');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateTime = (newHours, newMinutes) => {
        setHours(newHours);
        setMinutes(newMinutes);
        onChange(`${newHours}:${newMinutes}`);
    };

    const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minuteOptions = ['00', '15', '30', '45'].concat(
        Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
    ).filter((v, i, a) => a.indexOf(v) === i).sort();

    return (
        <div className="w-full relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                    <FiClock className="text-neon-blue" /> {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={twMerge(
                    "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-left flex items-center justify-between hover:border-neon-blue transition-all outline-none",
                    isOpen && "ring-2 ring-neon-blue border-transparent",
                    className
                )}
            >
                <span className="text-slate-900 dark:text-white font-mono font-bold">
                    {hours}:{minutes}
                </span>
                <FiChevronDown className={twMerge("transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 overflow-hidden"
                    >
                        <div className="flex justify-around items-center gap-4">
                            {/* Hours Column */}
                            <div className="flex-1 text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Hours</p>
                                <div className="h-40 overflow-y-auto custom-scrollbar space-y-1">
                                    {hourOptions.map(h => (
                                        <button
                                            key={h}
                                            onClick={() => updateTime(h, minutes)}
                                            className={`w-full py-1.5 rounded transition-all text-sm font-mono ${hours === h
                                                    ? 'bg-neon-blue text-white font-bold'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                }`}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="text-2xl font-bold text-slate-300">:</div>

                            {/* Minutes Column */}
                            <div className="flex-1 text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Minutes</p>
                                <div className="h-40 overflow-y-auto custom-scrollbar space-y-1">
                                    {minuteOptions.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => updateTime(hours, m)}
                                            className={`w-full py-1.5 rounded transition-all text-sm font-mono ${minutes === m
                                                    ? 'bg-neon-purple text-white font-bold'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-neon-blue font-bold px-3 py-1 hover:underline"
                            >
                                Done
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateTime('09', '00')}
                                    className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500"
                                >
                                    9 AM
                                </button>
                                <button
                                    onClick={() => updateTime('14', '00')}
                                    className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500"
                                >
                                    2 PM
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

TimePicker.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string
};

export default TimePicker;
