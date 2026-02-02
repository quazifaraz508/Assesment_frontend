import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authAPI } from '../services/api';

const Signup = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', password_confirm: '', phone: '',
        role: 'employee', department: '', designation: '', university: '',
        dob: '', address: '', employee_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const [departments, setDepartments] = useState([]);

    const { register, verifyOTP, updateProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await authAPI.getDepartments();
                setDepartments(response.data);
            } catch (err) {
                console.error('Failed to fetch departments', err);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.password_confirm) return setError('Passwords do not match');

        setLoading(true);
        try {
            await register({
                email: formData.email, name: formData.name, password: formData.password,
                password_confirm: formData.password_confirm,
                phone: formData.phone, role: formData.role
            });
            setStep(2);
        } catch (err) {
            console.error("Registration error:", err);
            const errorData = err.response?.data || {};
            // Handle multiple error formats (string, object with keys, array)
            if (typeof errorData === 'string') {
                setError(errorData);
            } else if (errorData.detail) {
                setError(errorData.detail);
            } else if (errorData.non_field_errors) {
                setError(errorData.non_field_errors[0]);
            } else {
                // Get the first error message from any field
                const firstErrorKey = Object.keys(errorData)[0];
                if (firstErrorKey) {
                    const errorMsg = Array.isArray(errorData[firstErrorKey])
                        ? errorData[firstErrorKey][0]
                        : errorData[firstErrorKey];
                    // Capitalize field name for better readability
                    const fieldName = firstErrorKey.charAt(0).toUpperCase() + firstErrorKey.slice(1);
                    setError(`${fieldName}: ${errorMsg}`);
                } else {
                    setError('Registration failed. Please check your inputs.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOTP(formData.email, otp);
            setStep(3);
        } catch (err) {
            setError('Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileCompletion = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await updateProfile({
                departments: formData.department, designation: formData.designation,
                university: formData.university, dob: formData.dob,
                address: formData.address, employee_id: formData.employee_id
            });
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    // Styles - Premium Purple/Violet/Lavender Theme
    const inputClasses = "w-full px-5 py-4 bg-white/80 backdrop-blur-sm border border-violet-100 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium text-[15px] shadow-sm shadow-violet-100/50 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50";
    const labelClasses = "block text-sm font-bold text-slate-700 mb-2 ml-1";

    return (
        <AuthLayout
            title="Create your account"
            subtitle={step === 1 ? "Start your professional journey." : step === 2 ? "Verify your identity." : "Complete your profile."}
            leftTitle="Join Our Platform"
            leftSubtitle="Create your account to access personalized assessments, track your growth, and connect with your organization."
        >
            {step === 1 && (
                <div className="flex p-1.5 bg-white/60 backdrop-blur-sm rounded-2xl mb-10 border border-violet-100 shadow-sm">
                    <Link to="/login" className="flex-1 py-3.5 text-center text-sm font-bold text-slate-500 hover:text-violet-600 transition-all rounded-xl hover:bg-violet-50/50">
                        Login
                    </Link>
                    <button className="flex-1 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25 transition-all">
                        Sign Up
                    </button>
                </div>
            )}

            {/* Micro Stepper */}
            {step > 1 && (
                <div className="flex items-center justify-center gap-3 mb-8 text-[11px] font-bold uppercase tracking-widest">
                    <span className={step >= 1 ? "text-violet-600" : "text-slate-300"}>Account</span>
                    <span className="text-slate-200">/</span>
                    <span className={step >= 2 ? "text-violet-600" : "text-slate-300"}>Verify</span>
                    <span className="text-slate-200">/</span>
                    <span className={step >= 3 ? "text-violet-600" : "text-slate-300"}>Profile</span>
                </div>
            )}

            {error && (
                <div className="p-4 mb-8 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500"></span>
                    {error}
                </div>
            )}

            {step === 1 && (
                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className={labelClasses}>Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="John Doe" required />
                    </div>
                    <div>
                        <label className={labelClasses}>Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="name@organization.com" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClasses} placeholder="••••••••" minLength={8} required />
                        </div>
                        <div>
                            <label className={labelClasses}>Confirm</label>
                            <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} className={inputClasses} placeholder="••••••••" required />
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} placeholder="+91" required />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 px-6 mt-4 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-xl shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/40 disabled:opacity-70 flex items-center justify-center gap-2.5 text-[15px]">
                        {loading ? <Loader className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={20} /></>}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleVerify} className="space-y-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-xl shadow-violet-100">
                            <span className="font-bold text-2xl">@</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Check your email</h3>
                        <p className="text-slate-500">We've sent a verification code to <br /><strong className="text-slate-900">{formData.email}</strong></p>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-5 text-center text-4xl font-mono font-bold tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-50 outline-none text-slate-900 transition-all"
                            placeholder="••••••"
                            maxLength={6}
                            required
                        />
                        <p className="text-center text-xs text-slate-400 mt-3 font-medium">Enter the 6-digit code</p>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/25 transition-all duration-200 text-[15px]">
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    <button type="button" onClick={() => setStep(1)} className="w-full text-sm font-bold text-slate-500 hover:text-violet-600 transition-colors">Change Email</button>
                </form>
            )}

            {step === 3 && (
                <form onSubmit={handleProfileCompletion} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Designation</label>
                            <input type="text" name="designation" value={formData.designation} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label className={labelClasses}>Department</label>
                            <select name="department" value={formData.department} onChange={handleChange} className={inputClasses} required>
                                <option value="">Select...</option>
                                {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>University</label>
                        <input type="text" name="university" value={formData.university} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className={labelClasses}>Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className={labelClasses}>Employee ID</label>
                        <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className={labelClasses}>Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/25 transition-all duration-200 text-[15px] mt-4">
                        {loading ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
            )}
        </AuthLayout>
    );
};

export default Signup;
