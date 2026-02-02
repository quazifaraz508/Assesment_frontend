import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import DashboardLayout from './DashboardLayout';
import { FileText, Eye, Edit } from 'lucide-react';

const EmployeeHistory = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await authAPI.getEmployeeHistory(employeeId);
                setHistory(res.data.history);
                setEmployee(res.data.employee);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };

        if (employeeId) {
            fetchHistory();
        }
    }, [employeeId]);

    if (loading) {
        return (
            <DashboardLayout title="Assessment History" subtitle="Loading...">
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!employee) {
        return (
            <DashboardLayout title="Assessment History" subtitle="Employee not found">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                    Employee not found.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`${employee.name}'s History`}
            subtitle={`${employee.email} • ${employee.department}`}
        >
            {/* Employee Info Card */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-xl shadow-violet-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                        {employee.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{employee.name}</h2>
                        <p className="text-violet-100">{employee.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                            {employee.department}
                        </span>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Assessment Title</th>
                            <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Submitted On</th>
                            <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-50">
                        {history.length > 0 ? history.map((item, idx) => (
                            <tr key={idx} className="hover:bg-violet-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-slate-800">{item.assessment_title}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Submitted'
                                                ? 'bg-sky-100 text-sky-700'
                                                : item.status === 'Expired'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {item.status}
                                        </span>

                                        {item.status === 'Submitted' && (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${item.is_reviewed ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {item.is_reviewed ? 'Reviewed' : 'Pending Review'}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">
                                    {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">
                                    {new Date(item.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {item.status === 'Submitted' && item.submission_id && (
                                        <button
                                            onClick={() => navigate(`/review-submission/${item.submission_id}`)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-violet-200 text-violet-600 text-xs font-bold rounded-lg hover:bg-violet-50 hover:border-violet-300 transition-all"
                                        >
                                            {item.is_reviewed ? <Edit size={14} /> : <Eye size={14} />}
                                            {item.is_reviewed ? 'Edit' : 'Review'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No assessment history found.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeHistory;
