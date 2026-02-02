import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import { authAPI } from '../services/api';
import {
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';

const getDepartmentDisplay = (assessment) => {
    try {
        if (Array.isArray(assessment.departments)) {
            return assessment.departments.join(', ');
        }
        return assessment.departments || 'N/A';
    } catch (e) {
        return 'N/A';
    }
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [teamStatus, setTeamStatus] = useState([]);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await authAPI.getEmployeeAssessments();
                const now = new Date();
                const sorted = res.data.sort((a, b) => {
                    const endA = new Date(a.end_date);
                    const endB = new Date(b.end_date);
                    const isExpiredA = now > endA;
                    const isExpiredB = now > endB;
                    const isEditableA = a.is_submitted && !isExpiredA;
                    const isEditableB = b.is_submitted && !isExpiredB;
                    const isViewOnlyA = a.is_submitted && isExpiredA;
                    const isViewOnlyB = b.is_submitted && isExpiredB;
                    const isPendingA = !a.is_submitted && !isExpiredA;
                    const isPendingB = !b.is_submitted && !isExpiredB;

                    const getPriority = (isEditable, isViewOnly, isPending) => {
                        if (isPending) return 0;
                        if (isEditable) return 1;
                        if (isViewOnly) return 2;
                        return 3;
                    };

                    const priorityA = getPriority(isEditableA, isViewOnlyA, isPendingA);
                    const priorityB = getPriority(isEditableB, isViewOnlyB, isPendingB);

                    if (priorityA !== priorityB) return priorityA - priorityB;
                    return endA - endB;
                });
                setAssessments(sorted);
            } catch (e) {
                console.error("Failed to fetch assessments", e);
            }
        };

        const fetchTeamStatus = async () => {
            try {
                const res = await authAPI.getTeamStatus();
                setTeamStatus(res.data);
            } catch (e) {
                // Ignore if not manager
            }
        };

        fetchAssessments();
        fetchTeamStatus();
    }, []);



    return (
        <DashboardLayout
            title={`Welcome back, ${user?.name || 'Employee'}!`}
            subtitle="Here's an overview of your assessments and activities."
        >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <ClipboardList size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{assessments.length}</p>
                            <p className="text-sm text-slate-500">Total Assessments</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-100/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <CheckCircle2 size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {assessments.filter(a => a.is_submitted).length}
                            </p>
                            <p className="text-sm text-slate-500">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-100 shadow-lg shadow-amber-100/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Clock size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {assessments.filter(a => !a.is_submitted && new Date() <= new Date(a.end_date)).length}
                            </p>
                            <p className="text-sm text-slate-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-red-100 shadow-lg shadow-red-100/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <AlertCircle size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {assessments.filter(a => !a.is_submitted && new Date() > new Date(a.end_date)).length}
                            </p>
                            <p className="text-sm text-slate-500">Overdue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Overview for Managers */}
            {teamStatus.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Team Overview</h3>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Assessment</th>
                                        <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-violet-50">
                                    {teamStatus.slice(0, 5).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-violet-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{item.employee_name}</div>
                                                <div className="text-sm text-slate-400">{item.employee_email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{item.assessment_title}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Submitted' ? 'bg-sky-100 text-sky-700' :
                                                    item.status === 'Expired' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">
                                                {new Date(item.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/team/employee/${item.employee_id}`)}
                                                    className="px-4 py-2 bg-white border border-violet-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-violet-50 hover:border-violet-300 transition-all"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}



            {/* Assessments */}
            {assessments.length > 0 && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">My Assessments</h3>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-violet-600 font-bold text-sm hover:text-violet-700 flex items-center gap-1 transition-colors"
                        >
                            {showAll ? 'Show Less' : 'See All'}
                            <ChevronRight size={16} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
                        </button>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
                        {(showAll ? assessments : assessments.slice(0, 6)).map(assessment => {
                            const isExpired = new Date() > new Date(assessment.end_date);
                            const isSubmitted = assessment.is_submitted;
                            const canView = isSubmitted && isExpired;
                            const canEdit = isSubmitted && !isExpired;
                            const canStart = !isSubmitted && !isExpired;

                            return (
                                <div
                                    key={assessment.id}
                                    className={`bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 ${isSubmitted || isExpired ? 'opacity-75' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className={`text-base font-bold ${isSubmitted || isExpired ? 'text-slate-500' : 'text-slate-800'}`}>
                                            {assessment.title}
                                        </h4>
                                        {isSubmitted && (
                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                                                Done
                                            </span>
                                        )}
                                        {!isSubmitted && isExpired && (
                                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                                                Expired
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-500 text-sm mb-1">Dept: {getDepartmentDisplay(assessment)}</p>
                                    <p className="text-slate-400 text-xs mb-4">
                                        Due: {new Date(assessment.end_date).toLocaleDateString()}
                                    </p>
                                    <button
                                        onClick={() => navigate(`/assessments/${assessment.id}`)}
                                        disabled={!canView && !canEdit && !canStart}
                                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${canStart || canEdit
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5'
                                            : canView
                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {canView ? 'View' : canEdit ? 'Edit' : canStart ? 'Start' : 'Expired'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


        </DashboardLayout>
    );
};

// Need to import this icon since we use it
import { ClipboardList } from 'lucide-react';

export default Dashboard;
