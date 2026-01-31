
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Search, FileText, ArrowLeft } from 'lucide-react';

const AdminGlobalHistory = () => {
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

    return (
        <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', color: '#64748b' }}>
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0 }}>Global Assessment History</h1>
                            <p style={{ color: '#64748b', margin: '0.2rem 0 0' }}>View and search all employee assessments</p>
                        </div>
                    </div>
                </header>

                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name, email or assessment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem 0.8rem 3rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0 1.5rem',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Search
                    </button>
                </form>

                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>Employee</th>
                                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>Assessment</th>
                                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>Submitted At</th>
                                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>Self Score</th>
                                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>Manager Score</th>
                                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>Difference</th>
                                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                            ) : submissions.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No submissions found.</td></tr>
                            ) : (
                                submissions.map((sub, idx) => {
                                    const hasManagerScore = sub.manager_score !== null && sub.manager_score !== undefined;
                                    const difference = hasManagerScore ? (sub.manager_score - sub.self_score) : null;

                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '500', color: '#334155' }}>{sub.employee_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{sub.employee_email}</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#334155' }}>{sub.assessment_title}</td>
                                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                                {new Date(sub.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '600', color: '#3b82f6' }}>
                                                {sub.self_score.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '600', color: sub.manager_score ? '#10b981' : '#cbd5e1' }}>
                                                {sub.manager_score ? sub.manager_score.toFixed(1) : '-'}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {hasManagerScore ? (
                                                    <span style={{
                                                        fontWeight: '600',
                                                        color: difference > 0 ? '#16a34a' : difference < 0 ? '#dc2626' : '#64748b',
                                                        display: 'inline-block',
                                                        minWidth: '40px'
                                                    }}>
                                                        {difference > 0 ? '+' : ''}{difference.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#cbd5e1' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => navigate(`/review-submission/${sub.submission_id}`)}
                                                    style={{
                                                        background: 'white',
                                                        border: '1px solid #cbd5e1',
                                                        color: '#475569',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem'
                                                    }}
                                                >
                                                    <FileText size={14} />
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminGlobalHistory;
