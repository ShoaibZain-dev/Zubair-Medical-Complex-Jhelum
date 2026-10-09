'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { SocialMediaLink } from '@/types';
import { Share2, Save, CheckCircle2, Globe, ExternalLink, Loader2 } from 'lucide-react';

export default function AdminSocialPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [links, setLinks] = useState<SocialMediaLink[]>([]);

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
          loadSocialLinks();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadSocialLinks = () => {
    fetch('/api/social')
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (Array.isArray(d)) setLinks(d);
      })
      .catch(() => setLoading(false));
  };

  const handleUrlChange = (id: string, newUrl: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, url: newUrl } : l));
  };

  const handleToggleActive = (id: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links)
      });

      setSaving(false);
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save social media links.');
      }
    } catch {
      setSaving(false);
      alert('Network error saving links.');
    }
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official Social Media Links
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure official channels for Zubair Medical Complex Jhelum displayed on the public footer.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Social media links updated successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              {links.map(link => (
                <div key={link.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#1E90FF]" />
                      {link.platform} Official URL
                    </span>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={link.active}
                        onChange={() => handleToggleActive(link.id)}
                        className="rounded text-[#1E90FF] focus:ring-blue-400"
                      />
                      <span>Active</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={link.url}
                      onChange={e => handleUrlChange(link.id, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#1E90FF]"
                    />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      title="Test URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-md flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Social Media Links</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
