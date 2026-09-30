import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ImSpinner8 } from 'react-icons/im';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading = false,
    fullWidth = false,
    disabled,
    type = 'button',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variants = {
        primary: 'bg-neon-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 focus:ring-neon-blue',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 focus:ring-slate-500',
        danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 focus:ring-red-500',
        success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500',
        outline: 'border-2 border-neon-blue text-neon-blue hover:bg-neon-blue/10 focus:ring-neon-blue',
        ghost: 'text-slate-300 hover:text-white hover:bg-slate-800 focus:ring-slate-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            type={type}
            className={twMerge(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <ImSpinner8 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'ghost']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
