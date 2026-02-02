import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader, ArrowRight, Check } from 'lucide-react';
import AuthLayout from './AuthLayout';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error("Login error:", err);
            const errorData = err.response?.data || {};
            let msg = errorData.detail || errorData.non_field_errors?.[0];

            // Handle field-specific errors
            if (!msg && errorData.email) msg = `Email: ${errorData.email[0]}`;
            if (!msg && errorData.password) msg = `Password: ${errorData.password[0]}`;

            setLocalError(msg || 'Invalid credentials or server error.');
        } finally {
            setLoading(false);
        }
    };

    // Styles - Premium Purple/Violet/Lavender Theme
    const inputClasses = "w-full px-5 py-4 bg-white/80 backdrop-blur-sm border border-violet-100 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium text-[15px] shadow-sm shadow-violet-100/50 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50";
    const labelClasses = "block text-sm font-bold text-slate-700 mb-2 ml-1";

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Please sign in to your dashboard."
            leftTitle="Welcome Back"
            leftSubtitle="Access your performance dashboard, track your progress, and stay updated with the latest assessments."
        >
            {/* Design-matching Tabs - Premium Violet Theme */}
            <div className="flex p-1.5 bg-white/60 backdrop-blur-sm rounded-2xl mb-10 border border-violet-100 shadow-sm">
                <button className="flex-1 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25 transition-all">
                    Login
                </button>
                <Link to="/signup" className="flex-1 py-3.5 text-center text-sm font-bold text-slate-500 hover:text-violet-600 transition-all rounded-xl hover:bg-violet-50/50">
                    Sign Up
                </Link>
            </div>

            {localError && (
                <div className="p-4 mb-8 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500"></span>
                    {localError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="email" className={labelClasses}>Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClasses}
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label htmlFor="password" className="text-sm font-bold text-slate-700">Password</label>
                            <Link to="/forgot-password" className="text-sm font-bold text-violet-600 hover:text-violet-700 hover:underline decoration-2 underline-offset-4">
                                Forgot?
                            </Link>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${inputClasses} pr-12`}
                                placeholder="Enter password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <label className="flex items-center cursor-pointer select-none group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <div className="w-5 h-5 border-2 border-slate-300 rounded-[6px] transition-all peer-checked:bg-violet-600 peer-checked:border-violet-600 peer-focus:ring-2 peer-focus:ring-violet-200 bg-white group-hover:border-violet-400"></div>
                            {rememberMe && <Check size={12} className="absolute left-[4px] top-[4px] text-white pointer-events-none" strokeWidth={4} />}
                        </div>
                        <span className="ml-3 text-sm text-slate-600 font-semibold group-hover:text-slate-800 transition-colors">Keep me logged in</span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-xl shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-[15px]"
                >
                    {loading ? (
                        <>
                            <Loader className="animate-spin" size={20} />
                            <span>Authenticating...</span>
                        </>
                    ) : (
                        <>
                            <span>Log In to Dashboard</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>


        </AuthLayout>
    );
};

export default Login;
