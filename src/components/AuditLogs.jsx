import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import { authAPI } from '../services/api';
import {
    Shield,
    Search,
    Filter,
    Calendar,
    User,
    FileText,
    Settings,
    Trash2,
    Edit2,
    Plus,
    LogIn,
    LogOut,
    Key,
    Eye,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader,
    RefreshCw
} from 'lucide-react';

// Mock audit log data - in production this would come from the backend
const generateMockLogs = () => {
    const actions = [
        { type: 'login', icon: LogIn, color: 'emerald', description: 'User logged in' },
        { type: 'logout', icon: LogOut, color: 'slate', description: 'User logged out' },
        { type: 'create_assessment', icon: Plus, color: 'violet', description: 'Created new assessment' },
        { type: 'edit_assessment', icon: Edit2, color: 'blue', description: 'Edited assessment' },
        { type: 'delete_assessment', icon: Trash2, color: 'red', description: 'Deleted assessment' },
        { type: 'create_user', icon: Plus, color: 'emerald', description: 'Created new user' },
        { type: 'edit_user', icon: Edit2, color: 'blue', description: 'Updated user details' },
        { type: 'delete_user', icon: Trash2, color: 'red', description: 'Deleted user' },
        { type: 'password_reset', icon: Key, color: 'amber', description: 'Reset password' },
        { type: 'view_report', icon: Eye, color: 'indigo', description: 'Viewed report' },
        { type: 'settings_update', icon: Settings, color: 'purple', description: 'Updated settings' },
        { type: 'submit_assessment', icon: FileText, color: 'emerald', description: 'Submitted assessment' }
    ];

    const users = [
        { name: 'John Admin', email: 'admin@example.com', role: 'Super Admin' },
        { name: 'Sarah Manager', email: 'sarah@example.com', role: 'Admin' },
        { name: 'Mike Tech', email: 'mike@example.com', role: 'Employee' },
        { name: 'Lisa Content', email: 'lisa@example.com', role: 'Employee' }
    ];

    const logs = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const date = new Date(now);
        date.setMinutes(date.getMinutes() - i * Math.floor(Math.random() * 60 + 30));

        logs.push({
            id: i + 1,
            action: action.type,
            icon: action.icon,
            color: action.color,
            description: action.description,
            user: user.name,
            email: user.email,
            role: user.role,
            timestamp: date.toISOString(),
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            details: action.type.includes('assessment') ? 'Q4 Performance Review' :
                action.type.includes('user') ? 'employee@example.com' :
                    action.type === 'settings_update' ? 'Company settings' : null
        });
    }

    return logs;
};

const AuditLogs = ({ embedded = false }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterDate, setFilterDate] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 15;

    const actionTypes = [
        { value: 'all', label: 'All Actions' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' },
        { value: 'create_assessment', label: 'Create Assessment' },
        { value: 'edit_assessment', label: 'Edit Assessment' },
        { value: 'delete_assessment', label: 'Delete Assessment' },
        { value: 'create_user', label: 'Create User' },
        { value: 'edit_user', label: 'Edit User' },
        { value: 'delete_user', label: 'Delete User' },
        { value: 'password_reset', label: 'Password Reset' },
        { value: 'settings_update', label: 'Settings Update' }
    ];

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [logs, searchQuery, filterAction, filterDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // In production, this would be: const response = await authAPI.getAuditLogs();
            // For now, using mock data
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            setLogs(generateMockLogs());
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...logs];
        const now = new Date();

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(log =>
                log.user?.toLowerCase().includes(query) ||
                log.email?.toLowerCase().includes(query) ||
                log.description?.toLowerCase().includes(query) ||
                log.details?.toLowerCase().includes(query)
            );
        }

        // Action filter
        if (filterAction !== 'all') {
            result = result.filter(log => log.action === filterAction);
        }

        // Date filter
        if (filterDate !== 'all') {
            let startDate = new Date();
            if (filterDate === 'today') startDate.setHours(0, 0, 0, 0);
            else if (filterDate === 'week') startDate.setDate(startDate.getDate() - 7);
            else if (filterDate === 'month') startDate.setMonth(startDate.getMonth() - 1);

            result = result.filter(log => new Date(log.timestamp) >= startDate);
        }

        setFilteredLogs(result);
        setCurrentPage(1);
    };

    const handleExport = () => {
        let csv = 'Timestamp,User,Email,Action,Description,IP Address\n';
        filteredLogs.forEach(log => {
            csv += `"${new Date(log.timestamp).toLocaleString()}","${log.user}","${log.email}","${log.action}","${log.description}","${log.ip}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    const startIndex = (currentPage - 1) * logsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getActionIcon = (log) => {
        const Icon = log.icon || Shield;
        const colorClasses = {
            emerald: 'bg-emerald-100 text-emerald-600',
            red: 'bg-red-100 text-red-600',
            blue: 'bg-blue-100 text-blue-600',
            violet: 'bg-violet-100 text-violet-600',
            amber: 'bg-amber-100 text-amber-600',
            purple: 'bg-purple-100 text-purple-600',
            indigo: 'bg-indigo-100 text-indigo-600',
            slate: 'bg-slate-100 text-slate-600'
        };
        return (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[log.color] || colorClasses.slate}`}>
                <Icon size={20} />
            </div>
        );
    };

    const content = (
        <>
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by user, email, or action..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                    />
                </div>

                <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-700 font-medium"
                >
                    {actionTypes.map(action => (
                        <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                </select>

                <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-700 font-medium"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                </select>

                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-violet-200 text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all"
                >
                    <Download size={18} />
                    Export
                </button>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-violet-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">{filteredLogs.length}</p>
                    <p className="text-sm text-slate-500">Total Logs</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">
                        {filteredLogs.filter(l => l.action === 'login').length}
                    </p>
                    <p className="text-sm text-slate-500">Logins</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">
                        {filteredLogs.filter(l => l.action.includes('edit')).length}
                    </p>
                    <p className="text-sm text-slate-500">Edits</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-red-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">
                        {filteredLogs.filter(l => l.action.includes('delete')).length}
                    </p>
                    <p className="text-sm text-slate-500">Deletions</p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader size={32} className="animate-spin text-violet-500" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Details</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">IP Address</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-violet-50">
                                    {paginatedLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                No audit logs found
                                            </td>
                                        </tr>
                                    ) : paginatedLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-violet-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {getActionIcon(log)}
                                                    <span className="font-semibold text-slate-800">{log.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{log.user}</p>
                                                    <p className="text-sm text-slate-500">{log.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {log.details || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                                                    {log.ip}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{formatTimestamp(log.timestamp)}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-violet-50">
                                <p className="text-sm text-slate-500">
                                    Showing {startIndex + 1} to {Math.min(startIndex + logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg text-slate-600 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-semibold transition-colors ${currentPage === pageNum
                                                    ? 'bg-violet-600 text-white'
                                                    : 'text-slate-600 hover:bg-violet-100'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg text-slate-600 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout
            title="Audit Logs"
            subtitle="System activity and security logs"
        >
            {content}
        </DashboardLayout>
    );
};

export default AuditLogs;
