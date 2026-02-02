import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Slack, Plus, Trash2, Save, Send, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminSlackSettings = () => {
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
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Status Messages */}
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 transition-all transform animate-in slide-in-from-top-1 px-6 ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100">
                {/* Header */}
                <div className="bg-primary px-8 py-10 text-white">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                            <Slack className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Slack Integration</h1>
                    </div>
                    <p className="text-indigo-100/80 max-w-2xl">
                        Manage automated notifications for assessments. Send direct messages to users and post updates to specific channels via webhooks.
                    </p>
                </div>

                <div className="p-8 space-y-12">
                    {/* Global Toggle */}
                    <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between gap-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-indigo-600" />
                                    Global Slack Notifications
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    When enabled, users with registered Slack accounts will receive direct messages when a new assessment is assigned.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-110">
                                <input
                                    type="checkbox"
                                    checked={settings.enable_slack_notifications}
                                    onChange={handleToggleNotifications}
                                    disabled={savingSettings}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </section>

                    {/* Reminder Schedule */}
                    <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-indigo-600" />
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
                                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                                <button
                                    onClick={handleAddInterval}
                                    disabled={savingSettings || !newInterval}
                                    className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-100"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {settings.slack_reminder_intervals.split(',').filter(i => i.trim()).map((interval) => (
                                <div key={interval} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold group hover:bg-indigo-100 transition-colors">
                                    <span>{interval} mins before</span>
                                    <button
                                        onClick={() => handleRemoveInterval(interval)}
                                        className="text-indigo-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {settings.slack_reminder_intervals.split(',').filter(i => i.trim()).length === 0 && (
                                <p className="text-slate-400 italic text-sm">No reminders scheduled.</p>
                            )}
                        </div>
                    </section>

                    {/* Webhook Management */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <LinkIcon className="w-6 h-6 text-indigo-600" />
                                    Channel Webhooks
                                </h3>
                                <p className="text-slate-500 text-sm mt-1 font-medium">
                                    Assessment updates will be broadcasted to all channels listed below.
                                </p>
                            </div>
                        </div>

                        {/* Add Webhook Form */}
                        <form onSubmit={handleAddWebhook} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                            <div className="md:col-span-4 space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Channel Name</label>
                                <input
                                    type="text"
                                    placeholder="#general-updates"
                                    value={newWebhook.name}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder-slate-400"
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
                                    className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder-slate-400"
                                />
                            </div>
                            <div className="md:col-span-2 flex items-end">
                                <button
                                    type="submit"
                                    disabled={addingWebhook}
                                    className="w-full h-[46px] flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-70"
                                >
                                    {addingWebhook ? <span className="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span> : <Plus className="w-5 h-5" />}
                                    <span>Add</span>
                                </button>
                            </div>
                        </form>

                        {/* Webhooks Table */}
                        <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600">Channel / Name</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600">Webhook URL</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 text-right pr-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {webhooks.map((webhook) => (
                                        <tr key={webhook.id} className="hover:bg-slate-50/50 transition duration-150 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{webhook.name || 'Unnamed Channel'}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">Added {new Date(webhook.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-500 font-mono truncate max-w-xs">{webhook.url}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <button
                                                    onClick={() => handleDeleteWebhook(webhook.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200 opacity-0 group-hover:opacity-100"
                                                    title="Delete Webhook"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {webhooks.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="w-8 h-8 opacity-20" />
                                                    <p>No webhooks configured yet. Assessment alerts will only be sent via direct messages.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminSlackSettings;
