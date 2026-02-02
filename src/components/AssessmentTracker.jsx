import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import CustomPopup from './CustomPopup';
import { authAPI } from '../services/api';
import {
    ClipboardList,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Users,
    Building2,
    ChevronDown,
    ChevronRight,
    Send,
    Calendar,
    Loader,
    Bell,
    Unlock
} from 'lucide-react';

const AssessmentTracker = ({ embedded = false }) => {
    const { user } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [viewMode, setViewMode] = useState('assessment'); // 'assessment' or 'department'
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [expandedDepts, setExpandedDepts] = useState({});

    // Late permission modal
    const [showLatePermissionModal, setShowLatePermissionModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [newDeadline, setNewDeadline] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const DEPARTMENTS = ['Technical', 'Content', 'Youtube', 'Calling', 'HR', 'Finance'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assessmentsRes, submissionsRes] = await Promise.all([
                authAPI.getAssessments(),
                authAPI.getAllSubmissions()
            ]);
            setAssessments(assessmentsRes.data || []);
            setSubmissions(submissionsRes.data || []);

            // Auto-select first assessment
            if (assessmentsRes.data?.length > 0 && !selectedAssessment) {
                setSelectedAssessment(assessmentsRes.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAssessmentStats = (assessment) => {
        const relatedSubs = submissions.filter(s => s.assessment_id === assessment.id);
        const now = new Date();
        const completed = relatedSubs.filter(s => s.is_submitted).length;
        const pending = relatedSubs.filter(s => !s.is_submitted && new Date(s.end_date) >= now).length;
        const overdue = relatedSubs.filter(s => !s.is_submitted && new Date(s.end_date) < now).length;
        return { completed, pending, overdue, total: relatedSubs.length };
    };

    const getFilteredSubmissions = () => {
        if (!selectedAssessment) return [];

        let result = submissions.filter(s => s.assessment_id === selectedAssessment.id);
        const now = new Date();

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.employee_name?.toLowerCase().includes(query) ||
                s.employee_email?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            if (filterStatus === 'completed') {
                result = result.filter(s => s.is_submitted);
            } else if (filterStatus === 'pending') {
                result = result.filter(s => !s.is_submitted && new Date(s.end_date) >= now);
            } else if (filterStatus === 'overdue') {
                result = result.filter(s => !s.is_submitted && new Date(s.end_date) < now);
            }
        }

        // Department filter
        if (filterDepartment !== 'all') {
            result = result.filter(s => s.department === filterDepartment);
        }

        return result;
    };

    const groupByDepartment = () => {
        const filtered = getFilteredSubmissions();
        const grouped = {};

        filtered.forEach(sub => {
            const dept = sub.department || 'Unknown';
            if (!grouped[dept]) {
                grouped[dept] = { name: dept, submissions: [], completed: 0, pending: 0, overdue: 0 };
            }
            grouped[dept].submissions.push(sub);

            const now = new Date();
            if (sub.is_submitted) grouped[dept].completed++;
            else if (new Date(sub.end_date) >= now) grouped[dept].pending++;
            else grouped[dept].overdue++;
        });

        return Object.values(grouped);
    };

    const toggleDept = (dept) => {
        setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
    };

    const openLatePermissionModal = (submission) => {
        setSelectedSubmission(submission);
        // Set default new deadline to 7 days from now
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 7);
        setNewDeadline(newDate.toISOString().slice(0, 16));
        setShowLatePermissionModal(true);
    };

    const handleGrantLatePermission = async () => {
        setFormLoading(true);
        try {
            await authAPI.grantLatePermission(selectedSubmission.id, newDeadline);
            setShowLatePermissionModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to grant late permission:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleSendReminder = async (submission) => {
        try {
            await authAPI.sendReminder(submission.id);
            alert('Reminder sent successfully!');
        } catch (error) {
            console.error('Failed to send reminder:', error);
            alert('Failed to send reminder');
        }
    };

    const getStatusBadge = (submission) => {
        const now = new Date();
        if (submission.is_submitted) {
            return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> Submitted</span>;
        }
        if (new Date(submission.end_date) < now) {
            return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1"><AlertTriangle size={12} /> Overdue</span>;
        }
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1"><Clock size={12} /> Pending</span>;
    };

    const filteredSubmissions = getFilteredSubmissions();
    const departmentGroups = groupByDepartment();

    const content = (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Assessment List Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                        <div className="p-4 border-b border-violet-50">
                            <h3 className="font-bold text-slate-800">Assessments</h3>
                        </div>
                        <div className="divide-y divide-violet-50 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader className="animate-spin text-violet-500 mx-auto" size={24} />
                                </div>
                            ) : assessments.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    No assessments found
                                </div>
                            ) : assessments.map(assessment => {
                                const stats = getAssessmentStats(assessment);
                                const isSelected = selectedAssessment?.id === assessment.id;
                                return (
                                    <button
                                        key={assessment.id}
                                        onClick={() => setSelectedAssessment(assessment)}
                                        className={`w-full p-4 text-left hover:bg-violet-50/50 transition-colors ${isSelected ? 'bg-violet-50 border-l-4 border-violet-500' : ''}`}
                                    >
                                        <p className="font-semibold text-slate-800 truncate">{assessment.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Due: {new Date(assessment.end_date).toLocaleDateString()}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{stats.completed}</span>
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{stats.pending}</span>
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{stats.overdue}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Filters Row */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* View Mode Toggle */}
                        <div className="flex bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 p-1">
                            <button
                                onClick={() => setViewMode('assessment')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'assessment' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-violet-50'}`}
                            >
                                <Users size={16} className="inline mr-2" />
                                By Employee
                            </button>
                            <button
                                onClick={() => setViewMode('department')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'department' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-violet-50'}`}
                            >
                                <Building2 size={16} className="inline mr-2" />
                                By Department
                            </button>
                        </div>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-700 font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                        </select>

                        {/* Department Filter */}
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-700 font-medium"
                        >
                            <option value="all">All Departments</option>
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Stats Summary */}
                    {selectedAssessment && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-emerald-500" size={24} />
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">
                                            {filteredSubmissions.filter(s => s.is_submitted).length}
                                        </p>
                                        <p className="text-sm text-slate-500">Completed</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <Clock className="text-amber-500" size={24} />
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">
                                            {filteredSubmissions.filter(s => !s.is_submitted && new Date(s.end_date) >= new Date()).length}
                                        </p>
                                        <p className="text-sm text-slate-500">Pending</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-red-100">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="text-red-500" size={24} />
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">
                                            {filteredSubmissions.filter(s => !s.is_submitted && new Date(s.end_date) < new Date()).length}
                                        </p>
                                        <p className="text-sm text-slate-500">Overdue</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!selectedAssessment ? (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg p-12 text-center">
                            <ClipboardList size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Select an assessment to view submissions</p>
                        </div>
                    ) : viewMode === 'assessment' ? (
                        /* Employee List View */
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Deadline</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-violet-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-violet-50">
                                    {filteredSubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                No submissions found
                                            </td>
                                        </tr>
                                    ) : filteredSubmissions.map(sub => (
                                        <tr key={sub.id} className="hover:bg-violet-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {sub.employee_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{sub.employee_name}</p>
                                                        <p className="text-sm text-slate-500">{sub.employee_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{sub.department || '-'}</td>
                                            <td className="px-6 py-4">{getStatusBadge(sub)}</td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {new Date(sub.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!sub.is_submitted && (
                                                        <>
                                                            <button
                                                                onClick={() => handleSendReminder(sub)}
                                                                className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                                                                title="Send Reminder"
                                                            >
                                                                <Bell size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => openLatePermissionModal(sub)}
                                                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                                title="Grant Late Permission"
                                                            >
                                                                <Unlock size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Department Group View */
                        <div className="space-y-4">
                            {departmentGroups.length === 0 ? (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg p-12 text-center">
                                    <p className="text-slate-400">No submissions found</p>
                                </div>
                            ) : departmentGroups.map(dept => (
                                <div key={dept.name} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleDept(dept.name)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-violet-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Building2 size={24} className="text-violet-500" />
                                            <div className="text-left">
                                                <p className="font-bold text-slate-800">{dept.name}</p>
                                                <p className="text-sm text-slate-500">{dept.submissions.length} employees</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-2">
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{dept.completed} done</span>
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{dept.pending} pending</span>
                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{dept.overdue} overdue</span>
                                            </div>
                                            <ChevronDown
                                                size={20}
                                                className={`text-slate-400 transition-transform ${expandedDepts[dept.name] ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </button>
                                    {expandedDepts[dept.name] && (
                                        <div className="border-t border-violet-50 divide-y divide-violet-50">
                                            {dept.submissions.map(sub => (
                                                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-violet-50/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                            {sub.employee_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{sub.employee_name}</p>
                                                            <p className="text-xs text-slate-500">{sub.employee_email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {getStatusBadge(sub)}
                                                        {!sub.is_submitted && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleSendReminder(sub)}
                                                                    className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                                                                    title="Send Reminder"
                                                                >
                                                                    <Bell size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openLatePermissionModal(sub)}
                                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                                    title="Grant Late Permission"
                                                                >
                                                                    <Unlock size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Late Permission Modal */}
            <CustomPopup show={showLatePermissionModal} onClose={() => setShowLatePermissionModal(false)}>
                <div className="p-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} className="text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Grant Late Permission</h2>
                    <p className="text-slate-500 mb-6 text-center">
                        Extend the deadline for <strong>{selectedSubmission?.employee_name}</strong>
                    </p>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">New Deadline</label>
                        <input
                            type="datetime-local"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowLatePermissionModal(false)}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGrantLatePermission}
                            disabled={formLoading}
                            className="flex-1 py-3 px-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {formLoading ? <Loader className="animate-spin" size={20} /> : <Unlock size={20} />}
                            Grant Permission
                        </button>
                    </div>
                </div>
            </CustomPopup>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout
            title="Assessment Tracker"
            subtitle="Track who has filled and who hasn't submitted their assessments"
        >
            {content}
        </DashboardLayout>
    );
};

export default AssessmentTracker;
