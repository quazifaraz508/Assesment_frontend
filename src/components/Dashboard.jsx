import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';
import NotificationMenu from './NotificationMenu';
import api, { authAPI } from '../services/api';

const getDepartmentDisplay = (assessment) => {
    try {
        if (Array.isArray(assessment.departments)) {
            return assessment.departments.join(', ');
        }
        // Fallback if it's a JSON string or old format
        return assessment.departments || 'N/A';
    } catch (e) {
        return 'N/A';
    }
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [showAll, setShowAll] = useState(false);

    const [teamStatus, setTeamStatus] = useState([]);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await authAPI.getEmployeeAssessments();
                // Sort: Editable (submitted but not expired) with least due first, then pending, then expired
                const now = new Date();
                const sorted = res.data.sort((a, b) => {
                    const endA = new Date(a.end_date);
                    const endB = new Date(b.end_date);
                    const isExpiredA = now > endA;
                    const isExpiredB = now > endB;

                    // Editable = submitted and not expired (can still edit)
                    const isEditableA = a.is_submitted && !isExpiredA;
                    const isEditableB = b.is_submitted && !isExpiredB;

                    // View Submission = submitted and expired
                    const isViewOnlyA = a.is_submitted && isExpiredA;
                    const isViewOnlyB = b.is_submitted && isExpiredB;

                    // Pending = not submitted and not expired
                    const isPendingA = !a.is_submitted && !isExpiredA;
                    const isPendingB = !b.is_submitted && !isExpiredB;

                    // Priority: Pending/Start (0), Editable (1), View Submission (2), Expired without submission (3)
                    const getPriority = (isEditable, isViewOnly, isPending) => {
                        if (isPending) return 0;  // Start Assessment first
                        if (isEditable) return 1; // Edit Submission
                        if (isViewOnly) return 2; // View Submission
                        return 3;
                    };

                    const priorityA = getPriority(isEditableA, isViewOnlyA, isPendingA);
                    const priorityB = getPriority(isEditableB, isViewOnlyB, isPendingB);

                    // First sort by priority, then by due date (earliest first)
                    if (priorityA !== priorityB) return priorityA - priorityB;
                    return endA - endB; // Earliest due date first
                });
                setAssessments(sorted);
            } catch (e) {
                console.error("Failed to fetch assessments", e);
            }
        };

        const fetchTeamStatus = async () => {
            // Only fetch if user is likely a manager (or just try and catch)
            try {
                const res = await authAPI.getTeamStatus();
                setTeamStatus(res.data);
            } catch (e) {
                // Ignore 403 or empty if not manager
            }
        };

        fetchAssessments();
        fetchTeamStatus();
    }, []);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Employee Dashboard</h1>
                    <div className="header-actions">
                        {/* <span className="user-name">{user?.name || user?.username}</span> */}
                        <NotificationMenu />
                        <ProfileMenu />
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="welcome-section">
                    <h2>Welcome back, {user ? user.name : 'Employee'}!</h2>
                    <p>Here are your assigned assessments.</p>
                </div>

                {/* Team Overview Section for Managers */}
                {teamStatus.length > 0 && (
                    <div className="team-status-section" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Team Overview</h3>
                        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Employee</th>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Assessment</th>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Status</th>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Submission Date</th>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Due Date</th>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamStatus.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', color: '#334155', fontWeight: '500' }}>
                                                <div>{item.employee_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.employee_email}</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#475569' }}>{item.assessment_title}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                    {/* Submission Status */}
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

                                                    {/* Review Status (Only for submitted) */}
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
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {/* Review Button if applicable */}
                                                {item.status === 'Submitted' && item.submission_id && (
                                                    <button
                                                        onClick={() => navigate(`/review-submission/${item.submission_id}`)}
                                                        style={{
                                                            background: '#0ea5e9',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: '6px',
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        {item.is_reviewed ? 'Edit' : 'Review'}
                                                    </button>
                                                )}

                                                {/* Details Button */}
                                                <button
                                                    onClick={() => navigate(`/team/employee/${item.employee_id}`)}
                                                    style={{
                                                        background: 'white',
                                                        color: '#64748b',
                                                        border: '1px solid #cbd5e1',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Admin Specific Links */}
                {user?.is_staff && (
                    <div style={{ marginTop: '2rem' }}>
                        <div className="section-header" style={{ marginBottom: '1rem' }}>
                            <h2>Admin Controls</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div
                                onClick={() => navigate('/admin/submissions')}
                                style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: 0, color: '#1e293b' }}>Global Assessment History</h3>
                                    <span style={{ fontSize: '1.2rem' }}>🌍</span>
                                </div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                                    View and search all employee assessments and scores.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assessments Section */}
                {assessments.length > 0 && (
                    <div className="assessments-section" style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>Assigned Assessments</h3>
                            <button
                                onClick={() => setShowAll(!showAll)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#4f46e5',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                {showAll ? 'Show Less' : 'See All'}
                                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{showAll ? '↑' : '→'}</span>
                            </button>
                        </div>

                        <div className="assessment-grid" style={{
                            display: showAll ? 'grid' : 'flex',
                            gridTemplateColumns: showAll ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'none',
                            gap: '1.5rem',
                            overflowX: showAll ? 'visible' : 'auto',
                            paddingBottom: showAll ? 0 : '1.5rem', // Space for scrollbar
                            paddingRight: showAll ? 0 : '0.5rem',
                            flexWrap: showAll ? 'wrap' : 'nowrap',
                            scrollBehavior: 'smooth'
                        }}>
                            {assessments.map(assessment => {
                                const isExpired = new Date() > new Date(assessment.end_date);
                                const isSubmitted = assessment.is_submitted;

                                const canView = isSubmitted && isExpired;
                                const canEdit = isSubmitted && !isExpired;
                                const canStart = !isSubmitted && !isExpired;

                                return (
                                    <div key={assessment.id} className="assessment-card" style={{
                                        background: isSubmitted || isExpired ? '#f1f5f9' : 'white', // Gray background if submitted or expired
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        opacity: isSubmitted || isExpired ? 0.8 : 1,
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        minWidth: showAll ? 'auto' : '320px', // Fixed width for scroll view
                                        flex: showAll ? 'none' : '0 0 auto'    // Prevent shrinking in flex row
                                    }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, color: (isSubmitted || isExpired) ? '#64748b' : '#1e293b', fontSize: '1.25rem' }}>
                                                    {assessment.title}
                                                </h3>
                                                {isSubmitted && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        color: '#64748b',
                                                        background: '#e2e8f0',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '999px'
                                                    }}>
                                                        Submitted
                                                    </span>
                                                )}
                                                {!isSubmitted && isExpired && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        color: '#ef4444',
                                                        background: '#fee2e2',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '999px'
                                                    }}>
                                                        Expired
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                                                Department: {getDepartmentDisplay(assessment)}
                                            </p>
                                            <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                                                Due: {new Date(assessment.end_date).toLocaleDateString()} {new Date(assessment.end_date).toLocaleTimeString()}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/assessments/${assessment.id}`)}
                                            className="auth-button"
                                            disabled={!canView && !canEdit && !canStart}
                                            style={{
                                                textAlign: 'center',
                                                textDecoration: 'none',
                                                marginTop: '0.5rem',
                                                background: (canStart || canEdit)
                                                    ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                                                    : (canView ? '#94a3b8' : '#cbd5e1'),
                                                border: 'none',
                                                width: '100%',
                                                cursor: (canView || canEdit || canStart) ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            {canView ? 'View Submission' : (canEdit ? 'Edit Submission' : (canStart ? 'Start Assessment' : 'Expired'))}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="status-cards">
                    <div className="status-card verified">
                        <div className="status-icon">✓</div>
                        <div className="status-text">
                            <h4>Email Verified</h4>
                            <p>Your email has been verified</p>
                        </div>
                    </div>
                    <div className="status-card complete">
                        <div className="status-icon">✓</div>
                        <div className="status-text">
                            <h4>Profile Complete</h4>
                            <p>Your profile is complete</p>
                        </div>
                    </div>
                </div>

                <div className="action-buttons-container" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/manager-dashboard')}
                        className="auth-button"
                        style={{ flex: 1, minWidth: '200px' }}
                    >
                        Manager Dashboard
                    </button>

                    {user?.is_staff && (
                        <>
                            <button
                                onClick={() => navigate('/admin/assessments')}
                                className="auth-button"
                                style={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            >
                                Manage Assessments
                            </button>
                            <button
                                onClick={() => navigate('/admin/allocation')}
                                className="auth-button"
                                style={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' }}
                            >
                                Admin Allocation
                            </button>
                            <a
                                href="http://localhost:8000/api/auth/settings/"
                                className="auth-button"
                                style={{
                                    flex: 1,
                                    minWidth: '200px',
                                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                Site Settings
                            </a>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
