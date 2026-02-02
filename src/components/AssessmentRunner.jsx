import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import CustomPopup from './CustomPopup';
import '../styles/Auth.css';

const AssessmentRunner = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [assessment, setAssessment] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [ratings, setRatings] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);

    // Custom Popup State
    const [popup, setPopup] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info',
        mode: 'alert',
        onConfirm: null
    });

    const closePopup = () => setPopup(prev => ({ ...prev, show: false }));

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const res = await authAPI.getEmployeeAssessments();
                const found = res.data.find(a => a.id === parseInt(id));

                if (found) {
                    setAssessment(found);
                    setQuestions(found.questions || []);

                    const now = new Date();
                    const endDate = new Date(found.end_date);

                    if (found.is_submitted) {
                        setIsSubmitted(true);
                        // Fetch submission details
                        try {
                            const subRes = await authAPI.getAssessmentSubmission(id);
                            setAnswers(subRes.data.answers || {});
                            setRatings(subRes.data.ratings || {});
                        } catch (subErr) {
                            console.error("Failed to fetch submission", subErr);
                        }

                        // If not expired, allow editing
                        if (now <= endDate) {
                            setIsSubmitted(false); // Enable editing
                        }
                    } else if (now > endDate) {
                        setPopup({
                            show: true,
                            title: 'Expired',
                            message: 'This assessment has expired.',
                            type: 'warning',
                            mode: 'alert',
                            onConfirm: () => {
                                closePopup();
                                navigate('/dashboard');
                            }
                        });
                        return;
                    }

                    // Load Draft if not submitted or if editable
                    if (!found.is_submitted || now <= endDate) {
                        const draftKey = `assessment_draft_${id}_${user?.id}`;
                        const savedDraft = localStorage.getItem(draftKey);
                        if (savedDraft) {
                            try {
                                const { answers: draftAnswers, ratings: draftRatings } = JSON.parse(savedDraft);
                                if (draftAnswers) setAnswers(prev => ({ ...prev, ...draftAnswers }));
                                if (draftRatings) setRatings(prev => ({ ...prev, ...draftRatings }));
                            } catch (e) {
                                console.error("Failed to parse draft", e);
                            }
                        }
                    }
                } else {
                    setError('Assessment not found or not available for you.');
                }
            } catch (err) {
                console.error("Failed to fetch assessment", err);
                setError('Failed to load assessment.');
            } finally {
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [id, navigate, user?.id]);

    // Save Draft on changes
    useEffect(() => {
        if (!loading && assessment && !isSubmitted) {
            const draftKey = `assessment_draft_${id}_${user?.id}`;
            const draftData = JSON.stringify({ answers, ratings });
            localStorage.setItem(draftKey, draftData);
        }
    }, [answers, ratings, loading, assessment, isSubmitted, id, user?.id]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleRatingChange = (questionId, value) => {
        // Find current question to get its max_score
        const question = questions.find(q => q.id.toString() === questionId.toString());
        const maxScore = question?.max_score || 10;

        // Allow empty string or valid number 0 to maxScore
        const numValue = value === '' ? '' : parseFloat(value);
        if (value === '' || (numValue >= 0 && numValue <= maxScore)) {
            setRatings(prev => ({
                ...prev,
                [questionId]: numValue
            }));
        }
    };

    // Calculate total self-rating score
    const totalRating = Object.values(ratings).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const maxTotalRating = questions.reduce((sum, q) => sum + (q.max_score || 10), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that all questions have a rating
        const missingRatings = questions.some(q => ratings[q.id] === undefined || ratings[q.id] === '');
        if (missingRatings) {
            setShowValidationErrors(true);
            // Optional: scroll to first error
            return;
        }

        setSubmitting(true);
        try {
            await authAPI.submitAssessment(id, { answers, ratings });

            // Clear Draft
            localStorage.removeItem(`assessment_draft_${id}_${user?.id}`);

            setPopup({
                show: true,
                title: 'Success!',
                message: 'Assessment submitted successfully!',
                type: 'success',
                mode: 'alert',
                onConfirm: () => {
                    closePopup();
                    navigate('/dashboard');
                }
            });
        } catch (err) {
            console.error("Submission failed", err);
            setPopup({
                show: true,
                title: 'Error',
                message: err.response?.data?.error || 'Failed to submit assessment.',
                type: 'error',
                mode: 'alert'
            });
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading assessment...</div>;
    if (error) return <div style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>{error}</div>;
    if (!assessment) return null;

    const isExpired = new Date() > new Date(assessment.end_date);

    // Determine if the form should be read-only.
    // It is read-only if isSubmitted (which implies expired or user viewing past submission without edit rights)
    // Note: We set isSubmitted = false if it IS editable above. 
    // So if isSubmitted is true here, it means "View Only".

    return (
        <div className="assessment-runner-page" style={{
            minHeight: '100vh',
            background: '#f8fafc',
            padding: '2rem'
        }}>
            <CustomPopup {...popup} onClose={closePopup} />
            <div className="assessment-runner-container" style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '2rem'
            }}>
                <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>{assessment.title}</h1>
                        {/* Timer could go here */}
                    </div>
                    <p style={{ margin: 0, color: '#64748b' }}>
                        {assessment.is_submitted && !isExpired ? "Edit your response" : (assessment.is_submitted ? "Your Submission" : "Complete the assessment below")}
                    </p>
                </header>

                <form onSubmit={handleSubmit}>
                    {questions.map((q, idx) => (
                        <div key={idx} className="question-card" style={{ marginBottom: '2rem' }}>
                            <p style={{ marginBottom: '1rem', fontWeight: '600', color: '#334155', fontSize: '1.1rem' }}>
                                {idx + 1}. {q.text}
                            </p>

                            {q.type === 'text' && (
                                <textarea
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    disabled={isSubmitted}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        minHeight: '120px',
                                        fontSize: '1rem',
                                        backgroundColor: isSubmitted ? '#f1f5f9' : 'white'
                                    }}
                                    required={!isSubmitted}
                                />
                            )}

                            {(q.type === 'radio' || q.type === 'checkbox') && (
                                <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {q.options.map((opt, optIdx) => (
                                        <label key={optIdx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: isSubmitted ? 'default' : 'pointer',
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            background: '#fff'
                                        }}>
                                            <input
                                                type={q.type}
                                                name={`q-${q.id}`}
                                                value={opt}
                                                checked={q.type === 'radio' ? answers[q.id] === opt : (answers[q.id] || []).includes(opt)}
                                                onChange={(e) => {
                                                    if (q.type === 'radio') handleAnswerChange(q.id, opt);
                                                    else {
                                                        const current = answers[q.id] || [];
                                                        const newValue = e.target.checked
                                                            ? [...current, opt]
                                                            : current.filter(item => item !== opt);
                                                        handleAnswerChange(q.id, newValue);
                                                    }
                                                }}
                                                disabled={isSubmitted}
                                                style={{ marginRight: '0.75rem', width: '1.2rem', height: '1.2rem' }}
                                            />
                                            <span style={{ color: '#475569' }}>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Self-Rating Input */}
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem 1rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <label style={{
                                    color: '#64748b',
                                    fontWeight: '500',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap'
                                }}>
                                    Self Rating:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={q.max_score || 10}
                                    step="0.1"
                                    value={ratings[q.id] ?? ''}
                                    onChange={(e) => handleRatingChange(q.id, e.target.value)}
                                    disabled={isSubmitted}
                                    placeholder={`0-${q.max_score || 10}`}
                                    style={{
                                        width: '80px',
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: (showValidationErrors && (ratings[q.id] === undefined || ratings[q.id] === ''))
                                            ? '1px solid #ef4444'
                                            : '1px solid #cbd5e1',
                                        fontSize: '1rem',
                                        textAlign: 'center',
                                        backgroundColor: isSubmitted ? '#e2e8f0' : 'white'
                                    }}
                                />
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/ {q.max_score || 10}</span>
                                {showValidationErrors && (ratings[q.id] === undefined || ratings[q.id] === '') && (
                                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Required</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Total Self-Rating Score */}
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '12px',
                        border: '1px solid #bae6fd',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, color: '#0369a1', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            Your Total Self-Rating
                        </p>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#0284c7' }}>
                            {totalRating.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ {maxTotalRating}</span>
                        </p>
                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="auth-button"
                            style={{
                                background: 'white',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                width: 'auto',
                                padding: '0.75rem 1.5rem'
                            }}
                        >
                            {isSubmitted ? 'Back to Dashboard' : 'Cancel'}
                        </button>

                        {!isSubmitted && (
                            <button
                                type="submit"
                                className="auth-button"
                                disabled={submitting}
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    border: 'none',
                                    width: 'auto',
                                    padding: '0.75rem 2rem'
                                }}
                            >
                                {submitting ? 'Submitting...' : (assessment.is_submitted ? 'Update Submission' : 'Submit Assessment')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssessmentRunner;
