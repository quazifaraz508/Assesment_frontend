import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthLayout from './AuthLayout';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authAPI.requestPasswordReset(email);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    // Styles - Premium Purple/Violet/Lavender Theme (matching Login/Signup)
    const inputClasses = "w-full px-5 py-4 bg-white/80 backdrop-blur-sm border border-violet-100 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium text-[15px] shadow-sm shadow-violet-100/50 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50";

    if (submitted) {
        return (
            <AuthLayout
                title="Check your inbox"
                subtitle="We have sent you a password reset link."
                leftTitle="Recovery in Progress"
                leftSubtitle="Follow the instructions in the email to regain access to your dashboard safely."
            >
                <div className="text-center space-y-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 mb-2 ring-8 ring-green-50/50 shadow-lg shadow-green-100">
                        <CheckCircle size={40} />
                    </div>

                    <p className="text-slate-600 text-lg">
                        A recovery link has been sent to <br /><strong className="text-slate-900 font-bold">{email}</strong>
                    </p>

                    <div className="space-y-4 pt-4">
                        <a
                            href={`mailto:${email}`}
                            className="block w-full py-4 px-6 bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all duration-200 hover:-translate-y-0.5"
                        >
                            Open Email App
                        </a>

                        <button
                            onClick={() => setSubmitted(false)}
                            className="block w-full py-3 px-6 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                        >
                            Try another email
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive instructions."
            leftTitle="Account Recovery"
            leftSubtitle="Securely reset your password to ensure your data stays protected."
        >
            {error && (
                <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-3">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClasses}
                        placeholder="name@organization.com"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-xl shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
                >
                    {loading ? <Loader className="animate-spin" size={20} /> : 'Send Reset Link'}
                </button>

                <div className="text-center mt-6">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft size={18} />
                        Back to Login
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export default ForgotPassword;
