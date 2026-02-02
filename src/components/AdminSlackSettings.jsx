import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import DashboardLayout from './DashboardLayout';
import { Slack, Plus, Trash2, Send, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminSlackSettings = ({ embedded = false }) => {
    const [settings, setSettings] = useState({
        enable_slack_notifications: false,
        slack_reminder_intervals: '60',
    });
    const [webhooks, setWebhooks] = useState([]);
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '' });
    const [newInterval, setNewInterval] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [addingWebhook, setAddingWebhook] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, webhooksRes] = await Promise.all([
                authAPI.getSiteSettings(),
                authAPI.getSlackWebhooks()
            ]);

            setSettings({
                enable_slack_notifications: settingsRes.data.enable_slack_notifications || false,
                slack_reminder_intervals: settingsRes.data.slack_reminder_intervals || '30,60,180',
            });
            setWebhooks(webhooksRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Slack settings:', error);
            setMessage({ type: 'error', text: 'Failed to load Slack configuration.' });
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (updatedFields) => {
        setSavingSettings(true);
        const updatedSettings = {
            ...settings,
            ...updatedFields
        };

        try {
            await authAPI.updateSiteSettings(updatedSettings);
            setSettings(updatedSettings);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error) {
            console.error('Error updating Slack settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSavingSettings(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleAddInterval = () => {
        if (!newInterval || isNaN(newInterval)) return;
        const currentIntervals = settings.slack_reminder_intervals.split(',').filter(i => i.trim());
        if (currentIntervals.includes(newInterval.trim())) {
            setNewInterval('');
            return;
        }
        const updatedIntervals = [...currentIntervals, newInterval.trim()].sort((a, b) => parseInt(a) - parseInt(b)).join(',');
        handleUpdateSettings({ slack_reminder_intervals: updatedIntervals });
        setNewInterval('');
    };

    const handleRemoveInterval = (intervalToRemove) => {
        const updatedIntervals = settings.slack_reminder_intervals
            .split(',')
            .filter(i => i.trim() && i.trim() !== intervalToRemove.trim())
            .join(',');
        handleUpdateSettings({ slack_reminder_intervals: updatedIntervals });
    };

    const handleToggleNotifications = () => {
        handleUpdateSettings({ enable_slack_notifications: !settings.enable_slack_notifications });
    };

    const handleAddWebhook = async (e) => {
        e.preventDefault();
        if (!newWebhook.url) return;

        setAddingWebhook(true);
        try {
            const response = await authAPI.addSlackWebhook(newWebhook);
            setWebhooks([response.data, ...webhooks]);
            setNewWebhook({ name: '', url: '' });
            setMessage({ type: 'success', text: 'Webhook added successfully!' });
        } catch (error) {
            console.error('Error adding webhook:', error);
            setMessage({ type: 'error', text: 'Failed to add webhook URL.' });
        } finally {
            setAddingWebhook(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleDeleteWebhook = async (id) => {
        if (!window.confirm('Are you sure you want to remove this webhook?')) return;

        try {
            await authAPI.deleteSlackWebhook(id);
            setWebhooks(webhooks.filter(w => w.id !== id));
            setMessage({ type: 'success', text: 'Webhook removed.' });
        } catch (error) {
            console.error('Error deleting webhook:', error);
            setMessage({ type: 'error', text: 'Failed to remove webhook.' });
        } finally {
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    if (loading) {
        const loadingContent = (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
            </div>
        );
        if (embedded) return loadingContent;
        return (
            <DashboardLayout title="Slack Integration" subtitle="Manage automated Slack notifications">
                {loadingContent}
            </DashboardLayout>
        );
    }

    const content = (
        <>
            {/* Status Messages */}
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 transition-all animate-pulse ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-semibold">{message.text}</span>
                </div>
            )}

            <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl shadow-violet-500/20">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                            <Slack size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Slack Integration</h2>
                            <p className="text-violet-100/80">Send direct messages to users and post updates to channels</p>
                        </div>
                    </div>
                </div>

                {/* Global Toggle */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 p-6">
                    <div className="flex items-center justify-between gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Send size={20} className="text-violet-600" />
                                Global Slack Notifications
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Users with registered Slack accounts will receive direct messages when a new assessment is assigned.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enable_slack_notifications}
                                onChange={handleToggleNotifications}
                                disabled={savingSettings}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600 shadow-inner"></div>
                        </label>
                    </div>
                </div>

                {/* Reminder Schedule */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle size={20} className="text-violet-600" />
                                Reminder Schedule
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Configure when users should receive direct messages before an assessment deadline.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="Minutes"
                                value={newInterval}
                                onChange={(e) => setNewInterval(e.target.value)}
                                className="w-24 px-3 py-2 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                            <button
                                onClick={handleAddInterval}
                                disabled={savingSettings || !newInterval}
                                className="p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {settings.slack_reminder_intervals.split(',').filter(i => i.trim()).map((interval) => (
                            <div key={interval} className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-full font-bold group hover:bg-violet-100 transition-colors">
                                <span>{interval} mins before</span>
                                <button
                                    onClick={() => handleRemoveInterval(interval)}
                                    className="text-violet-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {settings.slack_reminder_intervals.split(',').filter(i => i.trim()).length === 0 && (
                            <p className="text-slate-400 italic text-sm">No reminders scheduled.</p>
                        )}
                    </div>
                </div>

                {/* Webhook Management */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <LinkIcon size={20} className="text-violet-600" />
                            Channel Webhooks
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Assessment updates will be broadcasted to all channels listed below.</p>
                    </div>

                    {/* Add Webhook Form */}
                    <form onSubmit={handleAddWebhook} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-violet-50/50 border border-violet-100 rounded-2xl">
                        <div className="md:col-span-4 space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Channel Name</label>
                            <input
                                type="text"
                                placeholder="#general-updates"
                                value={newWebhook.name}
                                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-6 space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Webhook URL</label>
                            <input
                                type="url"
                                required
                                placeholder="https://hooks.slack.com/services/..."
                                value={newWebhook.url}
                                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-end">
                            <button
                                type="submit"
                                disabled={addingWebhook}
                                className="w-full h-[46px] flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition shadow-lg shadow-violet-200 disabled:opacity-70"
                            >
                                {addingWebhook ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Plus size={20} />}
                                <span>Add</span>
                            </button>
                        </div>
                    </form>

                    {/* Webhooks Table */}
                    <div className="overflow-hidden bg-white/80 backdrop-blur-sm border border-violet-100 rounded-2xl shadow-lg shadow-violet-100/50">
                        <table className="w-full text-left">
                            <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Channel / Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider">Webhook URL</th>
                                    <th className="px-6 py-4 text-xs font-bold text-violet-600 uppercase tracking-wider text-right pr-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-violet-50">
                                {webhooks.map((webhook) => (
                                    <tr key={webhook.id} className="hover:bg-violet-50/50 transition group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{webhook.name || 'Unnamed Channel'}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">Added {new Date(webhook.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-500 font-mono truncate max-w-xs">{webhook.url}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <button
                                                onClick={() => handleDeleteWebhook(webhook.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                title="Delete Webhook"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {webhooks.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle size={32} className="opacity-20" />
                                                <p>No webhooks configured yet. Assessment alerts will only be sent via direct messages.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout title="Slack Integration" subtitle="Manage automated notifications for assessments">
            {content}
        </DashboardLayout>
    );
};

export default AdminSlackSettings;
