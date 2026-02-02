import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loader, CheckCircle, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthLayout from './AuthLayout';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { uidb64, token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) return setError('Passwords do not match');
        if (password.length < 8) return setError('Password must be at least 8 characters');

        setLoading(true);
        try {
            await authAPI.confirmPasswordReset(uidb64, token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout
                title="Password Updated"
                subtitle="Your account is now secure."
            >
                <div className="text-center space-y-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 mb-2 ring-8 ring-green-50/50 shadow-lg shadow-green-100">
                        <CheckCircle size={40} />
                    </div>

                    <p className="text-slate-600 text-lg">
                        Redirecting to login in a moment...
                    </p>

                    <Link
                        to="/login"
                        className="block w-full py-4 px-6 bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Login Now
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    const inputClasses = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-50 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium text-[15px]";
    const labelClasses = "block text-sm font-bold text-slate-700 mb-1.5 ml-1";

    return (
        <AuthLayout
            title="Set New Password"
            subtitle="Create a strong password for your account."
        >
            {error && (
                <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-3">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className={labelClasses}>New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClasses}
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div>
                    <label className={labelClasses}>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClasses}
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2 text-[15px]"
                >
                    {loading ? <Loader className="animate-spin" size={20} /> : <>Reset Password <ArrowRight size={20} /></>}
                </button>
            </form>
        </AuthLayout>
    );
};

export default ResetPassword;
