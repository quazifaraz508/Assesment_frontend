import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Reports from './Reports';
import AdminGlobalHistory from './AdminGlobalHistory';
import AuditLogs from './AuditLogs';
import { BarChart3, History, ScrollText } from 'lucide-react';

const ReportsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('analytics');

    const tabs = [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'history', label: 'Submission History', icon: History },
        ...(user?.is_superuser ? [{ id: 'audit', label: 'Audit Logs', icon: ScrollText }] : []),
    ];

    return (
        <DashboardLayout title="Reports" subtitle="Analytics, history, and activity logs">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-violet-100 pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
                            ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                                : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                            }
                        `}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'analytics' && <Reports embedded />}
                {activeTab === 'history' && <AdminGlobalHistory embedded />}
                {activeTab === 'audit' && <AuditLogs embedded />}
            </div>
        </DashboardLayout>
    );
};

export default ReportsPage;
