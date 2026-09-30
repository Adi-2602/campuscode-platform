import { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { twMerge } from 'tailwind-merge';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Input = forwardRef(({ label, error, icon: Icon, className, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <input
                    ref={ref}
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={twMerge(
                        'input-field w-full py-2.5',
                        Icon ? 'pl-10 pr-3' : 'px-3',
                        isPassword ? 'pr-10' : '',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus:outline-none"
                    >
                        {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500 animate-pulse">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

Input.propTypes = {
    label: PropTypes.string,
    error: PropTypes.string,
    icon: PropTypes.elementType,
    className: PropTypes.string,
    type: PropTypes.string,
};

export default Input;
