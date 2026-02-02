import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { Mail, Briefcase, Building2, MapPin, Phone, Calendar, User, Hash } from 'lucide-react';

const UserProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const profileItems = [
        { label: 'Email', value: user?.email, icon: Mail },
        { label: 'Role', value: user?.role, icon: User, isBadge: true },
        { label: 'Employee ID', value: user?.employee_id, icon: Hash },
        { label: 'Department', value: user?.department, icon: Building2 },
        { label: 'Designation', value: user?.designation, icon: Briefcase },
        { label: 'Phone', value: user?.phone_number, icon: Phone },
        { label: 'Personal Email', value: user?.personal_email, icon: Mail },
        { label: 'Date of Joining', value: user?.date_of_joining, icon: Calendar },
        { label: 'Office Location', value: user?.office_location, icon: MapPin },
    ];

    return (
        <DashboardLayout title="My Profile" subtitle="Your account information">
            {/* Profile Card */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl shadow-violet-500/20">
                <div className="flex items-center gap-6">
                    {user?.profile_picture ? (
                        <img
                            src={user.profile_picture.startsWith('http') ? user.profile_picture : `${import.meta.env.VITE_BACKEND_URL}${user.profile_picture}`}
                            alt={user?.name}
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-white/30"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold ring-4 ring-white/30">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
                        <p className="text-violet-100">{user?.email}</p>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="px-4 py-1 bg-white/20 rounded-full text-sm font-semibold">
                                {user?.department || 'No Department'}
                            </span>
                            <span className="px-4 py-1 bg-white/20 rounded-full text-sm font-semibold">
                                {user?.is_staff ? 'Administrator' : 'Employee'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                <div className="p-6 border-b border-violet-100">
                    <h3 className="text-lg font-bold text-slate-800">Profile Information</h3>
                    <p className="text-sm text-slate-500 mt-1">Your registered account details</p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profileItems.map((item, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-violet-50/50 border border-violet-100 rounded-xl">
                            <div className="p-2 bg-violet-100 rounded-lg">
                                <item.icon size={20} className="text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    {item.label}
                                </p>
                                {item.isBadge ? (
                                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-full">
                                        {item.value || 'N/A'}
                                    </span>
                                ) : (
                                    <p className="text-slate-800 font-semibold truncate">
                                        {item.value || 'N/A'}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserProfile;
