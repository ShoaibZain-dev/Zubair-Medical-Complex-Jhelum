'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { NotificationLog } from '@/types';
import { 
  Bell, Save, CheckCircle2, AlertCircle, Shield, MessageSquare, 
  Phone, Send, RefreshCw, KeyRound, Radio, Eye, Loader2 
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State
  const [hospitalNumber, setHospitalNumber] = useState('0318-3621341');
  const [provider, setProvider] = useState<'mock' | 'meta_whatsapp' | 'twilio'>('mock');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Provider config keys (never exposed publicly)
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioAuth, setTwilioAuth] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');

  // Logs
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/admin/login');
        } else if (data.user.role !== 'Admin') {
          router.push('/admin/dashboard');
        } else {
          setCurrentUser(data.user);
          loadSettingsAndLogs();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadSettingsAndLogs = () => {
    Promise.all([
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/admin/notifications/logs').then(r => r.json())
    ]).then(([settingsData, logsData]) => {
      setLoading(false);
      if (settingsData) {
        setHospitalNumber(settingsData.hospital_notification_number || '+92 315 6621341');
        setProvider(settingsData.messaging_provider || 'mock');
        setNotificationsEnabled(settingsData.notifications_enabled !== 'false');
        setMetaPhoneId(settingsData.meta_whatsapp_phone_number_id || '');
        setMetaToken(settingsData.meta_whatsapp_token || '');
        setTwilioSid(settingsData.twilio_account_sid || '');
        setTwilioAuth(settingsData.twilio_auth_token || '');
        setTwilioFrom(settingsData.twilio_from_number || '');
      }
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      }
    }).catch(() => setLoading(false));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_notification_number: hospitalNumber,
          messaging_provider: provider,
          notifications_enabled: notificationsEnabled ? 'true' : 'false',
          meta_whatsapp_phone_number_id: metaPhoneId,
          meta_whatsapp_token: metaToken,
          twilio_account_sid: twilioSid,
          twilio_auth_token: twilioAuth,
          twilio_from_number: twilioFrom
        })
      });

      setSaving(false);
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings.');
      }
    } catch {
      setSaving(false);
      alert('Network error saving settings.');
    }
  };

  const refreshLogs = () => {
    setLoadingLogs(true);
    fetch('/api/admin/notifications/logs')
      .then(r => r.json())
      .then(d => {
        setLoadingLogs(false);
        if (Array.isArray(d)) setLogs(d);
      })
      .catch(() => setLoadingLogs(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNavbar userRole={currentUser?.role} userName={currentUser?.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Notification Gateway & Messaging Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure automated SMS and WhatsApp delivery channels for patients and clinic reception.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Notification settings updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#1E90FF]" />
              Gateway Configuration
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Notification Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Automatic Notification Service
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Dispatch notifications upon booking, confirmation, and cancellation.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={e => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E90FF]"></div>
                </label>
              </div>

              {/* Hospital Reception Notification Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Hospital / Reception Notification Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={hospitalNumber}
                    onChange={e => setHospitalNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#1E90FF]"
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  Receives automated alerts when new patient appointments are submitted.
                </span>
              </div>

              {/* Provider Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Select Messaging Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setProvider('mock')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      provider === 'mock'
                        ? 'border-[#1E90FF] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Mock Mode</span>
                      <Radio className={`w-3.5 h-3.5 ${provider === 'mock' ? 'text-[#1E90FF]' : 'text-slate-300'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Simulated dispatch with full audit logs. Recommended for development and local testing.
                    </p>
                  </div>

                  <div
                    onClick={() => setProvider('meta_whatsapp')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      provider === 'meta_whatsapp'
                        ? 'border-[#1E90FF] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Meta WhatsApp</span>
                      <Radio className={`w-3.5 h-3.5 ${provider === 'meta_whatsapp' ? 'text-[#1E90FF]' : 'text-slate-300'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Direct WhatsApp Cloud API integration using Graph API v19.0.
                    </p>
                  </div>

                  <div
                    onClick={() => setProvider('twilio')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      provider === 'twilio'
                        ? 'border-[#1E90FF] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Twilio SMS / WA</span>
                      <Radio className={`w-3.5 h-3.5 ${provider === 'twilio' ? 'text-[#1E90FF]' : 'text-slate-300'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Standard Twilio REST API integration for global SMS and WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Provider Specific Credentials */}
              {provider === 'meta_whatsapp' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800">Meta WhatsApp Cloud API Credentials</h4>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 104829104928"
                      value={metaPhoneId}
                      onChange={e => setMetaPhoneId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">Permanent Access Token</label>
                    <input
                      type="password"
                      placeholder="EAAG...."
                      value={metaToken}
                      onChange={e => setMetaToken(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {provider === 'twilio' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800">Twilio API Credentials</h4>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">Account SID</label>
                    <input
                      type="text"
                      placeholder="AC...."
                      value={twilioSid}
                      onChange={e => setTwilioSid(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">Auth Token</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={twilioAuth}
                      onChange={e => setTwilioAuth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">From Number</label>
                    <input
                      type="text"
                      placeholder="+14155238886"
                      value={twilioFrom}
                      onChange={e => setTwilioFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-md flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Notification Settings</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Notification Audit Logs */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification Dispatch History</h3>
                <span className="text-[11px] text-slate-400">Latest message audits</span>
              </div>
              <button
                type="button"
                onClick={refreshLogs}
                disabled={loadingLogs}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1E90FF]">{log.appointment_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {log.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>To: <strong className="font-mono">{log.recipient_number}</strong> ({log.recipient_type})</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200/70 line-clamp-3 whitespace-pre-wrap font-sans">
                      {log.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No notifications recorded yet. Book an appointment to trigger notification logs.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
