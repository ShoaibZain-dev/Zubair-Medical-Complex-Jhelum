'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, Bell, 
  Share2, LogOut, ShieldCheck, Settings, ExternalLink 
} from 'lucide-react';

interface Props {
  userRole?: 'Admin' | 'Receptionist';
  userName?: string;
}

export default function AdminNavbar({ userRole = 'Receptionist', userName = 'Staff Member' }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Receptionist'] },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar, roles: ['Admin', 'Receptionist'] },
    { name: 'Doctors & Schedules', href: '/admin/doctors', icon: Stethoscope, roles: ['Admin'] },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell, roles: ['Admin'] },
    { name: 'Social Links', href: '/admin/social', icon: Share2, roles: ['Admin'] },
    { name: 'Staff Users', href: '/admin/users', icon: Users, roles: ['Admin'] },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white shrink-0 border border-slate-700">
                <img src="/logo.png" alt="ZMC Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight block leading-tight">
                  Admin Portal
                </span>
                <span className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold">
                  Zubair Medical Complex
                </span>
              </div>
            </Link>

            <span className="text-slate-700 hidden md:inline">|</span>

            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {allowedItems.map(item => {
              const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#1E90FF] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white leading-tight">{userName}</div>
              <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                userRole === 'Admin' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
              }`}>
                {userRole}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subnav for Mobile */}
      <div className="lg:hidden overflow-x-auto border-t border-slate-800 py-2 px-4 flex items-center gap-2">
        {allowedItems.map(item => {
          const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                active
                  ? 'bg-[#1E90FF] text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
