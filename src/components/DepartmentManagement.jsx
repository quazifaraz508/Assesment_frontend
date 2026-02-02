import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import CustomPopup from './CustomPopup';
import { authAPI } from '../services/api';
import {
    Building2,
    Plus,
    Edit2,
    Trash2,
    Users,
    ClipboardList,
    CheckCircle2,
    TrendingUp,
    Loader,
    X,
    UserCheck,
    Search
} from 'lucide-react';

const DepartmentManagement = ({ embedded = false }) => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        manager_id: ''
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // For now, we'll derive departments from users since there may not be a departments table
            const usersRes = await authAPI.getAllUsers ? await authAPI.getAllUsers() : { data: [] };
            const allUsers = usersRes.data || [];
            setUsers(allUsers);

            // Extract unique departments
            const deptMap = {};
            allUsers.forEach(u => {
                const dept = u.department || 'Unassigned';
                if (!deptMap[dept]) {
                    deptMap[dept] = {
                        name: dept,
                        employees: [],
                        managers: [],
                        completedAssessments: 0,
                        totalAssessments: 0
                    };
                }
                deptMap[dept].employees.push(u);
                if (u.role === 'employer' || u.is_staff) {
                    deptMap[dept].managers.push(u);
                }
            });

            setDepartments(Object.values(deptMap).filter(d => d.name !== 'Unassigned'));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            // API call to create department
            await authAPI.createDepartment(formData);
            setShowCreateModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to create department');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditDepartment = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            await authAPI.updateDepartment(selectedDepartment.name, formData);
            setShowEditModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to update department');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteDepartment = async () => {
        setFormLoading(true);
        try {
            await authAPI.deleteDepartment(selectedDepartment.name);
            setShowDeleteModal(false);
            setSelectedDepartment(null);
            fetchData();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to delete department');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = (dept) => {
        setSelectedDepartment(dept);
        setFormData({
            name: dept.name,
            description: dept.description || '',
            manager_id: dept.managers[0]?.id || ''
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (dept) => {
        setSelectedDepartment(dept);
        setShowDeleteModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            manager_id: ''
        });
        setFormError('');
        setSelectedDepartment(null);
    };

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inputClasses = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm";
    const labelClasses = "block text-sm font-bold text-slate-700 mb-2";

    const content = (
        <>
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                    />
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Add Department
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-violet-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Building2 className="text-violet-500" size={24} />
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{departments.length}</p>
                            <p className="text-sm text-slate-500">Departments</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Users className="text-blue-500" size={24} />
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{users.length}</p>
                            <p className="text-sm text-slate-500">Total Employees</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <UserCheck className="text-emerald-500" size={24} />
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {departments.reduce((acc, d) => acc + d.managers.length, 0)}
                            </p>
                            <p className="text-sm text-slate-500">Managers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-amber-500" size={24} />
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {Math.round(departments.reduce((acc, d) => acc + d.employees.length, 0) / Math.max(departments.length, 1))}
                            </p>
                            <p className="text-sm text-slate-500">Avg Team Size</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Departments Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader size={32} className="animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDepartments.length === 0 ? (
                        <div className="col-span-full bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg p-12 text-center">
                            <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No departments found</p>
                        </div>
                    ) : filteredDepartments.map(dept => (
                        <div
                            key={dept.name}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden hover:shadow-xl transition-all"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <Building2 size={24} className="text-white" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditModal(dept)}
                                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(dept)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1">{dept.name}</h3>
                                {dept.description && (
                                    <p className="text-sm text-slate-500 mb-4">{dept.description}</p>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-violet-50">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-800">{dept.employees.length}</p>
                                        <p className="text-xs text-slate-500">Employees</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-800">{dept.managers.length}</p>
                                        <p className="text-xs text-slate-500">Managers</p>
                                    </div>
                                </div>

                                {dept.managers.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-violet-50">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Department Head</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                                                {dept.managers[0]?.name?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{dept.managers[0]?.name || 'No name'}</p>
                                                <p className="text-xs text-slate-500">{dept.managers[0]?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Department Modal */}
            <CustomPopup show={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Department</h2>

                    {formError && (
                        <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleCreateDepartment} className="space-y-4">
                        <div>
                            <label className={labelClasses}>Department Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={inputClasses}
                                placeholder="e.g., Engineering"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`${inputClasses} resize-none`}
                                rows={3}
                                placeholder="Brief description of the department..."
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Department Manager (Optional)</label>
                            <select
                                value={formData.manager_id}
                                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                className={inputClasses}
                            >
                                <option value="">Select a manager</option>
                                {users.filter(u => u.role === 'employer' || u.is_staff).map(u => (
                                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {formLoading ? <Loader className="animate-spin" size={20} /> : <Plus size={20} />}
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </CustomPopup>

            {/* Edit Department Modal */}
            <CustomPopup show={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Edit Department</h2>

                    {formError && (
                        <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleEditDepartment} className="space-y-4">
                        <div>
                            <label className={labelClasses}>Department Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={inputClasses}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`${inputClasses} resize-none`}
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Department Manager</label>
                            <select
                                value={formData.manager_id}
                                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                className={inputClasses}
                            >
                                <option value="">Select a manager</option>
                                {users.filter(u => u.role === 'employer' || u.is_staff).map(u => (
                                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => { setShowEditModal(false); resetForm(); }}
                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {formLoading ? <Loader className="animate-spin" size={20} /> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </CustomPopup>

            {/* Delete Confirmation Modal */}
            <CustomPopup show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Department</h2>
                    <p className="text-slate-500 mb-6">
                        Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>?
                        This will affect {selectedDepartment?.employees?.length || 0} employees.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteDepartment}
                            disabled={formLoading}
                            className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {formLoading ? <Loader className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            Delete
                        </button>
                    </div>
                </div>
            </CustomPopup>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout
            title="Department Management"
            subtitle="Manage organization structure and departments"
        >
            {content}
        </DashboardLayout>
    );
};

export default DepartmentManagement;
