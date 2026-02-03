import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import CustomPopup from './CustomPopup';
import { AlertCircle, CheckCircle2, Clock, Save } from 'lucide-react';

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
                        try {
                            const subRes = await authAPI.getAssessmentSubmission(id);
                            setAnswers(subRes.data.answers || {});
                            setRatings(subRes.data.ratings || {});
                        } catch (subErr) {
                            console.error("Failed to fetch submission", subErr);
                        }

                        if (now <= endDate) {
                            setIsSubmitted(false);
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
        const question = questions.find(q => q.id.toString() === questionId.toString());
        const maxScore = question?.max_score || 10;

        const numValue = value === '' ? '' : parseFloat(value);
        if (value === '' || (numValue >= 0 && numValue <= maxScore)) {
            setRatings(prev => ({
                ...prev,
                [questionId]: numValue
            }));
        }
    };

    const totalRating = Object.values(ratings).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const maxTotalRating = questions.reduce((sum, q) => sum + (q.max_score || 10), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const missingRatings = questions.some(q => ratings[q.id] === undefined || ratings[q.id] === '');
        if (missingRatings) {
            setShowValidationErrors(true);
            return;
        }

        setSubmitting(true);
        try {
            await authAPI.submitAssessment(id, { answers, ratings });

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

    if (loading) {
        return (
            <DashboardLayout title="Assessment" subtitle="Loading...">
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Assessment" subtitle="Error">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    {error}
                </div>
            </DashboardLayout>
        );
    }

    if (!assessment) return null;

    const isExpired = new Date() > new Date(assessment.end_date);

    return (
        <DashboardLayout
            title={assessment.title}
            subtitle={assessment.is_submitted && !isExpired ? "Edit your response" : (assessment.is_submitted ? "Your Submission" : "Complete the assessment below")}
        >
            <CustomPopup {...popup} onClose={closePopup} />

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                {/* Progress Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="text-white">
                        <p className="text-sm font-medium opacity-80">
                            {isSubmitted ? 'Viewing Submission' : 'In Progress'}
                        </p>
                        <p className="text-lg font-bold">{questions.length} Questions</p>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <Clock size={16} />
                        Due: {new Date(assessment.end_date).toLocaleDateString()}
                    </div>
                </div>

                {/* Questions */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-violet-50/50 border border-violet-100 rounded-xl p-5">
                            <p className="font-bold text-slate-800 mb-4 text-lg">
                                <span className="inline-flex items-center justify-center w-8 h-8 mr-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm rounded-full">
                                    {idx + 1}
                                </span>
                                {q.text}
                            </p>

                            {q.type === 'text' && (
                                <textarea
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    disabled={isSubmitted}
                                    className={`w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none outline-none min-h-[120px] ${isSubmitted ? 'bg-slate-100 cursor-not-allowed' : ''
                                        }`}
                                    placeholder="Type your answer here..."
                                    required={!isSubmitted}
                                />
                            )}

                            {(q.type === 'radio' || q.type === 'checkbox') && (
                                <div className="flex flex-col gap-3">
                                    {q.options.map((opt, optIdx) => (
                                        <label key={optIdx} className={`flex items-center px-4 py-3 bg-white border border-violet-100 rounded-lg cursor-pointer hover:bg-violet-50 transition ${isSubmitted ? 'cursor-not-allowed opacity-70' : ''
                                            }`}>
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
                                                className="mr-3 w-5 h-5 text-violet-600 focus:ring-violet-500"
                                            />
                                            <span className="text-slate-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Self-Rating Dropdown */}
                            <div className="mt-4 p-4 bg-white border border-violet-200 rounded-xl flex items-center gap-4">
                                <label className="text-slate-600 font-semibold text-sm whitespace-nowrap">
                                    Self Rating:
                                </label>
                                <select
                                    value={ratings[q.id] ?? ''}
                                    onChange={(e) => handleRatingChange(q.id, e.target.value)}
                                    disabled={isSubmitted}
                                    className={`px-4 py-2.5 bg-violet-50 border rounded-lg font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${(showValidationErrors && (ratings[q.id] === undefined || ratings[q.id] === ''))
                                        ? 'border-red-400 bg-red-50'
                                        : 'border-violet-200 hover:border-violet-300'
                                        } ${isSubmitted ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''}`}
                                >
                                    <option value="">Select</option>
                                    {Array.from({ length: q.max_score || 10 }, (_, i) => i + 1).map(score => (
                                        <option key={score} value={score}>{score}</option>
                                    ))}
                                </select>
                                <span className="text-slate-400 text-sm">/ {q.max_score || 10}</span>
                                {showValidationErrors && (ratings[q.id] === undefined || ratings[q.id] === '') && (
                                    <span className="text-red-500 text-xs font-medium">Required</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Total Self-Rating Score */}
                    <div className="bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-2xl p-6 text-center">
                        <p className="text-violet-700 font-semibold text-sm mb-2">
                            Your Total Self-Rating
                        </p>
                        <p className="text-3xl font-bold text-violet-600">
                            {totalRating.toFixed(1)}
                            <span className="text-lg text-violet-400 font-normal ml-2">/ {maxTotalRating}</span>
                        </p>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-violet-100">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-3 bg-white border border-violet-200 text-slate-600 font-bold rounded-xl hover:bg-violet-50 transition"
                        >
                            {isSubmitted ? 'Back to Dashboard' : 'Cancel'}
                        </button>

                        {!isSubmitted && (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Submitting...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save size={18} />
                                        {assessment.is_submitted ? 'Update Submission' : 'Submit Assessment'}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default AssessmentRunner;
