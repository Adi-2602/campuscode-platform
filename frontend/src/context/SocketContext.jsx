import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (isAuthenticated && token) {
            const socketInstance = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
                auth: {
                    token: token
                },
                transports: ['websocket'], // Forced websocket for cluster stability
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000
            });

            socketInstance.on('connect', () => {
                console.log('[Socket] Connected to server');
                setIsConnected(true);
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason);
                setIsConnected(false);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('[Socket] Connection Error:', error.message);
                setIsConnected(false);
            });

            setSocket(socketInstance);

            return () => {
                console.log('[Socket] Cleaning up connection');
                socketInstance.disconnect();
                setSocket(null);
                setIsConnected(false);
            };
        }
    }, [isAuthenticated, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
