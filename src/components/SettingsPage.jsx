import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import AdminSettings from './AdminSettings';
import AdminSlackSettings from './AdminSlackSettings';
import DepartmentManagement from './DepartmentManagement';
import { Settings, MessageSquare, Building2 } from 'lucide-react';

const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'slack', label: 'Slack', icon: MessageSquare },
        ...(user?.is_superuser ? [{ id: 'departments', label: 'Departments', icon: Building2 }] : []),
    ];

    return (
        <DashboardLayout title="Settings" subtitle="Configure application settings">
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
                {activeTab === 'general' && <AdminSettings embedded />}
                {activeTab === 'slack' && <AdminSlackSettings embedded />}
                {activeTab === 'departments' && <DepartmentManagement embedded />}
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
