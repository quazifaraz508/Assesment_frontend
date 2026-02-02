import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import CustomPopup from './CustomPopup';
import { Edit, Eye, X, Trash2 } from 'lucide-react';
import '../styles/Auth.css';

const DEPARTMENTS = ['Technical', 'Content', 'Youtube', 'Calling'];

const AdminAssessments = () => {
    const { user } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllAssessments, setShowAllAssessments] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Assessment Form State
    const [formData, setFormData] = useState({
        title: '',
        selectedTemplate: '',
        departments: [],
        start_date: '',
        end_date: ''
    });

    // Template Management State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({
        title: '',
        questions: []
    });

    // View/Edit Assessment State
    const [viewingAssessment, setViewingAssessment] = useState(null);
    const [editingAssessment, setEditingAssessment] = useState(null);
    const [editAssessmentForm, setEditAssessmentForm] = useState({
        title: '',
        departments: [],
        start_date: '',
        end_date: '',
        questions: []
    });

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

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
        fetchAssessments();
        fetchTemplates();
    }, []);

    const fetchAssessments = async () => {
        try {
            const res = await authAPI.getAssessments();
            // Sort: Live first, then Upcoming, then Ended
            const now = new Date();
            const sorted = res.data.sort((a, b) => {
                const getStatusPriority = (assessment) => {
                    const start = new Date(assessment.start_date);
                    const end = new Date(assessment.end_date);
                    if (now >= start && now <= end) return 0; // Live
                    if (now < start) return 1; // Upcoming
                    return 2; // Ended
                };
                return getStatusPriority(a) - getStatusPriority(b);
            });
            setAssessments(sorted);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch assessments", e);
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await authAPI.getTemplates();
            setTemplates(res.data);
        } catch (e) {
            console.error("Failed to fetch templates", e);
        }
    };

    const handleDepartmentChange = (dept) => {
        setFormData(prev => {
            const current = prev.departments;
            if (current.includes(dept)) {
                return { ...prev, departments: current.filter(d => d !== dept) };
            } else {
                return { ...prev, departments: [...current, dept] };
            }
        });
    };

    const handleTemplateChange = (e) => {
        const templateId = e.target.value;
        const template = templates.find(t => t.id.toString() === templateId.toString());
        setFormData(prev => ({
            ...prev,
            selectedTemplate: templateId,
            title: template ? template.title : ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.departments.length === 0) {
            setPopup({ show: true, title: 'Validation', message: 'Please select at least one department.', type: 'warning', mode: 'alert' });
            return;
        }
        if (!formData.selectedTemplate) {
            setPopup({ show: true, title: 'Validation', message: 'Please select a template.', type: 'warning', mode: 'alert' });
            return;
        }

        const template = templates.find(t => t.id.toString() === formData.selectedTemplate.toString());
        if (!template) {
            setPopup({ show: true, title: 'Error', message: 'Invalid template selected.', type: 'error', mode: 'alert' });
            return;
        }

        const payload = {
            title: formData.title,
            departments: formData.departments,
            questions: template.questions,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString()
        };

        setIsSubmitting(true);
        try {
            await authAPI.createAssessment(payload);
            fetchAssessments();
            setFormData({
                title: '',
                selectedTemplate: '',
                departments: [],
                start_date: '',
                end_date: ''
            });
            setPopup({ show: true, title: 'Success', message: 'Assessment created successfully!', type: 'success', mode: 'alert' });
        } catch (e) {
            console.error(e);
            setPopup({ show: true, title: 'Submission Failed', message: 'Failed to create assessment.', type: 'error', mode: 'alert' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Template Management Logic ---

    const openCreateTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({ title: '', questions: [{ id: Date.now(), text: '', type: 'text', max_score: 10 }] });
        setShowTemplateModal(true);
    };

    const openEditTemplate = (tpl) => {
        setEditingTemplate(tpl);
        setTemplateForm({
            title: tpl.title,
            questions: tpl.questions || []
        });
        setShowTemplateModal(true);
    };

    const handleTemplateSave = async (e) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await authAPI.updateTemplate(editingTemplate.id, templateForm);
                setPopup({ show: true, title: 'Updated', message: 'Template updated successfully!', type: 'success', mode: 'alert' });
            } else {
                await authAPI.createTemplate(templateForm);
                setPopup({ show: true, title: 'Created', message: 'Template created successfully!', type: 'success', mode: 'alert' });
            }
            setShowTemplateModal(false);
            fetchTemplates();
        } catch (err) {
            console.error(err);
            setPopup({ show: true, title: 'Error', message: 'Failed to save template.', type: 'error', mode: 'alert' });
        }
    };

    const deleteTemplate = async (id) => {
        const confirmDelete = async () => {
            try {
                await authAPI.deleteTemplate(id);
                fetchTemplates();
                setPopup({ show: true, title: 'Deleted', message: 'Template deleted.', type: 'success', mode: 'alert' });
            } catch (e) {
                console.error(e);
                setPopup({ show: true, title: 'Error', message: 'Failed to delete template.', type: 'error', mode: 'alert' });
            } finally {
                closePopup();
            }
        };

        setPopup({
            show: true,
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this template?',
            type: 'warning',
            mode: 'confirm',
            onConfirm: confirmDelete
        });
    };

    const handleQuestionChange = (idx, field, value) => {
        const newQuestions = [...templateForm.questions];
        newQuestions[idx] = { ...newQuestions[idx], [field]: value };
        setTemplateForm({ ...templateForm, questions: newQuestions });
    };

    const addQuestion = () => {
        setTemplateForm({
            ...templateForm,
            questions: [...templateForm.questions, { id: Date.now(), text: '', type: 'text', max_score: 10 }]
        });
    };

    const removeQuestion = (idx) => {
        const newQuestions = templateForm.questions.filter((_, i) => i !== idx);
        setTemplateForm({ ...templateForm, questions: newQuestions });
    };

    // Assessment view/edit handlers
    const openViewAssessment = (assessment) => {
        setViewingAssessment(assessment);
    };

    const openEditAssessment = (assessment) => {
        // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };
        setEditAssessmentForm({
            title: assessment.title,
            departments: assessment.departments || [],
            start_date: formatDateForInput(assessment.start_date),
            end_date: formatDateForInput(assessment.end_date),
            questions: assessment.questions || []
        });
        setEditingAssessment(assessment);
    };

    const handleEditDepartmentChange = (dept) => {
        setEditAssessmentForm(prev => ({
            ...prev,
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    // Question handlers for edit modal
    const handleEditQuestionChange = (idx, field, value) => {
        const newQuestions = [...editAssessmentForm.questions];
        newQuestions[idx][field] = value;
        setEditAssessmentForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const addEditQuestion = () => {
        setEditAssessmentForm(prev => ({
            ...prev,
            questions: [...prev.questions, { id: Date.now(), text: '', type: 'text', max_score: 10 }]
        }));
    };

    const removeEditQuestion = (idx) => {
        setEditAssessmentForm(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== idx)
        }));
    };

    const handleSaveAssessmentEdit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...editAssessmentForm,
                start_date: new Date(editAssessmentForm.start_date).toISOString(),
                end_date: new Date(editAssessmentForm.end_date).toISOString()
            };
            await authAPI.updateAssessment(editingAssessment.id, payload);
            setEditingAssessment(null);
            fetchAssessments();
            setPopup({ show: true, title: 'Updated', message: 'Assessment updated successfully!', type: 'success', mode: 'alert' });
        } catch (err) {
            console.error('Failed to update assessment:', err);
            setPopup({ show: true, title: 'Error', message: 'Failed to update assessment.', type: 'error', mode: 'alert' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAssessment = (assessment) => {
        setDeleteConfirmation(assessment);
    };

    const confirmDeleteAssessment = async () => {
        if (!deleteConfirmation) return;
        try {
            await authAPI.deleteAssessment(deleteConfirmation.id);
            setDeleteConfirmation(null);
            fetchAssessments();
            setPopup({ show: true, title: 'Deleted', message: 'Assessment deleted successfully.', type: 'success', mode: 'alert' });
        } catch (err) {
            console.error('Failed to delete assessment:', err);
            setPopup({ show: true, title: 'Error', message: 'Failed to delete assessment.', type: 'error', mode: 'alert' });
        }
    };

    return (
        <div className="dashboard-container">
            <CustomPopup {...popup} onClose={closePopup} />
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Manage Assessments</h1>
                    <div className="header-actions">
                        <button
                            onClick={openCreateTemplate}
                            className="auth-button"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}
                        >
                            + New Template
                        </button>
                        <ProfileMenu />
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                {/* Template Modal */}
                {showTemplateModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2>{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
                            <form onSubmit={handleTemplateSave}>
                                <div className="form-group">
                                    <label>Template Title</label>
                                    <input
                                        type="text"
                                        value={templateForm.title}
                                        onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                                        required
                                        placeholder="e.g. Technical Interview V1"
                                    />
                                </div>

                                <h3>Questions</h3>
                                {templateForm.questions.map((q, idx) => (
                                    <div key={idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                                                placeholder="Question Text"
                                                required
                                                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Score:</label>
                                                <input
                                                    type="number"
                                                    value={q.max_score || 10}
                                                    onChange={(e) => handleQuestionChange(idx, 'max_score', parseInt(e.target.value) || 0)}
                                                    style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                    min="0"
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeQuestion(idx)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0 0.5rem', cursor: 'pointer' }}>X</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addQuestion} style={{ marginBottom: '1rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>+ Add Question</button>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowTemplateModal(false)} className="auth-button" style={{ background: '#94a3b8' }}>Cancel</button>
                                    <button type="submit" className="auth-button">Save Template</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="auth-card" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
                    <h2>Create New Assessment</h2>
                    <form onSubmit={handleSubmit} className="auth-form">

                        <div className="form-group">
                            <label>Select Template</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    name="selectedTemplate"
                                    value={formData.selectedTemplate}
                                    onChange={handleTemplateChange}
                                    required
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Choose a Template --</option>
                                    {templates.map(tpl => (
                                        <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                                    ))}
                                </select>
                                {formData.selectedTemplate && (
                                    <button
                                        type="button"
                                        onClick={() => openEditTemplate(templates.find(t => t.id.toString() === formData.selectedTemplate.toString()))}
                                        style={{ padding: '0 1rem', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                <span style={{ color: '#64748b' }}>Or </span>
                                <button type="button" onClick={openCreateTemplate} style={{ background: 'none', border: 'none', color: '#6366f1', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>create a new template</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Assessment Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Assessment Name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Departments</label>
                            <div className="checkbox-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {DEPARTMENTS.map(dept => (
                                    <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.departments.includes(dept)}
                                            onChange={() => handleDepartmentChange(dept)}
                                        />
                                        {dept}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-button" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div className="button-content">
                                    <div className="spinner"></div>
                                    <span>Creating...</span>
                                </div>
                            ) : (
                                'Create Assessment'
                            )}
                        </button>
                    </form>
                </div>

                <div className="assessments-list" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h3>Existing Assessments</h3>
                    {loading ? <p>Loading...</p> : (
                        <>
                            <div className="assessment-grid" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                {assessments.length === 0 ? <p>No assessments found.</p> : (showAllAssessments ? assessments : assessments.slice(0, 5)).map(item => {
                                    const now = new Date();
                                    const start = new Date(item.start_date);
                                    const end = new Date(item.end_date);
                                    let status = 'upcoming';
                                    let statusColor = '#f59e0b';
                                    let statusText = 'Upcoming';

                                    if (now >= start && now <= end) {
                                        status = 'live';
                                        statusColor = '#10b981';
                                        statusText = 'Live Now';
                                    } else if (now > end) {
                                        status = 'ended';
                                        statusColor = '#64748b';
                                        statusText = 'Ended';
                                    }

                                    return (
                                        <div key={item.id} className="assessment-card" style={{
                                            background: 'white',
                                            padding: '1.25rem',
                                            borderRadius: '12px',
                                            border: `1px solid ${status === 'live' ? '#a7f3d0' : '#e2e8f0'}`,
                                            boxShadow: status === 'live' ? '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'start',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: statusColor }} />

                                            <div style={{ paddingLeft: '0.75rem', flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{item.title}</h4>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600',
                                                        color: statusColor,
                                                        backgroundColor: `${statusColor}15`,
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '999px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {statusText}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                    {item.departments && item.departments.map(d => (
                                                        <span key={d} style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: '500' }}>Schedule:</span>
                                                        <span>{start.toLocaleString()} — {end.toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                        Created: {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#64748b', display: 'block' }}>
                                                    {item.questions ? item.questions.length : 0} Questions
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openViewAssessment(item); }}
                                                        title="View Assessment"
                                                        style={{
                                                            padding: '0.5rem',
                                                            background: '#e0f2fe',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Eye size={16} color="#0284c7" />
                                                    </button>
                                                    {(status === 'upcoming' || status === 'live') && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEditAssessment(item); }}
                                                                title="Edit Assessment"
                                                                style={{
                                                                    padding: '0.5rem',
                                                                    background: '#fef3c7',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <Edit size={16} color="#d97706" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAssessment(item); }}
                                                                title="Delete Assessment"
                                                                style={{
                                                                    padding: '0.5rem',
                                                                    background: '#fee2e2',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <Trash2 size={16} color="#dc2626" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {assessments.length > 5 && (
                                <button
                                    onClick={() => setShowAllAssessments(!showAllAssessments)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {showAllAssessments ? 'Show Less' : `See All (${assessments.length})`}
                                    <span style={{ fontSize: '1.1rem' }}>{showAllAssessments ? '↑' : '↓'}</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* View Assessment Modal */}
            {viewingAssessment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button
                            onClick={() => setViewingAssessment(null)}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={18} color="#64748b" />
                        </button>

                        <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>{viewingAssessment.title}</h2>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {viewingAssessment.departments && viewingAssessment.departments.map(d => (
                                <span key={d} style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '4px', fontWeight: '500' }}>
                                    {d}
                                </span>
                            ))}
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                            <strong>Schedule:</strong> {new Date(viewingAssessment.start_date).toLocaleString()} — {new Date(viewingAssessment.end_date).toLocaleString()}
                        </div>

                        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Questions ({viewingAssessment.questions?.length || 0})</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {viewingAssessment.questions && viewingAssessment.questions.length > 0 ? (
                                viewingAssessment.questions.map((q, idx) => (
                                    <div key={q.id || idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                            <span style={{ fontWeight: '600', color: '#6366f1', minWidth: '24px' }}>{idx + 1}.</span>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '500', color: '#1e293b' }}>{q.text}</p>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Type: {q.type || 'text'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No questions in this assessment.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Assessment Modal */}
            {editingAssessment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', position: 'relative' }}>
                        <button
                            onClick={() => setEditingAssessment(null)}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={18} color="#64748b" />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Edit Assessment</h2>

                        <form onSubmit={handleSaveAssessmentEdit}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
                                <input
                                    type="text"
                                    value={editAssessmentForm.title}
                                    onChange={(e) => setEditAssessmentForm({ ...editAssessmentForm, title: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Departments</label>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {DEPARTMENTS.map(dept => (
                                        <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editAssessmentForm.departments.includes(dept)}
                                                onChange={() => handleEditDepartmentChange(dept)}
                                            />
                                            {dept}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
                                    <input
                                        type="datetime-local"
                                        value={editAssessmentForm.start_date}
                                        onChange={(e) => setEditAssessmentForm({ ...editAssessmentForm, start_date: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date</label>
                                    <input
                                        type="datetime-local"
                                        value={editAssessmentForm.end_date}
                                        onChange={(e) => setEditAssessmentForm({ ...editAssessmentForm, end_date: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                            </div>

                            {/* Questions Section */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <label style={{ fontWeight: '500' }}>Questions ({editAssessmentForm.questions.length})</label>
                                    <button
                                        type="button"
                                        onClick={addEditQuestion}
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            fontSize: '0.85rem',
                                            background: '#6366f1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + Add Question
                                    </button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {editAssessmentForm.questions.map((q, idx) => (
                                        <div key={q.id || idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ color: '#6366f1', fontWeight: '600', minWidth: '20px' }}>{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => handleEditQuestionChange(idx, 'text', e.target.value)}
                                                placeholder="Question text"
                                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Score:</label>
                                                <input
                                                    type="number"
                                                    value={q.max_score || 10}
                                                    onChange={(e) => handleEditQuestionChange(idx, 'max_score', parseInt(e.target.value) || 0)}
                                                    style={{ width: '55px', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                    min="0"
                                                />
                                            </div>
                                            <select
                                                value={q.type || 'text'}
                                                onChange={(e) => handleEditQuestionChange(idx, 'type', e.target.value)}
                                                style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            >
                                                <option value="text">Text</option>
                                                <option value="textarea">Long Text</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => removeEditQuestion(idx)}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {editAssessmentForm.questions.length === 0 && (
                                        <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No questions yet. Click "Add Question" to add one.</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-button"
                                style={{ width: '100%' }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="button-content">
                                        <div className="spinner"></div>
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '400px',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <Trash2 size={28} color="#dc2626" />
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.25rem' }}>Delete Assessment</h3>
                        <p style={{ color: '#64748b', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
                            Are you sure you want to delete <strong style={{ color: '#1e293b' }}>"{deleteConfirmation.title}"</strong>?<br />
                            <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>This action cannot be undone.</span>
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAssessment}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAssessments;
