'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, Lock, Mail, User, AlertCircle, CheckCircle2, 
  ArrowRight, KeyRound, Sparkles, Loader2, RefreshCw, X, Phone
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot / Reset Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSecurityCode, setResetSecurityCode] = useState('0318-3621341');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [sentResetLink, setSentResetLink] = useState<string | null>(null);
  const [registeredAccounts, setRegisteredAccounts] = useState<{ email: string; role: string; name: string }[]>([]);

  // Initial Admin Setup State
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);

  useEffect(() => {
    // Check if initial admin account is required or if already logged in
    fetch('/api/admin/setup')
      .then(res => res.json())
      .then(data => {
        setNeedsSetup(data.needsSetup);
        setCheckingSetup(false);
      })
      .catch(() => setCheckingSetup(false));

    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/admin/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  // Load registered emails when opening the forgot modal
  const openForgotModal = () => {
    setForgotModalOpen(true);
    setResetError(null);
    setResetSuccess(null);
    setSentResetLink(null);
    fetch('/api/admin/reset-password')
      .then(res => res.json())
      .then(data => {
        if (data.registeredEmails && Array.isArray(data.registeredEmails)) {
          setRegisteredAccounts(data.registeredEmails);
          if (data.registeredEmails.length > 0 && !resetEmail) {
            setResetEmail(data.registeredEmails[0].email);
          }
        }
      })
      .catch(() => {});
  };

  const handleSendResetLink = async () => {
    if (!resetEmail || !resetEmail.trim()) {
      setResetError('Please enter a registered email address first.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);
    setSentResetLink(null);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_reset_link',
          email: resetEmail
        })
      });
      const data = await res.json();
      setResetLoading(false);

      if (!res.ok) {
        setResetError(data.error || 'Failed to send reset link.');
        return;
      }

      setResetSuccess(data.message || 'Password reset link delivered to simulated email inbox!');
      if (data.resetLink) {
        setSentResetLink(data.resetLink);
      }
    } catch {
      setResetLoading(false);
      setResetError('Connection error.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Connection error.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (resetPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    if (resetPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          newPassword: resetPassword,
          securityCode: resetSecurityCode
        })
      });

      const data = await res.json();
      setResetLoading(false);

      if (!res.ok) {
        setResetError(data.error || 'Failed to update password.');
        return;
      }

      setResetSuccess(data.message || 'Password reset successfully! Redirecting...');
      setEmail(resetEmail);
      setPassword(resetPassword);

      // Auto redirect to dashboard after 1.5 seconds since cookie session is established
      setTimeout(() => {
        setForgotModalOpen(false);
        router.push('/admin/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setResetLoading(false);
      setResetError(err.message || 'Connection error.');
    }
  };

  const handleQuickDefaultReset = async () => {
    if (!confirm('This will refresh the primary administrator password to "Admin@12345". Proceed?')) {
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_reset_default',
          newPassword: 'Admin@12345'
        })
      });

      const data = await res.json();
      setResetLoading(false);

      if (!res.ok) {
        setResetError(data.error || 'Failed to refresh password.');
        return;
      }

      setResetSuccess('Admin password refreshed to: Admin@12345. Credentials auto-filled!');
      if (data.email) {
        setEmail(data.email);
        setResetEmail(data.email);
      }
      setPassword('Admin@12345');
      setResetPassword('Admin@12345');
      setResetConfirmPassword('Admin@12345');

      setTimeout(() => {
        setForgotModalOpen(false);
      }, 2000);
    } catch {
      setResetLoading(false);
      setResetError('Connection error.');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: setupName,
          email: setupEmail,
          password: setupPassword
        })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to initialize administrator account.');
        return;
      }

      setSetupSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Setup error.');
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Hospital Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl shadow-blue-500/10 mx-auto border-2 border-slate-200 bg-white">
            <img src="/logo.png" alt="Zubair Medical Complex Jhelum" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {needsSetup ? 'Initial Admin Setup' : 'Staff & Admin Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Zubair Medical Complex • Kala Gujran, Jhelum, Punjab, Pakistan
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* INITIAL SETUP WIZARD (When no admin exists yet) */}
        {needsSetup ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Secure First-Time Administrator Initialization
              </div>
              <p>
                No administrator account exists yet. Create your master admin account to secure access to Zubair Medical Complex Jhelum.
              </p>
            </div>

            {setupSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-slate-900">Administrator Account Initialized</h3>
                <p className="text-xs text-slate-500">Redirecting to Dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Administrator Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master Administrator"
                      value={setupName}
                      onChange={e => setSetupName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="admin@zubairmedical.com"
                      value={setupEmail}
                      onChange={e => setSetupEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Secure Password (Min 8 Characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••••••"
                      value={setupPassword}
                      onChange={e => setSetupPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Initialize Administrator</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD ADMIN LOGIN FORM */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="staff@zubairmedical.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-xs font-bold text-[#1E90FF] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Login to Portal</span>
                </button>

                <button
                  type="button"
                  onClick={openForgotModal}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Forgot / Reset Password (پاسورڈ ریفریش)</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Return to Public site link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-[#1E90FF] font-semibold transition-colors"
          >
            ← Back to Public Website
          </Link>
        </div>
      </div>

      {/* FULLY FUNCTIONAL FORGOT / RESET PASSWORD MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E90FF] flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reset Portal Password</h3>
                <p className="text-xs text-slate-500">
                  اپنا نیا پاسورڈ یہاں سیٹ کریں یا ریفریش کریں
                </p>
              </div>
            </div>

            {resetError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{resetSuccess}</span>
              </div>
            )}

            {/* Registered accounts quick selector */}
            {registeredAccounts.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Registered Accounts ({registeredAccounts.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {registeredAccounts.map(acc => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => setResetEmail(acc.email)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        resetEmail === acc.email
                          ? 'bg-[#1E90FF] text-white border-[#1E90FF] font-bold shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {acc.name} ({acc.role}) - {acc.email}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. malikshoaibzain029@gmail.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                  />
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSendResetLink}
                    disabled={resetLoading}
                    className="w-full py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Reset Link to Email (Simulated Inbox)</span>
                  </button>
                </div>
                {sentResetLink && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Simulated Email Delivered!</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Password reset link generated for <strong>{resetEmail}</strong>:
                    </p>
                    <a
                      href={sentResetLink}
                      className="inline-block font-mono text-[11px] text-blue-700 underline break-all bg-white p-1.5 rounded-lg border border-amber-200 hover:bg-blue-50"
                    >
                      {sentResetLink}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Clinic Verification Code / Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="0318-3621341"
                    value={resetSecurityCode}
                    onChange={e => setResetSecurityCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Security Code: Clinic contact <strong className="text-slate-700">0318-3621341</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Min 6 chars"
                      value={resetPassword}
                      onChange={e => setResetPassword(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Re-enter password"
                      value={resetConfirmPassword}
                      onChange={e => setResetConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#1E90FF] hover:bg-blue-600 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save New Password & Login</span>
                </button>

                <div className="relative py-1 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase">or emergency</span>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDefaultReset}
                  disabled={resetLoading}
                  className="w-full py-2 rounded-xl font-bold text-xs text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Quick Refresh Admin Password to "Admin@12345"</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
