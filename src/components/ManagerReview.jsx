import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import CustomPopup from './CustomPopup';
import { Save, AlertCircle, CheckCircle, ArrowLeft, Star, MessageSquare, Trash2 } from 'lucide-react';
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

    // Step 2 state
    const [currentStep, setCurrentStep] = useState(1);
    const [isStep2Submitted, setIsStep2Submitted] = useState(false);
    const [step2Ratings, setStep2Ratings] = useState({});
    const [step2Remarks, setStep2Remarks] = useState({});
    const [reviewHistory, setReviewHistory] = useState([]);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(-1); // -1 means current Step 2
    const [localHistoryIndices, setLocalHistoryIndices] = useState({}); // { qId: index } where index -2=Step1, -1=Current, 0+=History

    // Admin Review state
    const [adminRatings, setAdminRatings] = useState({});
    const [adminRemarks, setAdminRemarks] = useState({});
    const [adminScore, setAdminScore] = useState(0);
    const [selfScore, setSelfScore] = useState(0);

    // Toggle for Admin to edit THEIR review
    const [adminEditMode, setAdminEditMode] = useState(false);
    const [managerEditMode, setManagerEditMode] = useState(false);

    // Disciplinary Actions state
    const [disciplinaryActions, setDisciplinaryActions] = useState([]);
    const [showDisciplinaryForm, setShowDisciplinaryForm] = useState(false);
    const [issuingAction, setIssuingAction] = useState(false);
    const [actionForm, setActionForm] = useState({
        type: '',
        reason: '',
        customLabel: '',
        customDeduction: ''
    });

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

    const actionTypes = [
        { id: 'verbal_warning', label: 'Verbal Warning (-1 point)', deduction: 1, color: '#94a3b8' },
        { id: 'warning', label: 'Official Issued Warning (-2 points)', deduction: 2, color: '#fbbf24' },
        { id: 'memo', label: 'Issued Memo (-5 points)', deduction: 5, color: '#f87171' },
        { id: 'suspend', label: 'Suspend (-10 points)', deduction: 10, color: '#b91c1c' },
        { id: 'custom', label: 'Custom Action', deduction: 0, color: '#6366f1' }
    ];

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const res = await authAPI.getSubmissionForReview(submissionId);
                const data = res.data;
                setSubmission(data);

                // Populate Manager Review (Step 1)
                if (data.existing_review) {
                    setManagerRatings(data.existing_review.ratings || {});
                    setManagerRemarks(data.existing_review.remarks || {});

                    // Step 2 content
                    setStep2Ratings(data.existing_review.step2_ratings || {});
                    setStep2Remarks(data.existing_review.step2_remarks || {});
                    setReviewHistory(data.existing_review.history || []);

                    // Determine current step
                    if (data.existing_review.step2_ratings && Object.keys(data.existing_review.step2_ratings).length > 0) {
                        setCurrentStep(2);
                        setIsStep2Submitted(true);
                    } else if (data.existing_review.ratings && Object.keys(data.existing_review.ratings).length > 0) {
                        // If only step 1 exists, stay on step 2 (reviewing phase)
                        setCurrentStep(2);
                    } else {
                        setCurrentStep(1);
                    }

                    setManagerScore(data.existing_review.total_score || 0);
                }

                // Populate Admin Review (Editable for Admin)
                if (data.admin_review) {
                    setAdminRatings(data.admin_review.ratings || {});
                    setAdminRemarks(data.admin_review.remarks || {});
                    setAdminScore(data.admin_review.total_score || 0);
                }

                if (data.disciplinary_actions) {
                    setDisciplinaryActions(data.disciplinary_actions);
                }

                // Load Drafts
                const role = user?.role === 'admin' ? 'admin' : 'manager';
                const draftKey = `review_draft_${submissionId}_${role}_${user?.id}`;
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    try {
                        const { ratings: draftRatings, remarks: draftRemarks, step: draftStep } = JSON.parse(savedDraft);
                        if (role === 'admin') {
                            setAdminRatings(prev => ({ ...prev, ...draftRatings }));
                            setAdminRemarks(prev => ({ ...prev, ...draftRemarks }));
                        } else {
                            if (draftStep === 1) {
                                setManagerRatings(prev => ({ ...prev, ...draftRatings }));
                                setManagerRemarks(prev => ({ ...prev, ...draftRemarks }));
                            } else {
                                setStep2Ratings(prev => ({ ...prev, ...draftRatings }));
                                setStep2Remarks(prev => ({ ...prev, ...draftRemarks }));
                            }
                        }
                    } catch (e) {
                        console.error("Failed to parse review draft", e);
                    }
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
    }, [submissionId, user?.role, user?.id]);

    // Save Drafts
    useEffect(() => {
        if (!loading && submission) {
            const role = user?.role === 'admin' ? 'admin' : 'manager';
            const draftKey = `review_draft_${submissionId}_${role}_${user?.id}`;
            const ratings = role === 'admin' ? adminRatings : (currentStep === 1 ? managerRatings : step2Ratings);
            const remarks = role === 'admin' ? adminRemarks : (currentStep === 1 ? managerRemarks : step2Remarks);

            // Only save if there's actually something to save
            if (Object.keys(ratings).length > 0 || Object.keys(remarks).length > 0) {
                localStorage.setItem(draftKey, JSON.stringify({ ratings, remarks, step: currentStep }));
            }
        }
    }, [managerRatings, managerRemarks, step2Ratings, step2Remarks, adminRatings, adminRemarks, currentStep, loading, submission, submissionId, user?.role, user?.id]);

    // Calculate scores
    useEffect(() => {
        const sourceData = (currentStep === 2 && Object.keys(step2Ratings).length > 0) ? step2Ratings : managerRatings;
        const sum = Object.values(sourceData).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
        setManagerScore(sum);
    }, [managerRatings, step2Ratings, currentStep]);

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
        const question = submission?.assessment?.questions?.find(q => q.id.toString() === qId.toString()) ||
            submission?.questions?.find(q => q.id.toString() === qId.toString());
        const maxScore = question?.max_score || 10;
        const num = val === '' ? '' : parseFloat(val);
        if (val === '' || (num >= 0 && num <= maxScore)) {
            setAdminRatings(prev => ({ ...prev, [qId]: num }));
        }
    };

    const handleAdminRemarkChange = (qId, val) => {
        setAdminRemarks(prev => ({ ...prev, [qId]: val }));
    };

    // Handler for Manager Review
    const handleManagerRatingChange = (qId, val) => {
        const question = submission?.assessment?.questions?.find(q => q.id.toString() === qId.toString()) ||
            submission?.questions?.find(q => q.id.toString() === qId.toString());
        const maxScore = question?.max_score || 10;
        const num = val === '' ? '' : parseFloat(val);

        if (val === '' || (num >= 0 && num <= maxScore)) {
            if (currentStep === 1) {
                setManagerRatings(prev => ({ ...prev, [qId]: num }));
            } else {
                setStep2Ratings(prev => ({ ...prev, [qId]: num }));
            }
        }
    };

    const handleManagerRemarkChange = (qId, val) => {
        if (currentStep === 1) {
            setManagerRemarks(prev => ({ ...prev, [qId]: val }));
        } else {
            setStep2Remarks(prev => ({ ...prev, [qId]: val }));
        }
    };

    const handleSubmitAdminReview = async (e) => {
        e.preventDefault();

        const confirmSubmit = async () => {
            setSubmitting(true);
            try {
                await authAPI.submitAdminReview({
                    submission_id: parseInt(submissionId),
                    ratings: adminRatings,
                    remarks: adminRemarks
                });

                // Clear Draft
                localStorage.removeItem(`review_draft_${submissionId}_admin_${user?.id}`);

                setPopup({
                    show: true,
                    title: 'Success!',
                    message: 'Admin Review submitted successfully!',
                    type: 'success',
                    mode: 'alert',
                    onConfirm: () => {
                        closePopup();
                        window.location.reload();
                    }
                });
            } catch (err) {
                console.error("Submission failed", err);
                setPopup({
                    show: true,
                    title: 'Submission Failed',
                    message: err.response?.data?.error || 'Failed to submit review.',
                    type: 'error',
                    mode: 'alert'
                });
            } finally {
                setSubmitting(false);
            }
        };

        setPopup({
            show: true,
            title: 'Confirm Submission',
            message: 'Are you sure you want to submit this Admin Review?',
            type: 'info',
            mode: 'confirm',
            onConfirm: confirmSubmit
        });
    };

    // Submit for Manager - Handles Step 1 and Step 2
    const handleSubmitManagerReview = async (e) => {
        if (e) e.preventDefault();

        if (currentStep === 1) {
            setPopup({
                show: true,
                title: 'Confirm Submission',
                message: 'Do you confirm? After this you will review the team member by seeing their answers.',
                type: 'info',
                mode: 'confirm',
                onConfirm: async () => {
                    setSubmitting(true);
                    try {
                        await authAPI.submitReview({
                            submission_id: parseInt(submissionId),
                            ratings: managerRatings,
                            remarks: managerRemarks,
                            step: 1
                        });

                        // Copy ratings to step 2 for convenience
                        setStep2Ratings({ ...managerRatings });
                        setStep2Remarks({ ...managerRemarks });

                        setCurrentStep(2);
                        setPopup({
                            show: true,
                            title: 'Step 1 Complete',
                            message: 'You can now see the team member\'s answers and self-ratings. Please finalize your review.',
                            type: 'success',
                            mode: 'alert'
                        });
                    } catch (err) {
                        console.error("Step 1 failed", err);
                        setPopup({
                            show: true,
                            title: 'Error',
                            message: err.response?.data?.error || 'Failed to submit Step 1.',
                            type: 'error',
                            mode: 'alert'
                        });
                    } finally {
                        setSubmitting(false);
                    }
                }
            });
        } else {
            // Step 2 Submission
            const confirmStep2 = async () => {
                setSubmitting(true);
                try {
                    const res = await authAPI.submitReview({
                        submission_id: parseInt(submissionId),
                        ratings: step2Ratings,
                        remarks: step2Remarks,
                        step: 2
                    });

                    // Clear Draft
                    localStorage.removeItem(`review_draft_${submissionId}_manager_${user?.id}`);

                    setPopup({
                        show: true,
                        title: 'Success!',
                        message: 'Manager Review submitted successfully!',
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
                        title: 'Submission Failed',
                        message: err.response?.data?.error || 'Failed to submit review.',
                        type: 'error',
                        mode: 'alert'
                    });
                } finally {
                    setSubmitting(false);
                }
            };

            setPopup({
                show: true,
                title: 'Confirm Final Submission',
                message: 'Are you sure you want to submit this finalized review?',
                type: 'info',
                mode: 'confirm',
                onConfirm: confirmStep2
            });
        }
    };

    const handleIssueDisciplinaryAction = async (e) => {
        e.preventDefault();
        if (!actionForm.type || !actionForm.reason || (actionForm.type === 'custom' && (!actionForm.customLabel || !actionForm.customDeduction))) {
            setPopup({
                show: true,
                title: 'Missing Information',
                message: 'Please provide all details for the disciplinary action.',
                type: 'warning',
                mode: 'alert'
            });
            return;
        }

        const selected = actionTypes.find(a => a.id === actionForm.type);
        const actionLabel = actionForm.type === 'custom' ? actionForm.customLabel : selected.label;
        const actionDeduction = actionForm.type === 'custom' ? parseFloat(actionForm.customDeduction) : selected.deduction;

        setIssuingAction(true);
        try {
            const res = await authAPI.issueDisciplinaryAction({
                user: submission.employee_id,
                submission: parseInt(submissionId),
                action_type: actionForm.type,
                action_label: actionLabel, // New field for custom label
                deduction: -Math.abs(actionDeduction),
                reason: actionForm.reason
            });
            setDisciplinaryActions(prev => [res.data, ...prev]);
            setActionForm({ type: '', reason: '', customLabel: '', customDeduction: '' });
            setShowDisciplinaryForm(false);
            setPopup({
                show: true,
                title: 'Success!',
                message: 'Disciplinary action issued successfully!',
                type: 'success',
                mode: 'alert'
            });
        } catch (err) {
            console.error("Failed to issue disciplinary action", err);
            setPopup({
                show: true,
                title: 'Error',
                message: err.response?.data?.error || 'Failed to issue action.',
                type: 'error',
                mode: 'alert'
            });
        } finally {
            setIssuingAction(false);
        }
    };

    const handleRemoveDisciplinaryAction = (e, id) => {
        if (e) e.preventDefault();
        const confirmRemove = () => {
            (async () => {
                try {
                    await authAPI.removeDisciplinaryAction(id);
                    setDisciplinaryActions(prev => prev.filter(a => a.id !== id));
                    setPopup({
                        show: true,
                        title: 'Removed!',
                        message: 'Disciplinary action has been removed.',
                        type: 'success',
                        mode: 'alert'
                    });
                } catch (err) {
                    console.error("Failed to remove disciplinary action", err);
                    setPopup({
                        show: true,
                        title: 'Error',
                        message: err.response?.data?.error || 'Failed to remove action.',
                        type: 'error',
                        mode: 'alert'
                    });
                }
            })();
        };

        setPopup({
            show: true,
            title: 'Confirm Removal',
            message: 'Are you sure you want to remove this disciplinary action?',
            type: 'warning',
            mode: 'confirm',
            onConfirm: confirmRemove
        });
    };

    const totalDeduction = disciplinaryActions.reduce((acc, curr) => acc + (curr.deduction || 0), 0);
    const displayManagerScore = Math.max(0, managerScore + totalDeduction);
    const displayAdminScore = Math.max(0, adminScore + totalDeduction);

    if (loading) return <div className="loading-state">Loading submission...</div>;
    if (error) return <div className="error-state">{error}</div>;
    if (!submission) return null;

    // Display Rating/Remarks for a specific question based on role and current view
    const getDisplayData = (qId) => {
        const isAdmin = user?.is_staff;
        const localIndex = localHistoryIndices[qId];
        const activeIndex = localIndex !== undefined ? localIndex : selectedHistoryIndex;

        // If activeIndex is -2 (Blind Review/Step 1)
        if (activeIndex === -2) {
            return {
                rating: managerRatings[qId],
                remark: managerRemarks[qId],
                label: "Blind Review (Step 1)",
                color: "#475569",
                bgColor: "#f1f5f9",
                borderColor: "#cbd5e1"
            };
        }

        // If activeIndex is a history index (0+)
        if (activeIndex !== -1) {
            const h = reviewHistory[activeIndex];
            const shades = [
                { color: "#1d4ed8", bgColor: "#eff6ff", borderColor: "#bfdbfe" }, // Blue-600
                { color: "#4338ca", bgColor: "#eef2ff", borderColor: "#c7d2fe" }, // Indigo-700
                { color: "#4f46e5", bgColor: "#f5f3ff", borderColor: "#ddd6fe" }, // Indigo-600
                { color: "#3730a3", bgColor: "#e0e7ff", borderColor: "#a5b4fc" }  // Indigo-800
            ];
            const shade = shades[activeIndex % shades.length];
            return {
                rating: h?.ratings?.[qId],
                remark: h?.remarks?.[qId],
                label: `Edited (Step 2 - Ver ${activeIndex + 1})`,
                ...shade
            };
        }

        // Default (activeIndex === -1) - Active Step (1 or 2)
        if (currentStep === 1) {
            return {
                rating: managerRatings[qId],
                remark: managerRemarks[qId],
                label: "Assessment (Step 1)",
                color: "#1d4ed8",
                bgColor: "#eff6ff",
                borderColor: "#bfdbfe"
            };
        } else {
            // Step 2 Current
            return {
                rating: step2Ratings[qId],
                remark: step2Remarks[qId],
                label: "Final Review (Step 2 - Current)",
                color: "#047857",
                bgColor: "#f0fdf4",
                borderColor: "#bbf7d0"
            };
        }
    };

    return (
        <div className="manager-review-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <CustomPopup {...popup} onClose={closePopup} />
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

                                    {/* Multi-Step Indicator for Manager */}
                                    {!user?.is_staff && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: currentStep === 1 ? '#3b82f6' : '#e2e8f0', color: currentStep === 1 ? 'white' : '#64748b', fontWeight: '600' }}>Step 1: Blind Review</div>
                                            <div style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: currentStep === 2 ? '#3b82f6' : '#e2e8f0', color: currentStep === 2 ? 'white' : '#64748b', fontWeight: '600' }}>Step 2: Full Review</div>
                                        </div>
                                    )}

                                    {/* Version Switcher for Admin/Manager in Step 2 */}
                                    {(user?.is_staff || currentStep === 2) && (
                                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '20px', width: 'fit-content' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Review Versions:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedHistoryIndex(-2)}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '12px',
                                                            background: selectedHistoryIndex === -2 ? '#3b82f6' : 'white',
                                                            color: selectedHistoryIndex === -2 ? 'white' : '#64748b',
                                                            border: '1px solid #e2e8f0',
                                                            cursor: 'pointer',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        Blind (Step 1)
                                                    </button>

                                                    <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }}></div>

                                                    <button
                                                        type="button"
                                                        disabled={selectedHistoryIndex === -2}
                                                        onClick={() => {
                                                            if (selectedHistoryIndex === -1) {
                                                                if (reviewHistory.length > 0) setSelectedHistoryIndex(reviewHistory.length - 1);
                                                                else setSelectedHistoryIndex(-2);
                                                            } else if (selectedHistoryIndex === 0) {
                                                                setSelectedHistoryIndex(-2);
                                                            } else if (selectedHistoryIndex > 0) {
                                                                setSelectedHistoryIndex(prev => prev - 1);
                                                            }
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: selectedHistoryIndex === -2 ? 'default' : 'pointer', color: selectedHistoryIndex === -2 ? '#cbd5e1' : '#334155' }}
                                                    >
                                                        &lt;
                                                    </button>

                                                    <span
                                                        onClick={() => setSelectedHistoryIndex(-1)}
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: '700',
                                                            color: selectedHistoryIndex === -1 ? '#3b82f6' : '#64748b',
                                                            cursor: 'pointer',
                                                            textDecoration: selectedHistoryIndex === -1 ? 'underline' : 'none'
                                                        }}
                                                        title="Show Real Review"
                                                    >
                                                        {selectedHistoryIndex === -1 ? 'Real Review' : (selectedHistoryIndex === -2 ? 'Step 1 (Blind)' : `Edited V${selectedHistoryIndex + 1}`)}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        disabled={selectedHistoryIndex === -1}
                                                        onClick={() => {
                                                            if (selectedHistoryIndex === -2) {
                                                                if (reviewHistory.length > 0) setSelectedHistoryIndex(0);
                                                                else setSelectedHistoryIndex(-1);
                                                            } else if (selectedHistoryIndex === reviewHistory.length - 1) {
                                                                setSelectedHistoryIndex(-1);
                                                            } else if (selectedHistoryIndex >= 0) {
                                                                setSelectedHistoryIndex(prev => prev + 1);
                                                            }
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: selectedHistoryIndex === -1 ? 'default' : 'pointer', color: selectedHistoryIndex === -1 ? '#cbd5e1' : '#334155' }}
                                                    >
                                                        &gt;
                                                    </button>

                                                    {selectedHistoryIndex !== -1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedHistoryIndex(-1)}
                                                            style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'white', border: '1px solid #3b82f6', borderRadius: '4px', padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                                                        >
                                                            Show Real Review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', paddingLeft: '0.5rem' }}>
                                                {selectedHistoryIndex === -2 && "Viewing manager's initial blind review (before seeing employee answers)."}
                                                {selectedHistoryIndex >= 0 && "Viewing a previous version of the manager's review after seeing employee answers."}
                                                {selectedHistoryIndex === -1 && "Viewing the latest version of the manager's review."}
                                            </div>
                                        </div>
                                    )}
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

                        const displayData = getDisplayData(q.id);
                        const localIndex = localHistoryIndices[q.id];
                        const activeIndex = localIndex !== undefined ? localIndex : selectedHistoryIndex;

                        // Visibility Logic
                        const showEmployeeData = isAdmin || currentStep === 2;

                        return (
                            <div key={q.id} className="review-card" style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: idx === submission.questions.length - 1 ? 'none' : '1px solid #f1f5f9' }}>

                                {/* Question & Employee Answer */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#94a3b8', marginRight: '0.5rem' }}>{idx + 1}.</span>
                                        {q.text}
                                    </h3>

                                    {/* Employee Answer Display - Hidden in Step 1 for Manager */}
                                    {showEmployeeData ? (
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>EMPLOYEE ANSWER</div>
                                            <div style={{ color: '#334155', fontSize: '1rem' }}>
                                                {Array.isArray(answer) ? answer.join(', ') : (answer || 'No answer provided')}
                                            </div>
                                            {(selfRating !== undefined && selfRating !== null && selfRating !== '') && (
                                                <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>SELF RATING:</div>
                                                    <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600', fontSize: '0.9rem' }}>
                                                        {selfRating} / {q.max_score || 10}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px dashed #f87171', marginTop: '1rem', fontSize: '0.9rem', color: '#b91c1c', textAlign: 'center' }}>
                                            <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                            Employee answers and self-ratings are hidden during blind review (Step 1).
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                                    {/* Manager Review Section */}
                                    <div style={{
                                        background: displayData.bgColor,
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: `1px solid ${displayData.borderColor}`,
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: displayData.color, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Save size={14} /> {displayData.label} {isAdmin && "(Read Only)"}
                                            </h4>

                                            {isManager && currentStep === 2 && isStep2Submitted && !managerEditMode && (
                                                <button
                                                    type="button"
                                                    onClick={() => setManagerEditMode(true)}
                                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'white', border: '1px solid #166534', color: '#166534', cursor: 'pointer' }}
                                                >
                                                    Edit Review
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: isAdmin && reviewHistory.length > 0 ? '1rem' : '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                                Rating (out of {q.max_score || 10}) <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    min="0" max={q.max_score || 10} step="0.1"
                                                    required={isManager}
                                                    disabled={isAdmin || (currentStep === 2 && isStep2Submitted && !managerEditMode) || activeIndex !== -1}
                                                    value={displayData.rating ?? ''}
                                                    onChange={(e) => handleManagerRatingChange(q.id, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem 1rem', borderRadius: '6px',
                                                        border: '1px solid #d1d5db', fontSize: '1rem',
                                                        background: (isAdmin || (isStep2Submitted && !managerEditMode) || activeIndex !== -1) ? '#f9fafb' : 'white',
                                                        cursor: (isAdmin || (isStep2Submitted && !managerEditMode) || activeIndex !== -1) ? 'not-allowed' : 'text'
                                                    }}
                                                    placeholder={`0-${q.max_score || 10}`}
                                                />
                                                <Star size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: displayData.color }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                                Remarks (Optional)
                                            </label>
                                            <textarea
                                                value={displayData.remark || ''}
                                                onChange={(e) => handleManagerRemarkChange(q.id, e.target.value)}
                                                disabled={isAdmin || (currentStep === 2 && isStep2Submitted && !managerEditMode) || activeIndex !== -1}
                                                style={{
                                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '6px',
                                                    border: '1px solid #d1d5db', fontSize: '0.9rem', minHeight: '80px',
                                                    background: (isAdmin || (isStep2Submitted && !managerEditMode) || activeIndex !== -1) ? '#f9fafb' : 'white',
                                                    cursor: (isAdmin || (isStep2Submitted && !managerEditMode) || activeIndex !== -1) ? 'not-allowed' : 'text'
                                                }}
                                                placeholder="Manager comments..."
                                            />
                                        </div>

                                        {/* Local Switcher for Admin/Manager (Visible if history exists OR in Step 2) */}
                                        {(user?.is_staff || currentStep === 2) && (reviewHistory.length > 0 || currentStep === 2) && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem' }}>
                                                <div style={{ display: 'flex', color: '#94a3b8', gap: '0.8rem' }}>
                                                    <Save size={16} style={{ cursor: 'pointer' }} title="Current" onClick={() => setLocalHistoryIndices(p => ({ ...p, [q.id]: -1 }))} />
                                                    <Save size={16} style={{ cursor: 'pointer' }} title="Reset to Step 1" onClick={() => setLocalHistoryIndices(p => ({ ...p, [q.id]: -2 }))} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#64748b' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (activeIndex === -1) {
                                                                if (reviewHistory.length > 0) setLocalHistoryIndices(p => ({ ...p, [q.id]: reviewHistory.length - 1 }));
                                                                else setLocalHistoryIndices(p => ({ ...p, [q.id]: -2 }));
                                                            } else if (activeIndex === 0) {
                                                                setLocalHistoryIndices(p => ({ ...p, [q.id]: -2 }));
                                                            } else if (activeIndex > 0) {
                                                                setLocalHistoryIndices(p => ({ ...p, [q.id]: activeIndex - 1 }));
                                                            }
                                                        }}
                                                        disabled={activeIndex === -2}
                                                        style={{ background: 'none', border: 'none', cursor: activeIndex === -2 ? 'not-allowed' : 'pointer', color: activeIndex === -2 ? '#cbd5e1' : '#64748b', fontSize: '1.2rem' }}
                                                    >
                                                        &lt;
                                                    </button>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        {activeIndex === -2 ? 1 : (activeIndex === -1 ? reviewHistory.length + 2 : activeIndex + 2)} / {reviewHistory.length + 2}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (activeIndex === -2) {
                                                                if (reviewHistory.length > 0) setLocalHistoryIndices(p => ({ ...p, [q.id]: 0 }));
                                                                else setLocalHistoryIndices(p => ({ ...p, [q.id]: -1 }));
                                                            } else if (activeIndex === reviewHistory.length - 1) {
                                                                setLocalHistoryIndices(p => ({ ...p, [q.id]: -1 }));
                                                            } else if (activeIndex >= 0) {
                                                                setLocalHistoryIndices(p => ({ ...p, [q.id]: activeIndex + 1 }));
                                                            }
                                                        }}
                                                        disabled={activeIndex === -1}
                                                        style={{ background: 'none', border: 'none', cursor: activeIndex === -1 ? 'not-allowed' : 'pointer', color: activeIndex === -1 ? '#cbd5e1' : '#64748b', fontSize: '1.2rem' }}
                                                    >
                                                        &gt;
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Admin Review Section */}
                                    {isAdmin && (
                                        <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Save size={14} /> Admin Review
                                            </h4>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                                    Admin Rating (out of {q.max_score || 10}) <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="number"
                                                        min="0" max={q.max_score || 10} step="0.1"
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
                                                        placeholder={`0-${q.max_score || 10}`}
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


                    {/* Disciplinary Actions Section */}
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MessageSquare size={20} style={{ color: '#64748b' }} /> Disciplinary Record
                            </h3>
                            {!showDisciplinaryForm && (
                                <button
                                    type="button"
                                    onClick={() => setShowDisciplinaryForm(true)}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    + Record Action
                                </button>
                            )}
                        </div>

                        {/* Record New Action Form (Admin Only) */}
                        {showDisciplinaryForm && (
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#334155' }}>Issue New Disciplinary Action</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Action Type</label>
                                        <select
                                            value={actionForm.type}
                                            onChange={(e) => setActionForm(prev => ({ ...prev, type: e.target.value }))}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="">Select an action...</option>
                                            {actionTypes.map(t => (
                                                <option key={t.id} value={t.id}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: actionForm.type === 'custom' ? 'span 1' : 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Reason</label>
                                        <input
                                            type="text"
                                            value={actionForm.reason}
                                            onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                                            placeholder="Explain why this action is being issued..."
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                    {actionForm.type === 'custom' && (
                                        <>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Custom Label</label>
                                                <input
                                                    type="text"
                                                    value={actionForm.customLabel}
                                                    onChange={(e) => setActionForm(prev => ({ ...prev, customLabel: e.target.value }))}
                                                    placeholder="e.g. Behavioral Issue"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Deduction (Points)</label>
                                                <input
                                                    type="number"
                                                    value={actionForm.customDeduction}
                                                    onChange={(e) => setActionForm(prev => ({ ...prev, customDeduction: e.target.value }))}
                                                    placeholder="Points to deduct"
                                                    min="0"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowDisciplinaryForm(false)}
                                        style={{ padding: '0.5rem 1rem', color: '#64748b', cursor: 'pointer', border: 'none', background: 'none' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={issuingAction}
                                        onClick={handleIssueDisciplinaryAction}
                                        style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer', border: 'none' }}
                                    >
                                        {issuingAction ? 'Issuing...' : 'Issue Action'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* History List */}
                        {disciplinaryActions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                                No disciplinary actions recorded for this user.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {disciplinaryActions.map(action => {
                                    const type = actionTypes.find(t => t.id === action.action_type);
                                    return (
                                        <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#fff' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: `${type?.color || '#6366f1'}15`, color: type?.color || '#6366f1', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                                    {action.action_label || type?.label || action.action_type}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{action.reason}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Issued by {action.issued_by_name} on {new Date(action.issued_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <div style={{ color: '#f87171', fontWeight: '700', fontSize: '1rem' }}>
                                                    {action.deduction} pts
                                                </div>
                                                {(user?.is_staff || action.issued_by === user?.id) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleRemoveDisciplinaryAction(e, action.id)}
                                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', transition: 'all 0.2s' }}
                                                        onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                                                        onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                                                        title="Remove action"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

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
                                        {selfScore.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ {submission.questions.reduce((acc, q) => acc + (q.max_score || 10), 0)}</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ paddingRight: (user?.is_staff) ? '2rem' : '0', borderRight: (user?.is_staff) ? '1px solid #334155' : 'none' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager Score</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1, whiteSpace: 'nowrap' }}>
                                    {displayManagerScore.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ {submission.questions.reduce((acc, q) => acc + (q.max_score || 10), 0)}</span>
                                </div>
                                {totalDeduction < 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.2rem', fontWeight: '600' }}>
                                        Deduction Applied: {totalDeduction}
                                    </div>
                                )}
                            </div>

                            {user?.is_staff && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Score</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8', lineHeight: 1, whiteSpace: 'nowrap' }}>
                                        {displayAdminScore.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ {submission.questions.reduce((acc, q) => acc + (q.max_score || 10), 0)}</span>
                                    </div>
                                    {totalDeduction < 0 && (
                                        <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.2rem', fontWeight: '600' }}>
                                            Deduction Applied: {totalDeduction}
                                        </div>
                                    )}
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
                                    type="button"
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
                                    {submitting ? 'Submitting...' : (currentStep === 1 ? 'Next: Full Review' : 'Submit Final Review')}
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
