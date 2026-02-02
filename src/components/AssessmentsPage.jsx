import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import AdminAssessments from './AdminAssessments';
import AssessmentTracker from './AssessmentTracker';
import { ClipboardList, ListChecks } from 'lucide-react';

const AssessmentsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('manage');

    const tabs = [
        { id: 'manage', label: 'Manage Assessments', icon: ClipboardList },
        { id: 'tracker', label: 'Submission Tracker', icon: ListChecks },
    ];

    return (
        <DashboardLayout title="Assessments" subtitle="Create, manage, and track assessments">
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
                {activeTab === 'manage' && <AdminAssessments embedded />}
                {activeTab === 'tracker' && <AssessmentTracker embedded />}
            </div>
        </DashboardLayout>
    );
};

export default AssessmentsPage;
