import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import { authAPI } from '../services/api';
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    Users,
    Building2,
    BarChart3,
    PieChart,
    Filter,
    Loader,
    CheckCircle2,
    AlertTriangle,
    Clock
} from 'lucide-react';

const Reports = ({ embedded = false }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const [stats, setStats] = useState({
        totalAssessments: 0,
        completionRate: 0,
        averageScore: 0,
        overdueCount: 0,
        topPerformers: [],
        departmentComparison: [],
        monthlyTrend: []
    });

    const DEPARTMENTS = ['Technical', 'Content', 'Youtube', 'Calling', 'HR', 'Finance'];

    useEffect(() => {
        fetchReportData();
    }, [dateRange, selectedDepartment]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const [assessmentsRes, submissionsRes] = await Promise.all([
                authAPI.getAssessments(),
                authAPI.getAllSubmissions()
            ]);

            const assessments = assessmentsRes.data || [];
            let submissions = submissionsRes.data || [];
            const now = new Date();

            // Apply department filter
            if (selectedDepartment !== 'all') {
                submissions = submissions.filter(s => s.department === selectedDepartment);
            }

            // Apply date range filter
            let startDate = new Date();
            if (dateRange === 'week') startDate.setDate(startDate.getDate() - 7);
            else if (dateRange === 'month') startDate.setMonth(startDate.getMonth() - 1);
            else if (dateRange === 'quarter') startDate.setMonth(startDate.getMonth() - 3);
            else if (dateRange === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

            const filteredSubmissions = submissions.filter(s =>
                new Date(s.created_at || s.start_date) >= startDate
            );

            // Calculate stats
            const completed = filteredSubmissions.filter(s => s.is_submitted);
            const overdue = filteredSubmissions.filter(s => !s.is_submitted && new Date(s.end_date) < now);
            const completionRate = filteredSubmissions.length > 0
                ? Math.round((completed.length / filteredSubmissions.length) * 100)
                : 0;

            // Average score (mock - would need actual score data)
            const averageScore = completed.length > 0
                ? Math.round(completed.reduce((acc, s) => acc + (s.score || 75 + Math.random() * 25), 0) / completed.length)
                : 0;

            // Top performers (mock data based on submissions)
            const performerMap = {};
            completed.forEach(s => {
                if (!performerMap[s.employee_id]) {
                    performerMap[s.employee_id] = {
                        name: s.employee_name,
                        department: s.department,
                        completed: 0,
                        avgScore: 0
                    };
                }
                performerMap[s.employee_id].completed++;
                performerMap[s.employee_id].avgScore = 80 + Math.random() * 20; // Mock score
            });
            const topPerformers = Object.values(performerMap)
                .sort((a, b) => b.completed - a.completed)
                .slice(0, 5);

            // Department comparison
            const deptMap = {};
            filteredSubmissions.forEach(s => {
                const dept = s.department || 'Unknown';
                if (!deptMap[dept]) {
                    deptMap[dept] = { name: dept, total: 0, completed: 0, rate: 0 };
                }
                deptMap[dept].total++;
                if (s.is_submitted) deptMap[dept].completed++;
            });
            const departmentComparison = Object.values(deptMap).map(d => ({
                ...d,
                rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0
            })).sort((a, b) => b.rate - a.rate);

            // Monthly trend (last 6 months)
            const monthlyTrend = [];
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date();
                monthDate.setMonth(monthDate.getMonth() - i);
                const monthName = monthDate.toLocaleString('default', { month: 'short' });
                const monthSubs = submissions.filter(s => {
                    const subDate = new Date(s.created_at || s.start_date);
                    return subDate.getMonth() === monthDate.getMonth() &&
                        subDate.getFullYear() === monthDate.getFullYear();
                });
                const monthCompleted = monthSubs.filter(s => s.is_submitted).length;
                monthlyTrend.push({
                    month: monthName,
                    completed: monthCompleted,
                    total: monthSubs.length,
                    rate: monthSubs.length > 0 ? Math.round((monthCompleted / monthSubs.length) * 100) : 0
                });
            }

            setStats({
                totalAssessments: assessments.length,
                completionRate,
                averageScore,
                overdueCount: overdue.length,
                topPerformers,
                departmentComparison,
                monthlyTrend
            });
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        // Generate CSV content
        let csv = 'Department,Total,Completed,Completion Rate\n';
        stats.departmentComparison.forEach(d => {
            csv += `${d.name},${d.total},${d.completed},${d.rate}%\n`;
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessment_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        // For PDF export, we'd typically use a library like jsPDF
        // For now, show an alert
        alert('PDF export feature coming soon! Use CSV export for now.');
    };

    const content = (
        <>
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 p-1">
                    {['week', 'month', 'quarter', 'year'].map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${dateRange === range
                                ? 'bg-violet-600 text-white'
                                : 'text-slate-600 hover:bg-violet-50'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-700 font-medium"
                >
                    <option value="all">All Departments</option>
                    {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>

                <div className="flex-1" />

                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <FileText size={18} />
                        Export PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader size={32} className="animate-spin text-violet-500" />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-violet-100 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <FileText size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">{stats.totalAssessments}</p>
                                    <p className="text-sm text-slate-500">Total Assessments</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-emerald-100 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">{stats.completionRate}%</p>
                                    <p className="text-sm text-slate-500">Completion Rate</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <TrendingUp size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">{stats.averageScore}</p>
                                    <p className="text-sm text-slate-500">Average Score</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-red-100 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                    <AlertTriangle size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">{stats.overdueCount}</p>
                                    <p className="text-sm text-slate-500">Overdue</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Monthly Trend */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-violet-50">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={20} className="text-violet-600" />
                                    <h3 className="text-lg font-bold text-slate-800">Monthly Trend</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-end justify-between h-48 gap-2">
                                    {stats.monthlyTrend.map((month, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center">
                                            <div
                                                className="w-full bg-gradient-to-t from-violet-500 to-purple-500 rounded-t-lg transition-all hover:from-violet-600 hover:to-purple-600"
                                                style={{ height: `${Math.max(month.rate, 5)}%` }}
                                                title={`${month.rate}% completion`}
                                            />
                                            <p className="text-xs text-slate-500 mt-2">{month.month}</p>
                                            <p className="text-xs font-bold text-violet-600">{month.rate}%</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Department Comparison */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-violet-50">
                                <div className="flex items-center gap-2">
                                    <Building2 size={20} className="text-violet-600" />
                                    <h3 className="text-lg font-bold text-slate-800">Department Comparison</h3>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {stats.departmentComparison.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No department data available</p>
                                ) : stats.departmentComparison.map((dept, idx) => (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-slate-700">{dept.name}</span>
                                            <span className={`text-sm font-bold ${dept.rate >= 80 ? 'text-emerald-600' :
                                                dept.rate >= 60 ? 'text-amber-600' :
                                                    'text-red-600'
                                                }`}>{dept.rate}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${dept.rate >= 80 ? 'bg-emerald-500' :
                                                    dept.rate >= 60 ? 'bg-amber-500' :
                                                        'bg-red-500'
                                                    }`}
                                                style={{ width: `${dept.rate}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {dept.completed} of {dept.total} completed
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-violet-50">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-violet-600" />
                                <h3 className="text-lg font-bold text-slate-800">Top Performers</h3>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-violet-50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Completed</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Avg Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-violet-50">
                                    {stats.topPerformers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                No performance data available
                                            </td>
                                        </tr>
                                    ) : stats.topPerformers.map((performer, idx) => (
                                        <tr key={idx} className="hover:bg-violet-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`w-8 h-8 inline-flex items-center justify-center rounded-full font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                                                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {performer.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{performer.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{performer.department || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                    {performer.completed} assessments
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${performer.avgScore >= 90 ? 'text-emerald-600' :
                                                    performer.avgScore >= 75 ? 'text-blue-600' :
                                                        'text-amber-600'
                                                    }`}>
                                                    {Math.round(performer.avgScore)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout
            title="Reports & Analytics"
            subtitle="Comprehensive insights into assessment performance"
        >
            {content}
        </DashboardLayout>
    );
};

export default Reports;

