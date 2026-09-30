import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, hover = false, ...props }) => {
    return (
        <div
            className={twMerge(
                'glass-card rounded-2xl p-6 transition-all duration-300',
                hover && 'hover:-translate-y-1 hover:shadow-neon-blue/20 hover:border-neon-blue/50',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

Card.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    hover: PropTypes.bool,
};

export default Card;
