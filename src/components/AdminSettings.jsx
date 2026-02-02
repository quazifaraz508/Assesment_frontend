import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Users, CheckCircle, UserCheck, Save } from 'lucide-react';

const AdminSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        allowed_email_domains: '',
        require_email_verification: false,
        enable_email_notifications: false,
        otp_expiry_minutes: 10,
    });
    const [stats, setStats] = useState({
        total_users: 0,
        verified_users: 0,
        complete_profiles: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await authAPI.getSiteSettings();
            console.log('API Response:', response.data);
            setSettings({
                allowed_email_domains: response.data.allowed_email_domains || '',
                require_email_verification: response.data.require_email_verification || false,
                enable_email_notifications: response.data.enable_email_notifications || false,
                otp_expiry_minutes: response.data.otp_expiry_minutes || 10,
            });
            if (response.data.stats) {
                setStats(response.data.stats);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await authAPI.updateSiteSettings(settings);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            // Refresh settings to get updated timestamp if needed
            fetchSettings();
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    // Helper to get array of domains for badge display
    const getDomainBadges = () => {
        if (!settings.allowed_email_domains) return [];
        return settings.allowed_email_domains.split(',').map(d => d.trim()).filter(Boolean);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                {/* Header */}
                <div className="bg-primary px-6 py-8">
                    <h1 className="text-2xl font-bold text-white">Site Settings</h1>
                    <p className="text-white/80 mt-1">Configure registration and authentication settings</p>
                </div>

                {/* Settings Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-8">

                    {/* Allowed Email Domains */}
                    <div className="space-y-3">
                        <label htmlFor="allowed_email_domains" className="block text-sm font-semibold text-gray-700">
                            Allowed Email Domains
                        </label>
                        <textarea
                            id="allowed_email_domains"
                            name="allowed_email_domains"
                            rows="3"
                            value={settings.allowed_email_domains}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none outline-none"
                            placeholder="@teachingpariksha.com, @company.com"
                        />
                        <p className="text-sm text-gray-500">
                            Enter comma-separated email domains that are allowed to register.<br />
                            Example: <code className="bg-gray-100 px-2 py-1 rounded text-red-500">@teachingpariksha.com, @example.com</code>
                        </p>

                        {/* Current Domains Preview */}
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 mt-3">
                            <h3 className="font-semibold text-indigo-700 mb-2">Currently Allowed Domains</h3>
                            <div className="flex flex-wrap gap-2">
                                {getDomainBadges().map((domain, index) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-500 text-white">
                                        {domain}
                                    </span>
                                ))}
                                {getDomainBadges().length === 0 && (
                                    <span className="text-gray-500 italic">No domains configured</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Email Verification Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <h3 className="font-semibold text-gray-800">Require Email Verification</h3>
                                <p className="text-sm text-gray-500 mt-1">Verify email via OTP before access</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="require_email_verification"
                                    checked={settings.require_email_verification}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>

                        {/* Email Notifications Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <h3 className="font-semibold text-gray-800">Email Notifications</h3>
                                <p className="text-sm text-gray-500 mt-1">Notify on new assessment assignment</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="enable_email_notifications"
                                    checked={settings.enable_email_notifications}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>
                    </div>

                    {/* OTP Expiry */}
                    <div className="space-y-2">
                        <label htmlFor="otp_expiry_minutes" className="block text-sm font-semibold text-gray-700">
                            OTP Expiry Time (minutes)
                        </label>
                        <input
                            type="number"
                            id="otp_expiry_minutes"
                            name="otp_expiry_minutes"
                            value={settings.otp_expiry_minutes}
                            onChange={handleChange}
                            min="1"
                            max="60"
                            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
                        />
                        <p className="text-sm text-gray-500">
                            Time in minutes before the OTP expires. Recommended: 10 minutes.
                        </p>
                    </div>

                    {/* Footer / Submit */}
                    <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-100">
                        <div className="text-sm text-gray-500 mb-4 md:mb-0">
                            Last updated: {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never'}
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-indigo-100 transition transform hover:-translate-y-0.5 shadow-lg ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 transition hover:shadow-lg">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 transition hover:shadow-lg">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Verified Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.verified_users}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 transition hover:shadow-lg">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <UserCheck className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Complete Profiles</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.complete_profiles}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
