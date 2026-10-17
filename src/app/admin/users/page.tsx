'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { UserRole, isSuperAdmin } from '@/types';
import { 
  Users, UserPlus, Trash2, ShieldCheck, Mail, Lock, 
  User, CheckCircle2, AlertCircle, Loader2, Edit2, Key,
  HelpCircle, Shield, Award, Check, X, Info
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<StaffUser[]>([]);

  // Create user form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Staff');
  const [editActive, setEditActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Ownership Handover Guide Modal
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/admin/login');
        } else if (!isSuperAdmin(data.user.role)) {
          // Only Super Admin can manage staff/admin accounts
          router.push('/admin/dashboard');
        } else {
          setCurrentUser(data.user);
          loadUsers();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (Array.isArray(d)) setUsers(d);
      })
      .catch(() => setLoading(false));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(data.error || 'Failed to create user account.');
        return;
      }

      setSuccess(`Account for ${data.name} (${data.role}) created successfully!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('Staff');
      loadUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setSubmitting(false);
      setError('Connection error occurred.');
    }
  };

  const openEditModal = (u: StaffUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditActive(u.active);
    setEditNewPassword('');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          email: editEmail,
          role: editRole,
          active: editActive,
          password: editNewPassword || undefined
        })
      });

      const data = await res.json();
      setSavingEdit(false);

      if (!res.ok) {
        setEditError(data.error || 'Failed to update user.');
        return;
      }

      setEditingUser(null);
      setSuccess(`Account for ${data.name} updated successfully.`);
      loadUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setSavingEdit(false);
      setEditError('Network error while updating user.');
    }
  };

  const handleToggleUserActive = async (u: StaffUser) => {
    const newActive = !u.active;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, active: newActive })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to toggle account status.');
        return;
      }
      loadUsers();
    } catch {
      alert('Network error.');
    }
  };

  const handleDeleteUser = async (u: StaffUser) => {
    if (!confirm(`Are you sure you want to permanently remove the account for ${u.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) {
        setSuccess(`User ${u.name} removed successfully.`);
        setTimeout(() => setSuccess(null), 3000);
        loadUsers();
      } else {
        alert(d.error || 'Failed to delete user.');
      }
    } catch {
      alert('Network error.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
      </div>
    );
  }

  const superAdminCount = users.filter(u => u.active && (u.role === 'Super Admin' || u.role === 'Admin')).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNavbar userRole={currentUser?.role} userName={currentUser?.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Staff & Administrator Accounts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage hospital owner privileges, admin roles, and reception staff credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowHandoverModal(true)}
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#1E90FF] text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-colors shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#1E90FF]" />
            <span>Hospital Ownership Handover Guide</span>
          </button>
        </div>

        {/* Global Success / Alert Banner */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create User Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#1E90FF]" />
              Add Authorized Account
            </h2>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. New Owner or Fatima Reception"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="admin@zubairmedical.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Initial Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Encrypted using PBKDF2/SHA-512 with individual salt. Plaintext is never stored.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Assigned System Role *</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="Staff">Staff (Appointments, Patient Desk, WhatsApp Web)</option>
                  <option value="Hospital Admin">Hospital Admin (Doctors, Schedules, Photos, Operations)</option>
                  <option value="Super Admin">Super Admin / Owner (Full System & User Control)</option>
                </select>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  {role === 'Super Admin' && (
                    <span className="text-amber-800 font-medium block">
                      ★ <strong>Super Admin:</strong> Can manage doctors, schedules, system settings, and add/edit other administrator accounts.
                    </span>
                  )}
                  {role === 'Hospital Admin' && (
                    <span className="text-emerald-800 font-medium block">
                      ★ <strong>Hospital Admin:</strong> Can manage doctors, schedules, and photos, but cannot manage user accounts or alter ownership.
                    </span>
                  )}
                  {role === 'Staff' && (
                    <span className="text-blue-800 font-medium block">
                      ★ <strong>Staff:</strong> Can view & confirm appointments and use WhatsApp Web, but cannot edit doctors or system settings.
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Create Authorized Account</span>
              </button>
            </form>
          </div>

          {/* User List Table */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital User Accounts</h2>
                <p className="text-xs text-slate-400">
                  {users.length} registered account(s) • {superAdminCount} active Super Admin(s)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const isSelf = u.id === currentUser?.userId;
                    const isSuper = u.role === 'Super Admin' || u.role === 'Admin';
                    const isSoleSuper = isSuper && u.active && superAdminCount <= 1;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-slate-500 text-[11px]">{u.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isSuper
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : u.role === 'Hospital Admin'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            disabled={isSoleSuper}
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              isSoleSuper
                                ? 'bg-emerald-100 text-emerald-800 opacity-80 cursor-not-allowed'
                                : u.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer'
                            }`}
                            title={isSoleSuper ? 'Cannot deactivate the sole active Super Admin' : 'Toggle active status'}
                          >
                            {u.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#1E90FF] hover:bg-blue-50 cursor-pointer"
                              title="Edit user details / Reset password"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isSelf && !isSoleSuper ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                title="Remove User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic px-1">Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EDIT USER MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#1E90FF]" />
                Edit Account: {editingUser.name}
              </h2>
              <button 
                type="button" 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="Staff">Staff (Reception / Appointments)</option>
                  <option value="Hospital Admin">Hospital Admin (Doctors & Schedules)</option>
                  <option value="Super Admin">Super Admin / Owner (Full Control)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Reset Password (leave empty to keep current password)
                </label>
                <input
                  type="password"
                  minLength={8}
                  placeholder="Enter new password (min 8 chars)"
                  value={editNewPassword}
                  onChange={e => setEditNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-user-active"
                  checked={editActive}
                  onChange={e => setEditActive(e.target.checked)}
                  className="rounded text-[#1E90FF] w-4 h-4"
                />
                <label htmlFor="edit-user-active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Account is Active
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFDF33] border border-amber-300 text-slate-950 text-xs font-bold hover:brightness-105 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Account Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* HOSPITAL OWNERSHIP HANDOVER GUIDE MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-[#1E90FF]" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">Hospital Ownership Handover Guide</h2>
                  <p className="text-xs text-slate-500">Step-by-step instructions for transferring this portal</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHandoverModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1.5">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-700" />
                  Phase 1: In-App Administrative Handover (Zero Code Required)
                </span>
                <p>
                  To hand over portal control to a new hospital owner without touching code:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 pt-1 font-medium">
                  <li>In this <strong>Staff Users</strong> tab, fill out the form with the new owner&apos;s name, email, and strong password.</li>
                  <li>Set their System Role to <strong>Super Admin / Owner</strong> and click <strong>Create Authorized Account</strong>.</li>
                  <li>Have the new owner log into the Admin Portal at <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300">/admin/login</code> to verify full access to doctors, schedules, and staff.</li>
                  <li>Once verified, the new owner can log in and click <strong>Remove</strong> or <strong>Inactive</strong> on the previous owner account. The system prevents removing the last Super Admin so you can never be locked out!</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5">
                <span className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
                  <Info className="w-4 h-4 text-[#1E90FF]" />
                  Phase 2: External Project & Cloud Infrastructure Transfer
                </span>
                <p>
                  When selling the entire software system or handing over complete infrastructure ownership:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 pt-1">
                  <li><strong>Supabase Organization Transfer:</strong> In your Supabase Dashboard (<code className="font-mono">supabase.com</code>), go to <em>Project Settings → General → Transfer Project</em> and invite the new owner&apos;s Supabase account.</li>
                  <li><strong>Vercel Deployment Transfer:</strong> In Vercel, go to <em>Project Settings → Transfer Project</em> to transfer deployment and custom domains to the new hospital&apos;s Vercel team.</li>
                  <li><strong>Domain DNS:</strong> Update the hospital&apos;s DNS records (A/CNAME records) to point to the new owner&apos;s Vercel deployment.</li>
                  <li><strong>WhatsApp / Email Notification Credentials:</strong> In portal Settings / Vercel Environment Variables, update Meta WhatsApp Cloud API credentials or Twilio / Resend keys to the new hospital&apos;s registered business accounts.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
