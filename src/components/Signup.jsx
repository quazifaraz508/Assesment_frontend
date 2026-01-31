import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Signup = () => {
    const { user, register, verifyOTP, resendOTP, completeProfile, logout, isEmailVerified, isProfileComplete } = useAuth();
    const navigate = useNavigate();

    // Determine initial step based on user state
    const getInitialStep = () => {
        if (!user) return 1; // New user - start at registration
        if (!isEmailVerified) return 2; // Registered but not verified - go to OTP
        if (!isProfileComplete) return 3; // Verified but profile incomplete - go to profile
        return 1; // Fallback
    };

    const [step, setStep] = useState(getInitialStep);
    const [email, setEmail] = useState(user?.email || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Update step when user state changes
    useEffect(() => {
        if (user) {
            setEmail(user.email);
            if (!isEmailVerified) {
                setStep(2);
            } else if (!isProfileComplete) {
                setStep(3);
            }
        }
    }, [user, isEmailVerified, isProfileComplete]);

    // Step 1: Initial registration
    const [registerData, setRegisterData] = useState({
        email: '',
        password: '',
        password_confirm: ''
    });

    // Step 2: OTP
    const [otpCode, setOtpCode] = useState('');

    // Step 3: Profile
    const [profileData, setProfileData] = useState({
        name: '',
        role: '',
        employee_id: '',
        department: '',
        designation: '',
        phone_number: '',
        personal_email: '',
        date_of_joining: '',
        office_location: '',
    });

    // Handle Cancel - logout and go to login
    const handleCancel = async () => {
        await logout();
        navigate('/login');
    };

    // Handle Back - go to previous step
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setError('');
            setSuccessMessage('');
        }
    };

    // Step 1: Handle registration
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (registerData.password !== registerData.password_confirm) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await register(registerData);
            setEmail(registerData.email);
            setSuccessMessage('OTP sent to your email!');
            setStep(2);
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData) {
                const errorMessages = Object.entries(errorData)
                    .map(([field, messages]) => {
                        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                        return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                    })
                    .join('\n');
                setError(errorMessages);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle OTP verification
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verifyOTP(email, otpCode);
            setSuccessMessage('Email verified successfully!');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle resend OTP
    const handleResendOTP = async () => {
        setError('');
        setLoading(true);

        try {
            await resendOTP(email);
            setSuccessMessage('New OTP sent to your email!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Handle profile completion
    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await completeProfile(profileData);
            navigate('/dashboard');
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData) {
                const errorMessages = Object.entries(errorData)
                    .map(([field, messages]) => {
                        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                        return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                    })
                    .join('\n');
                setError(errorMessages);
            } else {
                setError('Failed to complete profile. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step indicator component
    const StepIndicator = () => (
        <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-number">{step > 1 ? '✓' : '1'}</div>
                <span className="step-label">REGISTER</span>
            </div>
            <div className={`step-line ${step > 1 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-number">{step > 2 ? '✓' : '2'}</div>
                <span className="step-label">VERIFY</span>
            </div>
            <div className={`step-line ${step > 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <span className="step-label">PROFILE</span>
            </div>
        </div>
    );

    return (
        <div className="auth-container">
            <div className="auth-card signup-card">
                <div className="auth-header">
                    <h1>{step === 1 ? 'Create Account' : step === 2 ? 'Verify Email' : 'Complete Profile'}</h1>
                    <p>
                        {step === 1 ? 'Start your journey with us' :
                            step === 2 ? 'Enter the OTP sent to your email' :
                                'Fill in your professional details'}
                    </p>
                </div>

                <StepIndicator />

                {error && <div className="auth-error">{error}</div>}
                {successMessage && <div className="auth-success">{successMessage}</div>}

                {/* Step 1: Registration Form */}
                {step === 1 && (
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Company Email *</label>
                            <input
                                type="email"
                                id="email"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                placeholder="yourname@teachingpariksha.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <input
                                type="password"
                                id="password"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                placeholder="Create a strong password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password_confirm">Confirm Password *</label>
                            <input
                                type="password"
                                id="password_confirm"
                                value={registerData.password_confirm}
                                onChange={(e) => setRegisterData({ ...registerData, password_confirm: e.target.value })}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="otp">Enter OTP *</label>
                            <input
                                type="text"
                                id="otp"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                required
                                className="otp-input"
                            />
                            <p className="otp-info">We sent an OTP to <strong>{email}</strong></p>
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <div className="button-row">
                            <button type="button" className="resend-button" onClick={handleResendOTP} disabled={loading}>
                                Resend OTP
                            </button>
                            <button type="button" className="cancel-button" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: Profile Completion */}
                {step === 3 && (
                    <form onSubmit={handleCompleteProfile} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Full Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Role *</label>
                                <select
                                    id="role"
                                    value={profileData.role}
                                    onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    <option value="intern">Intern</option>
                                    <option value="employee">Employee</option>
                                    <option value="employer">Employer</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="employee_id">Employee ID *</label>
                                <input
                                    type="text"
                                    id="employee_id"
                                    value={profileData.employee_id}
                                    onChange={(e) => setProfileData({ ...profileData, employee_id: e.target.value })}
                                    placeholder="EMP001"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="department">Department *</label>
                                <select
                                    id="department"
                                    value={profileData.department}
                                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    <option value="Technical">Technical</option>
                                    <option value="Content">Content</option>
                                    <option value="Youtube">Youtube</option>
                                    <option value="Calling">Calling</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="designation">Designation *</label>
                                <input
                                    type="text"
                                    id="designation"
                                    value={profileData.designation}
                                    onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                                    placeholder="Software Engineer"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone_number">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    value={profileData.phone_number}
                                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="personal_email">Personal Email</label>
                                <input
                                    type="email"
                                    id="personal_email"
                                    value={profileData.personal_email}
                                    onChange={(e) => setProfileData({ ...profileData, personal_email: e.target.value })}
                                    placeholder="personal@email.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="date_of_joining">Date of Joining</label>
                                <input
                                    type="date"
                                    id="date_of_joining"
                                    value={profileData.date_of_joining}
                                    onChange={(e) => setProfileData({ ...profileData, date_of_joining: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="office_location">Office Location</label>
                            <input
                                type="text"
                                id="office_location"
                                value={profileData.office_location}
                                onChange={(e) => setProfileData({ ...profileData, office_location: e.target.value })}
                                placeholder="Building A, Floor 3"
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Completing Profile...' : 'Complete Profile'}
                        </button>

                        <div className="button-row">
                            <button type="button" className="back-button" onClick={handleBack}>
                                Back
                            </button>
                            <button type="button" className="cancel-button" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
