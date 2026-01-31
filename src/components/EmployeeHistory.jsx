import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ArrowLeft } from 'lucide-react';

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

    if (loading) return <div className="loading-state">Loading history...</div>;
    if (!employee) return <div className="error-state">Employee not found.</div>;

    return (
        <div className="employee-history-page" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#64748b',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', color: '#1e293b', marginBottom: '0.5rem' }}>Assessment History</h1>
                    <div style={{ color: '#64748b' }}>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{employee.name}</span> • {employee.email} • {employee.department}
                    </div>
                </header>

                <div className="history-table-container" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Assessment Title</th>
                                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Submitted On</th>
                                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Due Date</th>
                                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? history.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem', color: '#334155', fontWeight: '500' }}>{item.assessment_title}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                background: item.status === 'Submitted' ? '#e0f2fe' : (item.status === 'Expired' ? '#fee2e2' : '#fef3c7'),
                                                color: item.status === 'Submitted' ? '#0369a1' : (item.status === 'Expired' ? '#b91c1c' : '#b45309')
                                            }}>
                                                {item.status}
                                            </span>

                                            {item.status === 'Submitted' && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    background: item.is_reviewed ? '#dcfce7' : '#ffedd5',
                                                    color: item.is_reviewed ? '#166534' : '#c2410c'
                                                }}>
                                                    {item.is_reviewed ? 'Reviewed' : 'Pending Review'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                        {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(item.end_date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {item.status === 'Submitted' && item.submission_id && (
                                            <button
                                                onClick={() => navigate(`/review-submission/${item.submission_id}`)}
                                                style={{
                                                    background: 'white',
                                                    color: '#0ea5e9',
                                                    border: '1px solid #0ea5e9',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {item.is_reviewed ? 'Edit' : 'Review'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No assessment history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeHistory;
