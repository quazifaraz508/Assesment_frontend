import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import NotificationMenu from './NotificationMenu';
import {
    GraduationCap,
    Home,
    ClipboardList,
    Users,
    UserCog,
    History,
    MessageSquare,
    Settings,
    Menu,
    X,
    ChevronRight,
    LogOut,
    Shield,
    Building2,
    FileBarChart,
    UserCheck,
    ScrollText
} from 'lucide-react';

const DashboardLayout = ({ children, title, subtitle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Simplified Navigation - 6 main tabs
    const navItems = [
        { label: 'Dashboard', icon: Home, path: '/dashboard', access: 'all' },
        { label: 'Team', icon: Users, path: '/team', access: 'staff' },
        { label: 'Assessments', icon: ClipboardList, path: '/assessments', access: 'staff' },
        { label: 'Users', icon: UserCog, path: '/users', access: 'superuser' },
        { label: 'Reports', icon: FileBarChart, path: '/reports', access: 'staff' },
        { label: 'Settings', icon: Settings, path: '/settings', access: 'staff' },
    ];

    const filteredNavItems = navItems.filter(item =>
        item.access === 'all' ||
        (item.access === 'staff' && user?.is_staff) ||
        (item.access === 'superuser' && user?.is_superuser)
    );

    const isActive = (path) => location.pathname.startsWith(path);

    const handleNavClick = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-violet-50/80 via-white to-purple-50/50 font-sans flex overflow-hidden">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-white border-r border-violet-100 shadow-xl shadow-violet-100/50 z-50
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:shadow-lg
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="p-6 border-b border-violet-100">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30">
                                <GraduationCap size={20} className="text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-slate-800">Teaching</span>
                                <span className="text-lg font-bold text-violet-600"> Pariksha</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {filteredNavItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => handleNavClick(item.path)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                                    ${isActive(item.path)
                                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                                    }
                                `}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                                {isActive(item.path) && (
                                    <ChevronRight size={16} className="ml-auto" />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-violet-100">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50/50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user?.is_staff ? 'Administrator' : 'Employee'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 lg:ml-0 overflow-hidden">
                {/* Top Bar */}
                <header className="flex-none bg-white/80 backdrop-blur-lg border-b border-violet-100 shadow-sm z-30">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-violet-50 transition-colors"
                            >
                                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            {/* Page Title */}
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">{title || 'Dashboard'}</h1>
                                {subtitle && (
                                    <p className="text-sm text-slate-500">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="flex items-center gap-3">
                            <NotificationMenu />
                            <ProfileMenu />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {/* Decorative Background Orbs */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-200/30 to-purple-100/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-200/20 to-violet-100/15 rounded-full blur-3xl"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
