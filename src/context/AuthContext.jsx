import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { token, user: userData } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return response.data;
    };

    // Step 1: Initial registration (username, email, password)
    const register = async (userData) => {
        const response = await authAPI.register(userData);
        const { token, user: newUser } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);

        return response.data;
    };

    // Step 2: Verify OTP
    const verifyOTP = async (email, otp_code) => {
        const response = await authAPI.verifyOTP({ email, otp_code });
        const { token, user: updatedUser } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        return response.data;
    };

    // Resend OTP
    const resendOTP = async (email) => {
        const response = await authAPI.resendOTP(email);
        return response.data;
    };

    // Step 3: Complete profile
    const completeProfile = async (profileData) => {
        const response = await authAPI.completeProfile(profileData);
        const { user: updatedUser } = response.data;

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        return response.data;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const updateUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const value = {
        user,
        loading,
        login,
        register,
        verifyOTP,
        resendOTP,
        completeProfile,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isEmailVerified: user?.is_email_verified,
        isProfileComplete: user?.is_profile_complete,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
