import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import CustomPopup from './CustomPopup';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Edit, Eye, X, Trash2, Plus, ClipboardList, Calendar, Building2, FileText, Sparkles, ChevronDown, AlertCircle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DEPARTMENTS = ['Technical', 'Content', 'Youtube', 'Calling'];
const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Sortable Question Item Component
const SortableQuestion = ({ id, question, index, onQuestionChange, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-xl border-2 ${isDragging ? 'border-violet-400 shadow-lg' : 'border-slate-200 hover:border-violet-200'} transition-colors`}
        >
            <div className="flex gap-3 items-start">
                {/* Drag Handle */}
                <button
                    type="button"
                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={18} />
                </button>

                {/* Question Number */}
                <span className="flex items-center justify-center w-7 h-7 bg-violet-100 text-violet-600 font-bold text-sm rounded-lg flex-shrink-0">
                    {index + 1}
                </span>

                {/* Question Content */}
                <div className="flex-1 space-y-3">
                    <input
                        type="text"
                        value={question.text}
                        onChange={(e) => onQuestionChange('text', e.target.value)}
                        placeholder="Question text"
                        className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 hover:border-violet-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                    />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-500">Score:</label>
                            <select
                                value={question.max_score || 10}
                                onChange={(e) => onQuestionChange('max_score', parseInt(e.target.value))}
                                className="px-3 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                            >
                                {SCORE_OPTIONS.map(score => (
                                    <option key={score} value={score}>{score}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-500">Type:</label>
                            <select
                                value={question.type || 'text'}
                                onChange={(e) => onQuestionChange('type', e.target.value)}
                                className="px-2 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="text">Text</option>
                                <option value="textarea">Long Text</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Remove Button */}
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex-shrink-0 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

const AdminAssessments = ({ embedded = false }) => {
    const { user } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllAssessments, setShowAllAssessments] = useState(false);

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

    // Inline Sheet Alert State (for errors shown inside the sheet)
    const [sheetAlert, setSheetAlert] = useState({ show: false, message: '', type: 'error' });
    const [templateAlert, setTemplateAlert] = useState({ show: false, message: '', type: 'error' });

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

        // Clear any previous alert
        setTemplateAlert({ show: false, message: '', type: 'error' });

        // Validate template name is not duplicate
        const nameExists = templates.some(t =>
            t.title.toLowerCase().trim() === templateForm.title.toLowerCase().trim() &&
            (!editingTemplate || t.id !== editingTemplate.id)
        );
        if (nameExists) {
            setTemplateAlert({
                show: true,
                message: 'A template with this name already exists. Please use a different name.',
                type: 'error'
            });
            return;
        }

        // Validate that all questions have text
        const emptyQuestions = templateForm.questions.filter(q => !q.text || q.text.trim() === '');
        if (emptyQuestions.length > 0) {
            setTemplateAlert({
                show: true,
                message: `Please ensure the question is not empty. ${emptyQuestions.length} question(s) have empty text.`,
                type: 'error'
            });
            return;
        }

        // Validate at least one question exists
        if (templateForm.questions.length === 0) {
            setTemplateAlert({
                show: true,
                message: 'Template must have at least one question.',
                type: 'error'
            });
            return;
        }

        try {
            if (editingTemplate) {
                await authAPI.updateTemplate(editingTemplate.id, templateForm);
                setPopup({ show: true, title: 'Updated', message: 'Template updated successfully!', type: 'success', mode: 'alert' });
            } else {
                await authAPI.createTemplate(templateForm);
                setPopup({ show: true, title: 'Created', message: 'Template created successfully!', type: 'success', mode: 'alert' });
            }
            setTemplateAlert({ show: false, message: '', type: 'error' });
            setShowTemplateModal(false);
            fetchTemplates();
        } catch (err) {
            console.error(err);
            setTemplateAlert({
                show: true,
                message: 'Failed to save template. Please try again.',
                type: 'error'
            });
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

    // Drag and drop handlers for template questions
    const handleTemplateDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = templateForm.questions.findIndex(q => q.id === active.id);
            const newIndex = templateForm.questions.findIndex(q => q.id === over.id);
            setTemplateForm({
                ...templateForm,
                questions: arrayMove(templateForm.questions, oldIndex, newIndex)
            });
        }
    };

    // Drag and drop handlers for edit assessment questions
    const handleEditDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = editAssessmentForm.questions.findIndex(q => q.id === active.id);
            const newIndex = editAssessmentForm.questions.findIndex(q => q.id === over.id);
            setEditAssessmentForm(prev => ({
                ...prev,
                questions: arrayMove(prev.questions, oldIndex, newIndex)
            }));
        }
    };

    // DnD sensors configuration
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

        // Clear any previous alert
        setSheetAlert({ show: false, message: '', type: 'error' });

        // Validate that all questions have text
        const emptyQuestions = editAssessmentForm.questions.filter(q => !q.text || q.text.trim() === '');
        if (emptyQuestions.length > 0) {
            setSheetAlert({
                show: true,
                message: `Please ensure the question is not empty. ${emptyQuestions.length} question(s) have empty text.`,
                type: 'error'
            });
            return;
        }

        // Validate at least one question exists
        if (editAssessmentForm.questions.length === 0) {
            setSheetAlert({
                show: true,
                message: 'Assessment must have at least one question.',
                type: 'error'
            });
            return;
        }

        try {
            const payload = {
                ...editAssessmentForm,
                start_date: new Date(editAssessmentForm.start_date).toISOString(),
                end_date: new Date(editAssessmentForm.end_date).toISOString()
            };
            await authAPI.updateAssessment(editingAssessment.id, payload);
            setSheetAlert({ show: false, message: '', type: 'error' });
            setEditingAssessment(null);
            fetchAssessments();
            setPopup({ show: true, title: 'Updated', message: 'Assessment updated successfully!', type: 'success', mode: 'alert' });
        } catch (err) {
            console.error('Failed to update assessment:', err);
            setSheetAlert({
                show: true,
                message: 'Failed to update assessment. Please try again.',
                type: 'error'
            });
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

    const content = (
        <>
            <CustomPopup {...popup} onClose={closePopup} />

            {/* Action Button */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={openCreateTemplate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={18} />
                    New Template
                </button>
            </div>

            {/* Template Sheet (Right Side Panel) */}
            <Sheet open={showTemplateModal} onOpenChange={(open) => { if (!open) { setShowTemplateModal(false); setTemplateAlert({ show: false, message: '', type: 'error' }); } }}>
                <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                    <SheetHeader className="border-b border-slate-100 pb-4 mb-6">
                        <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500">
                            {editingTemplate ? 'Modify the template details and questions.' : 'Create a reusable template with questions for assessments.'}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Inline Alert for validation errors */}
                    {templateAlert.show && (
                        <div className="mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800">Validation Error</p>
                                <p className="text-sm text-red-600 mt-0.5">{templateAlert.message}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTemplateAlert({ show: false, message: '', type: 'error' })}
                                className="flex-shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <X size={16} className="text-red-500" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleTemplateSave} className="space-y-6">
                        {/* Template Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <ClipboardList size={16} className="text-violet-500" />
                                Template Title
                            </label>
                            <input
                                type="text"
                                value={templateForm.title}
                                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                                required
                                placeholder="e.g. Technical Interview V1"
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 hover:border-violet-300 rounded-xl text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>

                        {/* Questions Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <FileText size={16} className="text-violet-500" />
                                    Questions ({templateForm.questions.length})
                                </label>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold rounded-lg shadow-md transition-all duration-200"
                                >
                                    <Plus size={14} />
                                    Add Question
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 -mt-1">Drag questions to reorder them</p>
                            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTemplateDragEnd}>
                                    <SortableContext items={templateForm.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                        {templateForm.questions.map((q, idx) => (
                                            <SortableQuestion
                                                key={q.id}
                                                id={q.id}
                                                question={q}
                                                index={idx}
                                                onQuestionChange={(field, value) => handleQuestionChange(idx, field, value)}
                                                onRemove={() => removeQuestion(idx)}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                                {templateForm.questions.length === 0 && (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 font-medium">No questions yet</p>
                                        <p className="text-slate-400 text-xs mt-1">Click "Add Question" to add one</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <button
                                type="submit"
                                className="group relative w-full py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <Edit size={18} />
                                    {editingTemplate ? 'Update Template' : 'Create Template'}
                                </span>
                            </button>

                            {/* Delete Button - Only show when editing */}
                            {editingTemplate && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTemplateModal(false);
                                        deleteTemplate(editingTemplate.id);
                                    }}
                                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl border-2 border-red-200 hover:border-red-300 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete Template
                                </button>
                            )}
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Create New Assessment Card */}
            <div className="relative overflow-hidden">
                {/* Decorative gradient border */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-2xl opacity-75"></div>

                {/* Card content with inner white background */}
                <div className="relative m-[2px] bg-white/95 backdrop-blur-sm rounded-[14px] p-8">
                    {/* Floating decorative orbs */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/30 to-violet-200/30 rounded-full blur-xl"></div>

                    {/* Header with icon */}
                    <div className="relative flex items-center gap-4 mb-8">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                            <ClipboardList className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Create New Assessment</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Configure and schedule a new assessment for your team</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="relative space-y-7">

                        {/* Template Selection */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FileText size={16} className="text-violet-500" />
                                Select Template
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <select
                                        name="selectedTemplate"
                                        value={formData.selectedTemplate}
                                        onChange={handleTemplateChange}
                                        required
                                        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 hover:border-violet-300 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Choose a Template --</option>
                                        {templates.map(tpl => (
                                            <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {formData.selectedTemplate && (
                                    <button
                                        type="button"
                                        onClick={() => openEditTemplate(templates.find(t => t.id.toString() === formData.selectedTemplate.toString()))}
                                        className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-slate-500">
                                Or <button type="button" onClick={openCreateTemplate} className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-semibold underline underline-offset-2 decoration-violet-300 hover:decoration-violet-500 transition-colors">
                                    <Sparkles size={14} />
                                    create a new template
                                </button>
                            </p>
                        </div>

                        {/* Assessment Title */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <ClipboardList size={16} className="text-violet-500" />
                                Assessment Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Enter assessment name"
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 hover:border-violet-300 rounded-xl text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all duration-200"
                            />
                        </div>

                        {/* Departments */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Building2 size={16} className="text-violet-500" />
                                Departments
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {DEPARTMENTS.map(dept => (
                                    <label
                                        key={dept}
                                        className={`
                                            group flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 border-2
                                            ${formData.departments.includes(dept)
                                                ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-400 text-violet-700 shadow-md shadow-violet-100'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50/50'
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.departments.includes(dept)}
                                            onChange={() => handleDepartmentChange(dept)}
                                            className="w-4 h-4 rounded border-2 border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 transition-colors"
                                        />
                                        <span className="text-sm font-semibold">{dept}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Date Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Calendar size={16} className="text-green-500" />
                                    Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 hover:border-green-300 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all duration-200"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Calendar size={16} className="text-red-500" />
                                    End Date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 hover:border-red-300 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="group relative w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Plus size={18} strokeWidth={2.5} />
                                Create Assessment
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        </button>
                    </form>
                </div>
            </div>

            {/* Existing Assessments Section */}
            <div className="mt-8">
                {/* Section Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Existing Assessments</h3>
                        <p className="text-sm text-slate-500">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''} available</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {assessments.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No assessments found</p>
                                    <p className="text-sm text-slate-400 mt-1">Create your first assessment above</p>
                                </div>
                            ) : (showAllAssessments ? assessments : assessments.slice(0, 5)).map(item => {
                                const now = new Date();
                                const start = new Date(item.start_date);
                                const end = new Date(item.end_date);
                                let status = 'upcoming';
                                let statusClasses = 'bg-amber-100 text-amber-700 border-amber-200';
                                let statusText = 'Upcoming';
                                let borderClass = 'border-slate-200 hover:border-slate-300';
                                let accentColor = 'bg-amber-500';

                                if (now >= start && now <= end) {
                                    status = 'live';
                                    statusClasses = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                    statusText = 'Live Now';
                                    borderClass = 'border-emerald-200 hover:border-emerald-300';
                                    accentColor = 'bg-emerald-500';
                                } else if (now > end) {
                                    status = 'ended';
                                    statusClasses = 'bg-slate-100 text-slate-600 border-slate-200';
                                    statusText = 'Ended';
                                    borderClass = 'border-slate-200 hover:border-slate-300';
                                    accentColor = 'bg-slate-400';
                                }

                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative bg-white rounded-xl border-2 ${borderClass} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                                    >
                                        {/* Accent bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />

                                        <div className="flex justify-between items-start p-5 pl-6">
                                            <div className="flex-1">
                                                {/* Title & Status */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{item.title}</h4>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${statusClasses}`}>
                                                        {statusText}
                                                    </span>
                                                </div>

                                                {/* Departments */}
                                                <div className="flex gap-2 mt-3 flex-wrap">
                                                    {item.departments && item.departments.map(d => (
                                                        <span key={d} className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-50 text-violet-600 px-2.5 py-1 rounded-lg border border-violet-100">
                                                            <Building2 size={12} />
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Schedule Info */}
                                                <div className="mt-3 space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        <span className="font-medium">Schedule:</span>
                                                        <span>{start.toLocaleString()} — {end.toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        Created: {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Side: Questions count & Actions */}
                                            <div className="text-right flex flex-col items-end gap-3">
                                                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                                                    {item.questions ? item.questions.length : 0} Questions
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openViewAssessment(item); }}
                                                        title="View Assessment"
                                                        className="p-2.5 bg-sky-100 hover:bg-sky-200 text-sky-600 rounded-lg transition-colors duration-200"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {(status === 'upcoming' || status === 'live') && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEditAssessment(item); }}
                                                                title="Edit Assessment"
                                                                className="p-2.5 bg-amber-100 hover:bg-amber-200 text-amber-600 rounded-lg transition-colors duration-200"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAssessment(item); }}
                                                                title="Delete Assessment"
                                                                className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {assessments.length > 5 && (
                            <button
                                onClick={() => setShowAllAssessments(!showAllAssessments)}
                                className="flex items-center justify-center gap-2 w-full mt-4 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                            >
                                {showAllAssessments ? 'Show Less' : `See All (${assessments.length})`}
                                <ChevronDown size={18} className={`transition-transform duration-300 ${showAllAssessments ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* View Assessment Modal */}
            {viewingAssessment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative mt-16">
                        <button
                            onClick={() => setViewingAssessment(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors duration-200"
                        >
                            <X size={18} className="text-slate-500" />
                        </button>

                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 pr-10">{viewingAssessment.title}</h2>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {viewingAssessment.departments && viewingAssessment.departments.map(d => (
                                    <span key={d} className="text-xs font-medium bg-violet-50 text-violet-700 px-3 py-1 rounded-full">
                                        {d}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="font-semibold">Schedule:</span>
                                <span>{new Date(viewingAssessment.start_date).toLocaleString()} — {new Date(viewingAssessment.end_date).toLocaleString()}</span>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-700 pb-2 border-b border-slate-100">
                                    Questions ({viewingAssessment.questions?.length || 0})
                                </h3>

                                <div className="space-y-3">
                                    {viewingAssessment.questions && viewingAssessment.questions.length > 0 ? (
                                        viewingAssessment.questions.map((q, idx) => (
                                            <div key={q.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <div className="flex gap-3 items-start">
                                                    <span className="text-violet-600 font-bold min-w-[24px]">{idx + 1}.</span>
                                                    <div className="flex-1">
                                                        <p className="text-slate-800 font-medium">{q.text}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-xs text-slate-500 uppercase">Type: {q.type || 'text'}</span>
                                                            <span className="text-xs text-slate-500">Max Score: {q.max_score || 10}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 italic text-center py-4">No questions in this assessment.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Assessment Sheet (Right Side Panel) */}
            <Sheet open={!!editingAssessment} onOpenChange={(open) => { if (!open) { setEditingAssessment(null); setSheetAlert({ show: false, message: '', type: 'error' }); } }}>
                <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                    <SheetHeader className="border-b border-slate-100 pb-4 mb-6">
                        <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                                <Edit className="w-5 h-5 text-white" />
                            </div>
                            Edit Assessment
                        </SheetTitle>
                        <SheetDescription className="text-slate-500">
                            Modify the assessment details, departments, schedule, and questions.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Inline Alert for validation errors */}
                    {sheetAlert.show && (
                        <div className="mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800">Validation Error</p>
                                <p className="text-sm text-red-600 mt-0.5">{sheetAlert.message}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSheetAlert({ show: false, message: '', type: 'error' })}
                                className="flex-shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <X size={16} className="text-red-500" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSaveAssessmentEdit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <ClipboardList size={16} className="text-violet-500" />
                                Title
                            </label>
                            <input
                                type="text"
                                value={editAssessmentForm.title}
                                onChange={(e) => setEditAssessmentForm({ ...editAssessmentForm, title: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 hover:border-violet-300 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>

                        {/* Departments */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Building2 size={16} className="text-violet-500" />
                                Departments
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DEPARTMENTS.map(dept => (
                                    <label
                                        key={dept}
                                        className={`
                                            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border-2 text-sm
                                            ${editAssessmentForm.departments.includes(dept)
                                                ? 'bg-violet-50 border-violet-400 text-violet-700 shadow-sm'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-300'
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={editAssessmentForm.departments.includes(dept)}
                                            onChange={() => handleEditDepartmentChange(dept)}
                                            className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                                        />
                                        <span className="font-medium">{dept}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Calendar size={16} className="text-green-500" />
                                    Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editAssessmentForm.start_date}
                                    onChange={(e) => setEditAssessmentForm({ ...editAssessmentForm, start_date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 hover:border-green-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Calendar size={16} className="text-red-500" />
                                    End Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editAssessmentForm.end_date}
                                    onChange={(e) => setEditAssessmentForm({ ...editAssessmentForm, end_date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 hover:border-red-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Questions Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <FileText size={16} className="text-violet-500" />
                                    Questions ({editAssessmentForm.questions.length})
                                </label>
                                <button
                                    type="button"
                                    onClick={addEditQuestion}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold rounded-lg shadow-md transition-all duration-200"
                                >
                                    <Plus size={14} />
                                    Add Question
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 -mt-1">Drag questions to reorder them</p>
                            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEditDragEnd}>
                                    <SortableContext items={editAssessmentForm.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                        {editAssessmentForm.questions.map((q, idx) => (
                                            <SortableQuestion
                                                key={q.id}
                                                id={q.id}
                                                question={q}
                                                index={idx}
                                                onQuestionChange={(field, value) => handleEditQuestionChange(idx, field, value)}
                                                onRemove={() => removeEditQuestion(idx)}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                                {editAssessmentForm.questions.length === 0 && (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 font-medium">No questions yet</p>
                                        <p className="text-slate-400 text-xs mt-1">Click "Add Question" to add one</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                className="group relative w-full py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <Edit size={16} />
                                    Save Changes
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            </button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={28} className="text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Assessment</h3>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            Are you sure you want to delete <strong className="text-slate-800">"{deleteConfirmation.title}"</strong>?<br />
                            <span className="text-red-500 text-sm">This action cannot be undone.</span>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAssessment}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout title="Manage Assessments" subtitle="Create and manage assessment templates and schedules">
            {content}
        </DashboardLayout>
    );
};

export default AdminAssessments;
