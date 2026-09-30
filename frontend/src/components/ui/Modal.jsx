import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full m-4'
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        ref={modalRef}
                        className={clsx(
                            "bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full flex flex-col max-h-[90vh]",
                            sizes[size]
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Modal;
