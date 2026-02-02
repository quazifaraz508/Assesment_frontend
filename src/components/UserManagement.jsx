import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import CustomPopup from './CustomPopup';
import { authAPI } from '../services/api';
import {
    Users,
    Search,
    Plus,
    Edit2,
    Trash2,
    Key,
    Filter,
    ChevronDown,
    X,
    Check,
    Loader,
    Mail,
    Building2,
    Shield,
    UserCheck
} from 'lucide-react';

const ROLES = ['employee', 'employer', 'intern'];
const DEPARTMENTS = ['Technical', 'Content', 'Youtube', 'Calling', 'HR', 'Finance'];

const UserManagement = ({ embedded = false }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'employee',
        department: '',
        designation: '',
        phone_number: '',
        is_staff: false,
        is_superuser: false,
        password: ''
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchQuery, filterRole, filterDepartment]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await authAPI.getAllUsers ? await authAPI.getAllUsers() : { data: [] };
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let result = [...users];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.employee_id?.toLowerCase().includes(query)
            );
        }

        // Role filter
        if (filterRole !== 'all') {
            if (filterRole === 'admin') {
                result = result.filter(u => u.is_staff);
            } else if (filterRole === 'superadmin') {
                result = result.filter(u => u.is_superuser);
            } else {
                result = result.filter(u => u.role === filterRole);
            }
        }

        // Department filter
        if (filterDepartment !== 'all') {
            result = result.filter(u => u.department === filterDepartment);
        }

        setFilteredUsers(result);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            await authAPI.createUser(formData);
            setShowCreateModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to create user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            await authAPI.updateUser(selectedUser.id, formData);
            setShowEditModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to update user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        setFormLoading(true);
        try {
            await authAPI.deleteUser(selectedUser.id);
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to delete user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setFormLoading(true);
        try {
            await authAPI.adminResetPassword(selectedUser.id, formData.password);
            setShowResetPasswordModal(false);
            resetForm();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'employee',
            department: user.department || '',
            designation: user.designation || '',
            phone_number: user.phone_number || '',
            is_staff: user.is_staff || false,
            is_superuser: user.is_superuser || false,
            password: ''
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const openResetPasswordModal = (user) => {
        setSelectedUser(user);
        setFormData({ ...formData, password: '' });
        setShowResetPasswordModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            role: 'employee',
            department: '',
            designation: '',
            phone_number: '',
            is_staff: false,
            is_superuser: false,
            password: ''
        });
        setFormError('');
        setSelectedUser(null);
    };

    const inputClasses = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm";
    const labelClasses = "block text-sm font-bold text-slate-700 mb-2";

    const getRoleBadge = (user) => {
        if (user.is_superuser) {
            return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">Super Admin</span>;
        }
        if (user.is_staff) {
            return <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">Admin</span>;
        }
        const roleColors = {
            employee: 'bg-blue-100 text-blue-700',
            employer: 'bg-emerald-100 text-emerald-700',
            intern: 'bg-amber-100 text-amber-700'
        };
        return <span className={`px-2 py-1 ${roleColors[user.role] || 'bg-slate-100 text-slate-700'} text-xs font-bold rounded-full capitalize`}>{user.role}</span>;
    };

    const content = (
        <>
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-700 font-medium"
                    >
                        <option value="all">All Roles</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="admin">Admin</option>
                        {ROLES.map(role => (
                            <option key={role} value={role} className="capitalize">{role}</option>
                        ))}
                    </select>

                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-700 font-medium"
                    >
                        <option value="all">All Departments</option>
                        {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-violet-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">{users.length}</p>
                    <p className="text-sm text-slate-500">Total Users</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">{users.filter(u => u.is_staff).length}</p>
                    <p className="text-sm text-slate-500">Administrators</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'employee').length}</p>
                    <p className="text-sm text-slate-500">Employees</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-100 shadow-sm">
                    <p className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'intern').length}</p>
                    <p className="text-sm text-slate-500">Interns</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-violet-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-violet-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-violet-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader size={32} className="animate-spin text-violet-500 mx-auto mb-2" />
                                        <p className="text-slate-500">Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-violet-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{user.name || 'No Name'}</p>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getRoleBadge(user)}</td>
                                    <td className="px-6 py-4 text-slate-600">{user.department || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 ${user.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} text-xs font-bold rounded-full`}>
                                            {user.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => openResetPasswordModal(user)}
                                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                title="Reset Password"
                                            >
                                                <Key size={18} />
                                            </button>
                                            {user.id !== currentUser?.id && !user.is_superuser && (
                                                <button
                                                    onClick={() => openDeleteModal(user)}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            <CustomPopup show={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Create New User</h2>

                    {formError && (
                        <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={inputClasses}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={inputClasses}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className={inputClasses}
                                >
                                    {ROLES.map(role => (
                                        <option key={role} value={role} className="capitalize">{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Department</label>
                                <select
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className={inputClasses}
                                >
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Initial Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={inputClasses}
                                placeholder="••••••••"
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_staff}
                                    onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Admin Access</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_superuser}
                                    onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Super Admin</span>
                            </label>
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
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            </CustomPopup>

            {/* Edit User Modal */}
            <CustomPopup show={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Edit User</h2>

                    {formError && (
                        <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleEditUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={inputClasses}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={inputClasses}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className={inputClasses}
                                >
                                    {ROLES.map(role => (
                                        <option key={role} value={role} className="capitalize">{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Department</label>
                                <select
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className={inputClasses}
                                >
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_staff}
                                    onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Admin Access</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_superuser}
                                    onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Super Admin</span>
                            </label>
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
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {formLoading ? <Loader className="animate-spin" size={20} /> : <Check size={20} />}
                                Save Changes
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
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Delete User</h2>
                    <p className="text-slate-500 mb-6">
                        Are you sure you want to delete <strong>{selectedUser?.name || selectedUser?.email}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteUser}
                            disabled={formLoading}
                            className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {formLoading ? <Loader className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            Delete
                        </button>
                    </div>
                </div>
            </CustomPopup>

            {/* Reset Password Modal */}
            <CustomPopup show={showResetPasswordModal} onClose={() => { setShowResetPasswordModal(false); resetForm(); }}>
                <div className="p-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key size={32} className="text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Reset Password</h2>
                    <p className="text-slate-500 mb-6 text-center">
                        Set a new password for <strong>{selectedUser?.name || selectedUser?.email}</strong>
                    </p>

                    {formError && (
                        <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
                            {formError}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className={labelClasses}>New Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={inputClasses}
                            placeholder="Enter new password"
                            minLength={8}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setShowResetPasswordModal(false); resetForm(); }}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleResetPassword}
                            disabled={formLoading || !formData.password}
                            className="flex-1 py-3 px-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {formLoading ? <Loader className="animate-spin" size={20} /> : <Key size={20} />}
                            Reset Password
                        </button>
                    </div>
                </div>
            </CustomPopup>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout
            title="User Management"
            subtitle="Manage all users in the organization"
        >
            {content}
        </DashboardLayout>
    );
};

export default UserManagement;
