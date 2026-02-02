import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import DashboardLayout from './DashboardLayout';
import { Users, CheckCircle, UserCheck, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminSettings = ({ embedded = false }) => {
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
            fetchSettings();
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const getDomainBadges = () => {
        if (!settings.allowed_email_domains) return [];
        return settings.allowed_email_domains.split(',').map(d => d.trim()).filter(Boolean);
    };

    if (loading) {
        const loadingContent = (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
            </div>
        );
        if (embedded) return loadingContent;
        return (
            <DashboardLayout title="Site Settings" subtitle="Configure registration and authentication">
                {loadingContent}
            </DashboardLayout>
        );
    }

    const content = (
        <>
            {/* Status Messages */}
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-semibold">{message.text}</span>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-100 rounded-xl">
                            <Users size={24} className="text-violet-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Users</p>
                            <p className="text-2xl font-bold text-slate-800">{stats.total_users}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-100/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <CheckCircle size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Verified Users</p>
                            <p className="text-2xl font-bold text-slate-800">{stats.verified_users}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-lg shadow-purple-100/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <UserCheck size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Complete Profiles</p>
                            <p className="text-2xl font-bold text-slate-800">{stats.complete_profiles}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-6">
                    <h2 className="text-xl font-bold text-white">Configuration</h2>
                    <p className="text-violet-100/80 mt-1">Manage email domains and authentication options</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Allowed Email Domains */}
                    <div className="space-y-3">
                        <label htmlFor="allowed_email_domains" className="block text-sm font-bold text-slate-700">
                            Allowed Email Domains
                        </label>
                        <textarea
                            id="allowed_email_domains"
                            name="allowed_email_domains"
                            rows="3"
                            value={settings.allowed_email_domains}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none outline-none"
                            placeholder="@teachingpariksha.com, @company.com"
                        />
                        <p className="text-sm text-slate-500">
                            Enter comma-separated email domains that are allowed to register.
                        </p>

                        {/* Current Domains Preview */}
                        <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 mt-3">
                            <h3 className="font-semibold text-violet-700 mb-2">Currently Allowed Domains</h3>
                            <div className="flex flex-wrap gap-2">
                                {getDomainBadges().map((domain, index) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                                        {domain}
                                    </span>
                                ))}
                                {getDomainBadges().length === 0 && (
                                    <span className="text-slate-400 italic">No domains configured</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Email Verification Toggle */}
                        <div className="flex items-center justify-between p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                            <div>
                                <h3 className="font-semibold text-slate-800">Require Email Verification</h3>
                                <p className="text-sm text-slate-500 mt-1">Verify email via OTP before access</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="require_email_verification"
                                    checked={settings.require_email_verification}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600 shadow-inner"></div>
                            </label>
                        </div>

                        {/* Email Notifications Toggle */}
                        <div className="flex items-center justify-between p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                            <div>
                                <h3 className="font-semibold text-slate-800">Email Notifications</h3>
                                <p className="text-sm text-slate-500 mt-1">Notify on new assessment assignment</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="enable_email_notifications"
                                    checked={settings.enable_email_notifications}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600 shadow-inner"></div>
                            </label>
                        </div>
                    </div>

                    {/* OTP Expiry */}
                    <div className="space-y-2">
                        <label htmlFor="otp_expiry_minutes" className="block text-sm font-bold text-slate-700">
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
                            className="w-full max-w-xs px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition outline-none"
                        />
                        <p className="text-sm text-slate-500">
                            Time in minutes before the OTP expires. Recommended: 10 minutes.
                        </p>
                    </div>

                    {/* Footer / Submit */}
                    <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-violet-100">
                        <div className="text-sm text-slate-500 mb-4 md:mb-0">
                            Last updated: {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never'}
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-violet-100 transition shadow-lg shadow-violet-500/30 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saving ? (
                                <>
                                    <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={20} className="mr-2" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout title="Site Settings" subtitle="Configure registration and authentication settings">
            {content}
        </DashboardLayout>
    );
};

export default AdminSettings;

