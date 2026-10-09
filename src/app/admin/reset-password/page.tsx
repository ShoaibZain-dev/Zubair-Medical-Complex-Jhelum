'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  KeyRound, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck 
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [targetEmail, setTargetEmail] = useState(emailParam);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setTokenError('Missing reset token. Please request a new password reset link.');
      return;
    }

    fetch(`/api/admin/reset-password?token=${token}`)
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.valid) {
          setValidToken(true);
          if (data.email) setTargetEmail(data.email);
        } else {
          setTokenError(data.error || 'This reset link is invalid or has expired.');
        }
      })
      .catch(() => {
        setLoading(false);
        setTokenError('Failed to verify reset token.');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setFormError(data.error || 'Failed to update password.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/login');
      }, 2500);
    } catch {
      setSubmitting(false);
      setFormError('Connection error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl shadow-blue-500/10 mx-auto border-2 border-slate-200 bg-white">
            <img src="/logo.png" alt="Zubair Medical Complex Jhelum" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Zubair Medical Complex • Staff & Admin Security
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6">
          {tokenError ? (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Reset Link Expired or Invalid</h3>
                <p className="text-xs text-slate-500">{tokenError}</p>
              </div>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Return to Login & Request New Link
              </Link>
            </div>
          ) : success ? (
            <div className="py-6 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Password Updated Successfully!</h3>
                <p className="text-xs text-slate-500">
                  Your new password is now active. Redirecting you to login...
                </p>
              </div>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-[#1E90FF] text-white text-xs font-bold hover:bg-blue-600 shadow-md transition-all gap-1.5"
              >
                <span>Login Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {targetEmail && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60 text-xs text-blue-900">
                  Resetting password for: <strong className="font-bold">{targetEmail}</strong>
                </div>
              )}

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  New Password (Minimum 6 Characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Set New Password & Proceed</span>
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/admin/login"
            className="text-xs text-slate-500 hover:text-[#1E90FF] font-semibold transition-colors"
          >
            ← Back to Login Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
