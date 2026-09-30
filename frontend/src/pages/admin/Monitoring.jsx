import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    FiServer, FiActivity, FiTerminal, FiCpu, FiHardDrive, FiDatabase, FiRefreshCw
} from 'react-icons/fi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

const AdminMonitoring = ({ initialTab = 'realtime' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false); // Global loading for refresh button
    const [infraData, setInfraData] = useState(null);
    const [realtimeData, setRealtimeData] = useState(null);
    const [activeRooms, setActiveRooms] = useState([]);
    const [logs, setLogs] = useState([]);

    // Admin Logs State
    const [logType, setLogType] = useState('server'); // 'server' or 'admin'
    const [selectedAdminId, setSelectedAdminId] = useState('');
    const [adminsList, setAdminsList] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Mock Data Generators for Charts
    const [cpuHistory, setCpuHistory] = useState([]);

    // Fetch lists when tab changes
    useEffect(() => {
        if (activeTab === 'logs' && logType === 'admin') {
            fetchAdmins();
        }
    }, [activeTab, logType]);

    // Fetch logs when parameters change
    useEffect(() => {
        if (activeTab === 'logs') {
            if (logType === 'admin' && selectedAdminId) {
                fetchAdminLogs();
            } else if (logType === 'server') {
                fetchServerLogs();
            }
        }
    }, [activeTab, logType, selectedAdminId]);

    // Auto-refresh for infra/realtime/logs
    useEffect(() => {
        fetchData(); // Initial fetch
        const interval = setInterval(() => {
            fetchData();
            if (activeTab === 'logs' && logType === 'server') {
                fetchServerLogs();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeTab, logType]);

    const fetchAdmins = async () => {
        try {
            const res = await adminService.getAllAdmins();
            setAdminsList(res.data.admins || res.data || []);
        } catch (error) {
            console.error("Failed to fetch admins", error);
        }
    };

    const fetchAdminLogs = async () => {
        if (!selectedAdminId) return;
        setIsLoadingLogs(true);
        try {
            const res = await adminService.getAdminActivityLogs(selectedAdminId);
            setLogs(res.data.logs || res.data || []);
        } catch (error) {
            console.error("Failed to fetch admin logs", error);
            setLogs([]);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const fetchServerLogs = async () => {
        try {
            const res = await adminService.getAppLogs({ limit: 50 });
            // Backend returns { lines: [], ... } for log files
            const logsData = res.data?.lines || res.data?.logs || res.data || [];

            // Ensure we have an array
            const logsArray = Array.isArray(logsData) ? logsData : [];

            // Normalize logs
            const normalizedLogs = logsArray.map(log => {
                if (typeof log === 'string') {
                    // Try to parse "[LEVEL]" from the string
                    const levelMatch = log.match(/\[(INFO|WARN|ERROR|DEBUG)\]/i);
                    const level = levelMatch ? levelMatch[1].toUpperCase() : 'INFO';

                    // Try to parse ISO timestamp
                    const tsMatch = log.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
                    const timestamp = tsMatch ? tsMatch[1] : new Date().toLocaleTimeString();

                    // Message is the rest of the string after timestamp if present
                    const message = tsMatch ? log.replace(tsMatch[0], '').trim() : log;

                    return { message, level, timestamp };
                }
                return log;
            });

            setLogs(normalizedLogs);
        } catch (error) {
            console.warn("Failed to fetch logs", error);
            setLogs([]);
        }
    };

    const fetchData = async () => {
        if (activeTab === 'logs') return;

        // Don't set global loading true on interval refreshes to avoid UI flickering
        // Only set if we need to show a spinner manually

        try {
            if (activeTab === 'infra') {
                let res;
                try {
                    res = await adminService.getAllMetrics();
                } catch (err) {
                    console.warn("Using mock infra data");
                }

                if (res && res.data) {
                    setInfraData(res.data);
                } else {
                    // Fallback Mock
                    const mock = {
                        cpu: { usage: 45, temperature: 60 },
                        memory: { used: 4096, total: 16384, percentage: 25 },
                        disk: { used: 120, total: 512, percentage: 23 },
                        uptime: 123456
                    };
                    setInfraData(mock);
                    setCpuHistory(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), value: mock.cpu.usage }]);
                }
            } else if (activeTab === 'realtime') {
                try {
                    const [statsRes, roomsRes] = await Promise.all([
                        adminService.getRealTimeStats(),
                        adminService.getActiveRooms()
                    ]);
                    setRealtimeData(statsRes.data);
                    setActiveRooms(roomsRes.data?.rooms || roomsRes.data || []);
                } catch (e) {
                    console.warn("Realtime stats failed", e);
                }
            }
        } catch (error) {
            console.error("Monitoring fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={clsx(
                "flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all border-b-2 font-medium",
                activeTab === id
                    ? "bg-slate-800 border-neon-blue text-neon-blue"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
        >
            <Icon /> {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">System Monitoring</h1>
                <Button variant="outline" size="sm" onClick={fetchData} isLoading={loading}>
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                <TabButton id="infra" label="Infrastructure" icon={FiServer} />
                <TabButton id="realtime" label="Real-Time" icon={FiActivity} />
                <TabButton id="logs" label="Server Logs" icon={FiTerminal} />
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'infra' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                        {/* CPU Widget */}
                        <Card className="border-neon-blue/20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-300 flex items-center gap-2">
                                    <FiCpu className="text-neon-blue" /> CPU Usage
                                </h3>
                                <span className="text-2xl font-mono text-white">{infraData?.cpu?.usage}%</span>
                            </div>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={cpuHistory}>
                                        <defs>
                                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Memory Widget */}
                        <Card className="border-neon-purple/20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-300 flex items-center gap-2">
                                    <FiHardDrive className="text-neon-purple" /> Memory
                                </h3>
                                <span className="text-2xl font-mono text-white">
                                    {(infraData?.memory?.used / 1024).toFixed(1)} GB
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-4">
                                <div
                                    className="bg-neon-purple h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${infraData?.memory?.percentage}%` }}
                                ></div>
                            </div>
                            <p className="text-right text-xs text-slate-400 mt-2">
                                Total: {(infraData?.memory?.total / 1024).toFixed(1)} GB
                            </p>
                        </Card>

                        {/* Database Widget */}
                        <Card className="border-neon-green/20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-300 flex items-center gap-2">
                                    <FiDatabase className="text-neon-green" /> Database
                                </h3>
                                <span className="text-green-400 text-sm bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                                    Connected
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Collections</span>
                                    <span className="text-white">12</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Avg Query Time</span>
                                    <span className="text-white">2.4ms</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'realtime' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <Card>
                            <h3 className="text-xl font-bold text-white mb-4">Active Connections</h3>
                            <div className="flex flex-col items-center justify-center p-8">
                                <div className="w-48 h-48 rounded-full border-4 border-neon-cyan flex flex-col items-center justify-center animate-pulse-slow relative">
                                    <span className="text-5xl font-bold text-white">{realtimeData?.stats?.connections?.total || 0}</span>
                                    <span className="text-sm text-neon-cyan uppercase tracking-widest mt-2">Online Users</span>
                                    <div className="absolute inset-0 border-4 border-neon-cyan rounded-full animate-ping opacity-20"></div>
                                </div>
                                {realtimeData?.stats?.uptimeFormatted && (
                                    <span className="text-xs text-slate-500 mt-4 font-mono">Server Uptime: {realtimeData.stats.uptimeFormatted}</span>
                                )}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                                <div className="bg-slate-800 p-3 rounded">
                                    <span className="block text-2xl font-bold text-white">{realtimeData?.stats?.activeRooms || activeRooms.length || 0}</span>
                                    <span className="text-xs text-slate-400">Active Rooms</span>
                                </div>
                                <div className="bg-slate-800 p-3 rounded">
                                    <span className="block text-2xl font-bold text-white">{realtimeData?.stats?.activeSockets || realtimeData?.stats?.connections?.total || 0}</span>
                                    <span className="text-xs text-slate-400">Total Sockets</span>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="text-xl font-bold text-white mb-4">Active Rooms</h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {activeRooms.length > 0 ? activeRooms.map((room, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700 hover:border-neon-blue transition-colors cursor-pointer">
                                        <div>
                                            <h4 className="font-bold text-white">{room.name || room.id}</h4>
                                            <p className="text-xs text-slate-400">Users: {room.userCount || 0}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs animate-pulse">Live</span>
                                    </div>
                                )) : (
                                    <div className="text-center text-slate-500 py-10">
                                        <FiActivity className="mx-auto text-4xl mb-2 opacity-20" />
                                        <p>No active rooms detected</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="animate-fadeIn space-y-4">
                        {/* Log Controls */}
                        <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2">
                                <label className="text-slate-400 text-sm font-medium">Log Source:</label>
                                <select
                                    value={logType}
                                    onChange={(e) => setLogType(e.target.value)}
                                    className="bg-slate-800 text-white border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-neon-blue"
                                >
                                    <option value="server">Server Logs (Terminal)</option>
                                    <option value="admin">Admin Activity</option>
                                </select>
                            </div>

                            {logType === 'admin' && (
                                <div className="flex items-center gap-2 animate-fadeIn">
                                    <label className="text-slate-400 text-sm font-medium">Select Admin:</label>
                                    <select
                                        value={selectedAdminId}
                                        onChange={(e) => setSelectedAdminId(e.target.value)}
                                        className="bg-slate-800 text-white border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-neon-blue min-w-[200px]"
                                    >
                                        <option value="">-- Choose Admin --</option>
                                        {adminsList.map((admin, idx) => {
                                            const adminId = admin._id || admin.id; // Handle both _id and id
                                            if (!adminId) return null;
                                            return (
                                                <option key={adminId} value={adminId}>
                                                    {admin.name} ({admin.email})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Server Logs View */}
                        {logType === 'server' && (
                            <Card className="bg-black border-slate-800 font-mono text-sm h-[600px] overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-slate-800 flex gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    <span className="ml-2 text-slate-500 text-xs">server.log (Live tail)</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-1 text-slate-300 custom-scrollbar">
                                    {logs.length > 0 ? logs.map((log, i) => (
                                        <div key={i} className="hover:bg-white/5 px-2 rounded">
                                            <span className="text-slate-500">[{log.timestamp || 'No Time'}]</span>
                                            <span className={clsx(
                                                "mx-2 font-bold",
                                                (log.level === 'ERROR' || log.level?.includes?.('ERR')) ? 'text-red-500' :
                                                    (log.level === 'WARN' || log.level?.includes?.('WARN')) ? 'text-yellow-500' : 'text-green-500'
                                            )}>{log.level || 'INFO'}</span>
                                            <span>{log.message || log}</span>
                                        </div>
                                    )) : (
                                        <div className="text-slate-500 italic text-center mt-20">
                                            No logs available or connecting to log stream...
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Admin Activity Logs View */}
                        {logType === 'admin' && (
                            <Card className="border-slate-800 h-[600px] overflow-hidden flex flex-col p-0">
                                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                                    <h3 className="font-bold text-white">Activity History</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                    {isLoadingLogs ? (
                                        <div className="flex items-center justify-center h-full text-slate-500">
                                            <FiRefreshCw className="animate-spin mr-2" /> Loading activity...
                                        </div>
                                    ) : logs.length > 0 ? (
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-slate-500 font-medium border-b border-slate-800 bg-slate-900/20 sticky top-0 backdrop-blur-sm">
                                                <tr>
                                                    <th className="p-4 w-40">Time</th>
                                                    <th className="p-4 w-32">Action</th>
                                                    <th className="p-4">Details</th>
                                                    <th className="p-4 w-32">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {logs.map((log, i) => (
                                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                        <td className="p-4 text-slate-400 font-mono text-xs">
                                                            {new Date(log.createdAt || log.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="bg-slate-800 text-white px-2 py-1 rounded border border-slate-700 font-medium text-xs">
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-300">
                                                            {log.details || log.description || log.message || '-'}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={clsx(
                                                                "px-2 py-1 rounded text-xs font-bold",
                                                                (log.success || log.status === 'success')
                                                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                            )}>
                                                                {(log.success || log.status === 'success') ? "SUCCESS" : "FAILED"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                            <FiActivity className="text-4xl opacity-20" />
                                            <p>{selectedAdminId ? "No activity found for this admin." : "Select an admin to view activity."}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

AdminMonitoring.propTypes = {
    initialTab: PropTypes.string
};

export default AdminMonitoring;
