import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (e) {
                console.error("Failed to parse stored user", e);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            toast.success(`Welcome back, ${user.name}!`);
            return user;
        } catch (error) {
            const message = error.response?.data?.error || 'Login failed';
            toast.error(message);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            toast.success('Registration successful! Please login.');
            return response.data;
        } catch (error) {
            const message = error.response?.data?.error || 'Registration failed';
            toast.error(message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        token,
        login,
        logout,
        register,
        isAuthenticated: !!token,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
