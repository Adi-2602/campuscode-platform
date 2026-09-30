import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { ImSpinner8 } from "react-icons/im";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900">
                <ImSpinner8 className="animate-spin text-4xl text-neon-blue" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role) && !allowedRoles.includes(user.roles?.[0])) {
        // Check both 'role' (string) and 'roles' (array) to be safe with different backend responses
        return <Navigate to="/403" replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
