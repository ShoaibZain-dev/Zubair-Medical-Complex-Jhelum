'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import { 
  Smartphone, CheckCircle2, AlertCircle, RefreshCw, 
  Send, LogOut, ShieldCheck, Zap, MessageSquare, Clock,
  Globe, Server, Play, ExternalLink, Settings2, Check
} from 'lucide-react';

export default function AdminWhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [gatewayRunning, setGatewayRunning] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:5005');
  const [customGatewayUrl, setCustomGatewayUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSavedSuccess, setUrlSavedSuccess] = useState(false);
  const [isLiveProd, setIsLiveProd] = useState(false);

  // Test send states
  const [testTo, setTestTo] = useState('03229131403');
  const [testMessage, setTestMessage] = useState('Assalam-o-Alaikum! Testing automatic WhatsApp notifications from Zubair Medical Complex Jhelum.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [startingGateway, setStartingGateway] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-gateway', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      
      const running = Boolean(data.gatewayRunning);
      setGatewayRunning(running);
      setConnected(Boolean(data.connected));
      setUserPhone(data.user || null);
      setQrCode(data.qr || null);
      if (data.gatewayUrl) {
        setGatewayUrl(data.gatewayUrl);
        if (!customGatewayUrl) setCustomGatewayUrl(data.gatewayUrl);
      }
      setIsLiveProd(Boolean(data.isLiveProduction));
    } catch {
      setGatewayRunning(false);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartGateway = async () => {
    setStartingGateway(true);
    try {
      await fetch('/api/admin/whatsapp-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      setTimeout(() => {
        fetchStatus();
        setStartingGateway(false);
      }, 3000);
    } catch {
      setStartingGateway(false);
    }
  };

  const handleSaveGatewayUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGatewayUrl.trim()) return;

    setSavingUrl(true);
    setUrlSavedSuccess(false);
    try {
      const res = await fetch('/api/admin/whatsapp-gateway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayUrl: customGatewayUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setGatewayUrl(data.gatewayUrl);
        setUrlSavedSuccess(true);
        setTimeout(() => setUrlSavedSuccess(false), 3000);
        await fetchStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUrl(false);
    }
  };

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
    if (!confirm('Are you sure you want to disconnect this WhatsApp account? A new QR code will be generated.')) return;
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

  // Direct WhatsApp Web click helper for staff
  const getDirectWaLink = (to: string, msg: string) => {
    let clean = to.replace(/\D/g, '');
    if (clean.startsWith('0') && clean.length === 11) clean = '92' + clean.slice(1);
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar userRole="Admin" userName="Administrator" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Free & Automatic • Direct WhatsApp Connection</span>
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
                : gatewayRunning
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-600 animate-pulse' : gatewayRunning ? 'bg-amber-600' : 'bg-rose-600'}`} />
              {connected ? 'Connected' : gatewayRunning ? 'Scan QR Code' : 'Gateway Offline'}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#1E90FF]" />
                  <span>Device Pairing Status</span>
                </h2>
                <span className="text-[11px] font-mono text-slate-400">
                  {gatewayRunning ? 'Service Active' : 'Waiting for connection'}
                </span>
              </div>

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
                      All new appointments and confirmation updates will now automatically send WhatsApp notifications to patients without any manual effort.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">Want to pair a different mobile phone?</span>
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
                    <p className="font-bold text-slate-900">📱 How to pair your WhatsApp:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 leading-relaxed">
                      <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                      <li>Tap <strong>Settings</strong> (iPhone) or <strong>Three Dots ⋮</strong> (Android).</li>
                      <li>Select <strong>Linked Devices</strong> &gt; tap <strong>Link a Device</strong>.</li>
                      <li>Scan the QR code shown below with your phone camera.</li>
                    </ol>
                  </div>

                  {/* QR Box */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[300px]">
                    {qrCode ? (
                      <div className="space-y-4 text-center">
                        <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                          <img
                            src={qrCode}
                            alt="WhatsApp Web QR Code"
                            className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                          />
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1E90FF]" />
                          <span>Waiting for phone scan... (Auto-refreshes)</span>
                        </p>
                      </div>
                    ) : gatewayRunning ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-10 h-10 border-3 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-700">
                          Generating fresh WhatsApp QR Code...
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Please wait a few seconds while the WhatsApp session establishes.
                        </p>
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-4 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">WhatsApp Gateway is Offline</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            The background WhatsApp Web service at <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">{gatewayUrl}</code> is not reachable.
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-2">
                          <p className="font-semibold text-slate-800">To start on your machine:</p>
                          <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px]">
                            npm run whatsapp
                          </code>
                          <p className="text-[11px] text-slate-500">
                            Or click below to try launching automatically:
                          </p>
                          <button
                            type="button"
                            onClick={handleStartGateway}
                            disabled={startingGateway}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-[#1E90FF] hover:bg-blue-600 text-white transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{startingGateway ? 'Starting Gateway...' : 'Start Local Gateway Now'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gateway Server Config (Crucial for Live Website) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#1E90FF]" />
                  <span>Gateway Connection Endpoint</span>
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-600">
                  {isLiveProd ? 'Cloud / Live Mode' : 'Local / Dev Mode'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                If your website is deployed live on Vercel, connect it to your WhatsApp Gateway running on your computer (via ngrok / Cloudflare Tunnel) or hosted VPS server.
              </p>

              <form onSubmit={handleSaveGatewayUrl} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customGatewayUrl}
                    onChange={e => setCustomGatewayUrl(e.target.value)}
                    placeholder="e.g. http://localhost:5005 or https://your-tunnel.ngrok-free.app"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-[#1E90FF] bg-slate-50"
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingUrl}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shrink-0"
                  >
                    {savingUrl ? 'Saving...' : 'Save URL'}
                  </button>
                </div>

                {urlSavedSuccess && (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Gateway URL updated successfully! Checking connection...</span>
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Right Column: Live Testing & Direct Send */}
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

                <div className="space-y-2">
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
                        : 'Connect WhatsApp First to Send'}
                    </span>
                  </button>

                  {/* Quick fallback button: Open in WhatsApp Web / App directly */}
                  <a
                    href={getDirectWaLink(testTo, testMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Or Open in WhatsApp App / Web (Manual)</span>
                  </a>
                </div>
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
