import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import DashboardLayout from './DashboardLayout';
import { Search, FileText } from 'lucide-react';

const AdminGlobalHistory = ({ embedded = false }) => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async (query = '') => {
        setLoading(true);
        try {
            const res = await authAPI.getAllSubmissions(query);
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSubmissions(searchTerm);
    };

    const content = (
        <>
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email or assessment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    Search
                </button>
            </form>

            {/* Results Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Assessment</th>
                                <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Submitted At</th>
                                <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Self Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Manager Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Difference</th>
                                <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-violet-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : submissions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        No submissions found.
                                    </td>
                                </tr>
                            ) : (
                                submissions.map((sub, idx) => {
                                    const hasManagerScore = sub.manager_score !== null && sub.manager_score !== undefined;
                                    const totalDeduction = sub.total_deduction || 0;
                                    const adjustedManagerScore = hasManagerScore ? Math.max(0, sub.manager_score + totalDeduction) : null;
                                    const difference = hasManagerScore ? (adjustedManagerScore - sub.self_score) : null;

                                    return (
                                        <tr key={idx} className="hover:bg-violet-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{sub.employee_name}</div>
                                                <div className="text-sm text-slate-400">{sub.employee_email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{sub.assessment_title}</td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">
                                                {new Date(sub.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-sky-600">{sub.self_score.toFixed(1)}</span>
                                                <span className="text-xs text-slate-400 ml-1">/{sub.max_score || 0}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {hasManagerScore ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-emerald-600">
                                                            {adjustedManagerScore.toFixed(1)}
                                                            <span className="text-xs text-slate-400 ml-1">/{sub.max_score || 0}</span>
                                                        </span>
                                                        {totalDeduction < 0 && (
                                                            <span className="text-xs text-red-500">
                                                                {sub.manager_score.toFixed(1)} {totalDeduction.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {hasManagerScore ? (
                                                    <span className={`font-bold ${difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-red-600' : 'text-slate-500'
                                                        }`}>
                                                        {difference > 0 ? '+' : ''}{difference.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/review-submission/${sub.submission_id}`)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-violet-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-violet-50 hover:border-violet-300 transition-all"
                                                >
                                                    <FileText size={14} />
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout title="Global Assessment History" subtitle="View and search all employee assessments">
            {content}
        </DashboardLayout>
    );
};

export default AdminGlobalHistory;
