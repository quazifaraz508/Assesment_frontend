import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import { authAPI } from '../services/api';
import {
    Users,
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Send,
    Timer,
    Eye,
    RefreshCw,
    Building2,
    Activity,
    X,
    Calendar
} from 'lucide-react';

const SuperadminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Modal state for extension
    const [extensionModal, setExtensionModal] = useState({ open: false, item: null });
    const [extensionDate, setExtensionDate] = useState('');
    const [actionLoading, setActionLoading] = useState({});

    const fetchDashboardStats = async () => {
        try {
            setRefreshing(true);
            const response = await authAPI.getDashboardStats();
            setStats(response.data);
            setError('');
        } catch (err) {
            console.error('Dashboard stats error:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const handleSendReminder = async (item) => {
        const key = `remind-${item.user_id}-${item.assessment_id}`;
        setActionLoading(prev => ({ ...prev, [key]: true }));

        try {
            // First, we need to find the submission ID or create a reminder endpoint
            // For now, we'll use a generic approach
            await authAPI.sendReminder(item.assessment_id);
            alert(`Reminder sent to ${item.user_name}`);
        } catch (err) {
            console.error('Failed to send reminder:', err);
            alert('Failed to send reminder. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleGrantExtension = async () => {
        if (!extensionDate || !extensionModal.item) return;

        const item = extensionModal.item;
        const key = `extend-${item.user_id}-${item.assessment_id}`;
        setActionLoading(prev => ({ ...prev, [key]: true }));

        try {
            // This would need a backend endpoint to grant late permission to a user for an assessment
            // For now, show success and close modal
            await authAPI.grantLatePermission(item.assessment_id, extensionDate);
            alert(`Extension granted to ${item.user_name} until ${extensionDate}`);
            setExtensionModal({ open: false, item: null });
            setExtensionDate('');
            fetchDashboardStats(); // Refresh data
        } catch (err) {
            console.error('Failed to grant extension:', err);
            alert('Failed to grant extension. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    if (loading) {
        return (
            <DashboardLayout
                title="Loading Dashboard..."
                subtitle="Please wait while we fetch your statistics."
            >
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout
                title="Dashboard Error"
                subtitle="There was a problem loading the dashboard."
            >
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <button
                        onClick={fetchDashboardStats}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`Welcome back, ${user?.name || 'Admin'}!`}
            subtitle="Here's an overview of your organization's assessments and activities."
        >
            {/* Overdue Alert Banner */}
            {stats?.overdue_submissions > 0 && (
                <div className="mb-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 shadow-lg shadow-red-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold">
                                {stats.overdue_submissions} Overdue Submission{stats.overdue_submissions > 1 ? 's' : ''} Require Attention
                            </p>
                            <p className="text-white/80 text-sm">
                                Review pending submissions and take action below
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => document.getElementById('action-table')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-4 py-2 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                    >
                        View All
                    </button>
                </div>
            )}

            {/* Refresh Button */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={fetchDashboardStats}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {/* Total Users */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Users size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats?.total_users || 0}</p>
                            <p className="text-sm text-slate-500">Total Users</p>
                        </div>
                    </div>
                    {stats?.new_users_this_week > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <TrendingUp size={14} />
                            +{stats.new_users_this_week} this week
                        </div>
                    )}
                </div>

                {/* Total Assessments */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-sky-100 shadow-lg shadow-sky-100/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                            <ClipboardList size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats?.total_assessments || 0}</p>
                            <p className="text-sm text-slate-500">Assessments</p>
                        </div>
                    </div>
                    {stats?.active_assessments > 0 && (
                        <div className="mt-3 text-sky-600 text-xs font-medium">
                            {stats.active_assessments} active now
                        </div>
                    )}
                </div>

                {/* Pending */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-100 shadow-lg shadow-amber-100/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Clock size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats?.pending_submissions || 0}</p>
                            <p className="text-sm text-slate-500">Pending</p>
                        </div>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-100/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <CheckCircle2 size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats?.completion_rate || 0}%</p>
                            <p className="text-sm text-slate-500">Completed</p>
                        </div>
                    </div>
                </div>

                {/* Overdue */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-red-100 shadow-lg shadow-red-100/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <AlertTriangle size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats?.overdue_submissions || 0}</p>
                            <p className="text-sm text-slate-500">Overdue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Progress Section */}
            {stats?.department_stats?.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-violet-600" />
                        <h3 className="text-lg font-bold text-slate-800">Department Progress</h3>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 p-6">
                        <div className="space-y-5">
                            {stats.department_stats.map((dept, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-slate-700">{dept.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-slate-500">
                                                {dept.total_submissions}/{dept.expected_submissions}
                                            </span>
                                            <span className={`text-sm font-bold ${dept.completion_rate >= 80 ? 'text-emerald-600' :
                                                    dept.completion_rate >= 50 ? 'text-amber-600' :
                                                        'text-red-600'
                                                }`}>
                                                {dept.completion_rate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${dept.completion_rate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                                    dept.completion_rate >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                        'bg-gradient-to-r from-red-500 to-rose-500'
                                                }`}
                                            style={{ width: `${Math.min(dept.completion_rate, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-1 text-xs text-slate-400">
                                        <span>{dept.total_users} users</span>
                                        {dept.pending > 0 && <span className="text-amber-500">{dept.pending} pending</span>}
                                        {dept.overdue > 0 && <span className="text-red-500">{dept.overdue} overdue</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Two Column Layout: Activity Feed + Action Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Feed */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-violet-600" />
                        <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 p-4 max-h-96 overflow-y-auto">
                        {stats?.recent_activity?.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recent_activity.map((activity, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-violet-50/50 transition-colors">
                                        <span className="text-2xl">{activity.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 truncate">{activity.message}</p>
                                            <p className="text-xs text-slate-400">{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Required Table */}
                <div id="action-table">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-bold text-slate-800">Action Required</h3>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden max-h-96 overflow-y-auto">
                        {stats?.action_items?.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="bg-gradient-to-r from-violet-50 to-purple-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-violet-600 uppercase">Employee</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-violet-600 uppercase">Assessment</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-violet-600 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-violet-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-violet-50">
                                    {stats.action_items.slice(0, 10).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-violet-50/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-700 truncate max-w-[120px]">{item.user_name}</div>
                                                <div className="text-xs text-slate-400">{item.user_department}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-slate-600 truncate max-w-[150px]">{item.assessment_title}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${item.status === 'overdue'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.status === 'overdue' ? '🔴 Overdue' : '🟡 Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleSendReminder(item)}
                                                        disabled={actionLoading[`remind-${item.user_id}-${item.assessment_id}`]}
                                                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Send Reminder"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setExtensionModal({ open: true, item });
                                                            // Set default date to 7 days from now
                                                            const defaultDate = new Date();
                                                            defaultDate.setDate(defaultDate.getDate() + 7);
                                                            setExtensionDate(defaultDate.toISOString().split('T')[0]);
                                                        }}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Grant Extension"
                                                    >
                                                        <Timer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/team/employee/${item.user_id}`)}
                                                        className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                                <p className="font-medium text-emerald-600">All caught up!</p>
                                <p className="text-sm">No pending actions required</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/assessments')}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 shadow hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
                >
                    <ClipboardList className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                    <span className="text-sm font-semibold text-slate-700">Manage Assessments</span>
                </button>
                <button
                    onClick={() => navigate('/users')}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 shadow hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
                >
                    <Users className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                    <span className="text-sm font-semibold text-slate-700">Manage Users</span>
                </button>
                <button
                    onClick={() => navigate('/reports')}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 shadow hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
                >
                    <TrendingUp className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                    <span className="text-sm font-semibold text-slate-700">View Reports</span>
                </button>
                <button
                    onClick={() => navigate('/settings')}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 shadow hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
                >
                    <Building2 className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                    <span className="text-sm font-semibold text-slate-700">Settings</span>
                </button>
            </div>

            {/* Extension Modal */}
            {extensionModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Grant Extension</h3>
                            <button
                                onClick={() => setExtensionModal({ open: false, item: null })}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-slate-600">
                                Grant extension to <span className="font-semibold">{extensionModal.item?.user_name}</span> for assessment <span className="font-semibold">{extensionModal.item?.assessment_title}</span>
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Calendar className="inline w-4 h-4 mr-1" />
                                New Deadline
                            </label>
                            <input
                                type="date"
                                value={extensionDate}
                                onChange={(e) => setExtensionDate(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setExtensionModal({ open: false, item: null })}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGrantExtension}
                                disabled={!extensionDate || actionLoading[`extend-${extensionModal.item?.user_id}-${extensionModal.item?.assessment_id}`]}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
                            >
                                Grant Extension
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default SuperadminDashboard;
