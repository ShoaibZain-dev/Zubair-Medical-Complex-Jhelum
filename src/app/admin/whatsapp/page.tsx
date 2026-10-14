'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import { 
  Smartphone, CheckCircle2, AlertCircle, RefreshCw, 
  Send, LogOut, ShieldCheck, Zap, MessageSquare, Clock 
} from 'lucide-react';

export default function AdminWhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [gatewayRunning, setGatewayRunning] = useState(true);

  // Test send states
  const [testTo, setTestTo] = useState('03229131403');
  const [testMessage, setTestMessage] = useState('Assalam-o-Alaikum! Testing automatic WhatsApp notifications from Zubair Medical Complex Jhelum.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-gateway', { cache: 'no-store' });
      if (!res.ok) {
        setGatewayRunning(false);
        return;
      }
      const data = await res.json();
      setGatewayRunning(data.gatewayRunning !== false);
      setConnected(Boolean(data.connected));
      setUserPhone(data.user || null);
      setQrCode(data.qr || null);
    } catch {
      setGatewayRunning(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTo.trim() || !testMessage.trim()) return;

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/whatsapp-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo, message: testMessage })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: `Message successfully sent to ${testTo}!` });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send message.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error.' });
    } finally {
      setSendingTest(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp account?')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/admin/whatsapp-gateway', { method: 'DELETE' });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar userRole="Admin" userName="Administrator" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Free & Automatic • No Meta Cloud API Required</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              WhatsApp Web Gateway
            </h1>
            <p className="text-sm text-slate-500">
              Link hospital or reception WhatsApp account via QR Code to send auto-notifications directly to patients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
              connected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
              {connected ? 'Connected' : 'QR Scan Required'}
            </span>

            <button
              onClick={() => { setLoading(true); fetchStatus(); }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: QR Code / Connection Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#1E90FF]" />
                <span>Device Pairing Status</span>
              </h2>

              {connected ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-emerald-900">WhatsApp is Connected!</h3>
                      <p className="text-xs text-emerald-700 mt-1">
                        Linked Account: <strong className="font-mono text-emerald-950 font-bold">+{userPhone || 'Hospital WhatsApp'}</strong>
                      </p>
                    </div>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed pt-2">
                      All new appointments (Pending) and confirmed appointments will now automatically send direct WhatsApp messages to the patient&apos;s phone.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">Want to use another phone?</span>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{disconnecting ? 'Disconnecting...' : 'Disconnect Account'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                    <p className="font-bold text-slate-900">📱 How to connect your WhatsApp:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 leading-relaxed">
                      <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                      <li>Tap <strong>Settings</strong> (iOS) or <strong>Three Dots ⋮</strong> (Android).</li>
                      <li>Select <strong>Linked Devices</strong> &gt; tap <strong>Link a Device</strong>.</li>
                      <li>Scan the QR code shown below with your phone camera.</li>
                    </ol>
                  </div>

                  {/* QR Box */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    {qrCode ? (
                      <div className="space-y-3 text-center">
                        <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                          <img
                            src={qrCode}
                            alt="WhatsApp Web QR Code"
                            className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                          />
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1E90FF]" />
                          <span>Waiting for scan... (Updates automatically)</span>
                        </p>
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-3">
                        <div className="w-10 h-10 border-3 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-600">
                          {gatewayRunning ? 'Generating fresh WhatsApp QR Code...' : 'Starting WhatsApp Gateway Service...'}
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Please ensure the WhatsApp Gateway script is running in the background.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Testing & Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Message Tester */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1E90FF]" />
                <span>Test Live Message Delivery</span>
              </h2>

              <p className="text-xs text-slate-500">
                Send a real test WhatsApp message to your own phone number right now to verify that delivery works.
              </p>

              <form onSubmit={handleSendTest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={testTo}
                    onChange={e => setTestTo(e.target.value)}
                    placeholder="e.g. 03229131403"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-[#1E90FF] bg-slate-50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Message Content</label>
                  <textarea
                    rows={3}
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#1E90FF] bg-slate-50"
                    required
                  />
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {testResult.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingTest || !connected}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    connected
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {sendingTest
                      ? 'Sending WhatsApp...'
                      : connected
                      ? 'Send Test WhatsApp to My Mobile'
                      : 'Connect WhatsApp First'}
                  </span>
                </button>
              </form>
            </div>

            {/* How it works info */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#1E90FF]" />
                <span>100% Free &amp; Private</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                This feature uses WhatsApp Multi-Device session technology. Your messages are sent directly from your connected WhatsApp account without any third-party API middleman, fees, or Meta Cloud API registration.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
