import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ArrowLeft, Save, Star, MessageSquare } from 'lucide-react';
import '../styles/Auth.css';

const ManagerReview = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Manager Review state
    const [managerRatings, setManagerRatings] = useState({});
    const [managerRemarks, setManagerRemarks] = useState({});
    const [managerScore, setManagerScore] = useState(0);

    // Admin Review state
    const [adminRatings, setAdminRatings] = useState({});
    const [adminRemarks, setAdminRemarks] = useState({});
    const [adminScore, setAdminScore] = useState(0);
    const [selfScore, setSelfScore] = useState(0);

    // Toggle for Admin to edit THEIR review
    const [adminEditMode, setAdminEditMode] = useState(false);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const res = await authAPI.getSubmissionForReview(submissionId);
                const data = res.data;
                setSubmission(data);

                // Populate Manager Review (Read-only for Admin usually, or editable if Manager)
                if (data.existing_review) {
                    setManagerRatings(data.existing_review.ratings || {});
                    setManagerRemarks(data.existing_review.remarks || {});
                    setManagerScore(data.existing_review.total_score || 0);
                }

                // Populate Admin Review (Editable for Admin)
                if (data.admin_review) {
                    setAdminRatings(data.admin_review.ratings || {});
                    setAdminRemarks(data.admin_review.remarks || {});
                    setAdminScore(data.admin_review.total_score || 0);
                }
            } catch (err) {
                console.error("Failed to fetch submission", err);
                setError(err.response?.data?.error || 'Failed to load submission.');
            } finally {
                setLoading(false);
            }
        };

        if (submissionId) {
            fetchSubmission();
        }
    }, [submissionId]);

    // Calculate scores
    useEffect(() => {
        const sum = Object.values(managerRatings).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
        setManagerScore(sum);
    }, [managerRatings]);

    useEffect(() => {
        const sum = Object.values(adminRatings).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
        setAdminScore(sum);
    }, [adminRatings]);

    useEffect(() => {
        if (submission && submission.self_ratings) {
            const sum = Object.values(submission.self_ratings).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
            setSelfScore(sum);
        }
    }, [submission]);

    const handleAdminRatingChange = (qId, val) => {
        const num = val === '' ? '' : parseFloat(val);
        if (val === '' || (num >= 0 && num <= 10)) {
            setAdminRatings(prev => ({ ...prev, [qId]: num }));
        }
    };

    const handleAdminRemarkChange = (qId, val) => {
        setAdminRemarks(prev => ({ ...prev, [qId]: val }));
    };

    // Legacy handler for Manager (if user is manager)
    const handleManagerRatingChange = (qId, val) => {
        const num = val === '' ? '' : parseFloat(val);
        if (val === '' || (num >= 0 && num <= 10)) {
            setManagerRatings(prev => ({ ...prev, [qId]: num }));
        }
    };

    const handleManagerRemarkChange = (qId, val) => {
        setManagerRemarks(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmitAdminReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await authAPI.submitAdminReview({
                submission_id: parseInt(submissionId),
                ratings: adminRatings,
                remarks: adminRemarks
            });
            alert('Admin Review submitted successfully!');
            // Reload or partial update? Reloading is safer.
            window.location.reload();
        } catch (err) {
            console.error("Submission failed", err);
            alert(err.response?.data?.error || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    // Existing submit for Manager
    const handleSubmitManagerReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await authAPI.submitReview({
                submission_id: parseInt(submissionId),
                ratings: managerRatings,
                remarks: managerRemarks
            });
            alert('Manager Review submitted successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error("Submission failed", err);
            alert(err.response?.data?.error || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-state">Loading submission...</div>;
    if (error) return <div className="error-state">{error}</div>;
    if (!submission) return null;

    return (
        <div className="manager-review-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div className="review-container" style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'background 0.2s' }}>
                            <ArrowLeft size={20} />
                        </button>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Review Submission</h1>
                                    <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', color: '#3b82f6', fontWeight: '500' }}>{submission.assessment_title}</h2>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#64748b' }}>
                                        <div>Submitted on</div>
                                        <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(submission.submitted_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        {submission.employee_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1.1rem' }}>{submission.employee_name}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{submission.employee_email}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontWeight: '600', color: '#64748b' }}>Department:</span> {submission.employee_department || 'N/A'}
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: '600', color: '#64748b' }}>Joined:</span> {submission.employee_joined_at ? new Date(submission.employee_joined_at).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: '600', color: '#64748b' }}>Employee ID:</span> {submission.employee_id}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <form style={{ padding: '2rem' }}>
                    {submission.questions.map((q, idx) => {
                        const answer = submission.answers[q.id];
                        const selfRating = submission.self_ratings[q.id];
                        const isManager = !user?.is_staff;
                        const isAdmin = user?.is_staff;

                        return (
                            <div key={q.id} className="review-card" style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: idx === submission.questions.length - 1 ? 'none' : '1px solid #f1f5f9' }}>

                                {/* Question & Employee Answer */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#94a3b8', marginRight: '0.5rem' }}>{idx + 1}.</span>
                                        {q.text}
                                    </h3>

                                    {/* Employee Answer Display - ONLY visible to Admin */}
                                    {isAdmin && (
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>EMPLOYEE ANSWER</div>
                                            <div style={{ color: '#334155', fontSize: '1rem' }}>
                                                {Array.isArray(answer) ? answer.join(', ') : (answer || 'No answer provided')}
                                            </div>
                                            {selfRating && (
                                                <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>SELF RATING:</div>
                                                    <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600', fontSize: '0.9rem' }}>
                                                        {selfRating} / 10
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                                    {/* Manager Review Section - Visible to All */}
                                    <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fef3c7', position: 'relative' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Save size={14} /> Manager Review {isAdmin && "(Read Only)"}
                                        </h4>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                                Rating (out of 10) <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    min="0" max="10" step="0.1"
                                                    required={isManager}
                                                    disabled={isAdmin}
                                                    value={managerRatings[q.id] ?? ''}
                                                    onChange={(e) => handleManagerRatingChange(q.id, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem 1rem', borderRadius: '6px',
                                                        border: '1px solid #d1d5db', fontSize: '1rem',
                                                        background: isAdmin ? '#f9fafb' : 'white',
                                                        cursor: isAdmin ? 'not-allowed' : 'text'
                                                    }}
                                                    placeholder="0-10"
                                                />
                                                <Star size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                                Remarks (Optional)
                                            </label>
                                            <textarea
                                                value={managerRemarks[q.id] || ''}
                                                onChange={(e) => handleManagerRemarkChange(q.id, e.target.value)}
                                                disabled={isAdmin}
                                                style={{
                                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '6px',
                                                    border: '1px solid #d1d5db', fontSize: '0.9rem', minHeight: '80px',
                                                    background: isAdmin ? '#f9fafb' : 'white', cursor: isAdmin ? 'not-allowed' : 'text'
                                                }}
                                                placeholder="Manager comments..."
                                            />
                                        </div>
                                    </div>

                                    {/* Admin Review Section - Visible ONLY if Admin */}
                                    {isAdmin && (
                                        <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Save size={14} /> Admin Review
                                            </h4>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                                    Admin Rating (out of 10) <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="number"
                                                        min="0" max="10" step="0.1"
                                                        required={isAdmin}
                                                        disabled={!isAdmin}
                                                        value={adminRatings[q.id] ?? ''}
                                                        onChange={(e) => handleAdminRatingChange(q.id, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem 1rem', borderRadius: '6px',
                                                            border: '1px solid #93c5fd', fontSize: '1rem',
                                                            background: !isAdmin ? '#f8fafc' : 'white',
                                                            cursor: !isAdmin ? 'not-allowed' : 'text'
                                                        }}
                                                        placeholder="0-10"
                                                    />
                                                    <Star size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6' }} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                                    Admin Remarks (Optional)
                                                </label>
                                                <textarea
                                                    value={adminRemarks[q.id] || ''}
                                                    onChange={(e) => handleAdminRemarkChange(q.id, e.target.value)}
                                                    disabled={!isAdmin}
                                                    style={{
                                                        width: '100%', padding: '0.75rem 1rem', borderRadius: '6px',
                                                        border: '1px solid #93c5fd', fontSize: '0.9rem', minHeight: '80px',
                                                        background: !isAdmin ? '#f8fafc' : 'white', cursor: !isAdmin ? 'not-allowed' : 'text'
                                                    }}
                                                    placeholder="Admin comments..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )
                    })}


                    {/* Total Score & Actions */}
                    <div style={{
                        marginTop: '3rem',
                        background: '#1e293b',
                        color: 'white',
                        padding: '1.5rem 2rem',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '2rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {user?.is_staff && (
                                <div style={{ paddingRight: '2rem', borderRight: '1px solid #334155' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Self Score</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', lineHeight: 1, whiteSpace: 'nowrap' }}>
                                        {selfScore.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ {submission.questions.length * 10}</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ paddingRight: (user?.is_staff) ? '2rem' : '0', borderRight: (user?.is_staff) ? '1px solid #334155' : 'none' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager Score</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1, whiteSpace: 'nowrap' }}>
                                    {managerScore.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ {submission.questions.length * 10}</span>
                                </div>
                            </div>

                            {user?.is_staff && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Score</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8', lineHeight: 1, whiteSpace: 'nowrap' }}>
                                        {adminScore.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ {submission.questions.length * 10}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: 'auto' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #475569',
                                    background: 'transparent',
                                    color: '#cbd5e1',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Cancel
                            </button>

                            {!user?.is_staff && (
                                <button
                                    onClick={handleSubmitManagerReview}
                                    disabled={submitting}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                        color: '#fffbeb',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 6px -1px rgba(251, 191, 36, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <Save size={18} />
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            )}

                            {user?.is_staff && (
                                <button
                                    onClick={handleSubmitAdminReview}
                                    disabled={submitting}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#0ea5e9',
                                        color: 'white',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <Save size={18} />
                                    {submitting ? 'Submitting...' : 'Submit Admin Review'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default ManagerReview;
