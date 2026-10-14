'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Calendar, Menu, X, Shield, Activity, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage, t, isUrdu } = useLanguage();

  const navLinks = [
    { name: t('nav_home'), href: '/' },
    { name: t('nav_doctors'), href: '/doctors' },
    { name: t('nav_appointments'), href: '/appointments/book' },
    { name: t('nav_about'), href: '/about' },
    { name: t('nav_contact'), href: '/contact' },
    { name: t('nav_check_status'), href: '/appointments/status' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      {/* Top emergency and clinic announcement bar */}
      <div className="bg-gradient-to-r from-[#1E90FF] to-[#0857AC] text-white text-xs py-1.5 sm:py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: hospital info – hidden on xs, visible sm+ */}
          <div className="hidden sm:flex items-center gap-3 flex-wrap flex-1 min-w-0">
            <span className="flex items-center gap-1.5 font-medium shrink-0">
              <Activity className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="hidden md:inline">{t('hospital_name')}</span>
            </span>
            <span className="hidden md:inline text-blue-200">|</span>
            <span className="flex items-center gap-1.5 text-blue-100 text-[11px]">
              <Phone className="w-3 h-3 text-[#FFD700] shrink-0" />
              <a href="tel:+923156621341" className="hover:text-white font-semibold underline decoration-dotted whitespace-nowrap">+92 315 6621341</a>
              <span className="text-blue-300">|</span>
              <a href="tel:03183621341" className="hover:text-white font-semibold underline decoration-dotted whitespace-nowrap">0318-3621341</a>
            </span>
            <span className="hidden lg:inline text-blue-200">|</span>
            <a
              href="https://wa.me/923156621341"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-emerald-300 hover:text-white font-semibold transition-colors text-[11px]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {t('label_whatsapp')}: +92 315 6621341
            </a>
          </div>

          {/* Mobile left: hospital name only */}
          <div className="flex sm:hidden items-center gap-1.5 font-medium text-[11px] min-w-0">
            <Activity className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
            <span className="truncate">{t('hospital_name')}</span>
          </div>

          {/* Right: language switcher + utility links */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] shrink-0">
            {/* Language Switcher in top bar – canonical, single toggle */}
            <div className="inline-flex items-center bg-white/15 rounded-full p-0.5 border border-white/25">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-full font-bold transition-all text-[11px] ${
                  language === 'en'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-white hover:text-amber-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`px-2 py-0.5 rounded-full font-bold transition-all text-[11px] ${
                  language === 'ur'
                    ? 'bg-[#FFD700] text-slate-950 shadow-xs'
                    : 'text-white hover:text-amber-200'
                }`}
                title="اردو میں تبدیل کریں"
              >
                اردو
              </button>
            </div>

            <span className="hidden sm:inline text-blue-300">|</span>

            <Link
              href="/appointments/status"
              className="hidden sm:flex items-center gap-1 text-blue-100 hover:text-white transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#FFD700]" />
              {t('btn_check_status')}
            </Link>
            <span className="hidden sm:inline text-blue-300">|</span>
            <Link
              href="/admin/login"
              className="hidden sm:flex items-center gap-1 text-blue-200 hover:text-white transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              {t('btn_staff_login')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo & Hospital Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-1 lg:flex-none">
            <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 border-2 border-white bg-white shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/logo.png"
                alt="Zubair Medical Complex Jhelum"
                className="w-full h-full object-contain object-center"
              />
            </div>
            <div className="min-w-0 flex-1 lg:flex-none flex flex-col justify-center">
              <span className="block font-extrabold text-[13px] xs:text-sm sm:text-base md:text-lg lg:text-xl text-slate-900 tracking-tight leading-tight group-hover:text-[#1E90FF] transition-colors truncate">
                {t('hospital_name')}
              </span>
              <span className="block text-[8.5px] xs:text-[9.5px] sm:text-[11px] lg:text-xs font-semibold text-[#4682B4] tracking-normal sm:tracking-wider uppercase mt-0.5 leading-tight truncate">
                {t('hospital_address')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive(link.href)
                    ? 'text-[#1E90FF] bg-blue-50/80 shadow-xs'
                    : 'text-slate-600 hover:text-[#1E90FF] hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA - Book Appointment only (language toggle is in top bar) */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/appointments/book"
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] via-[#FFDF33] to-[#FFD700] hover:brightness-105 shadow-md shadow-amber-400/25 hover:shadow-lg hover:shadow-amber-400/35 transition-all duration-200 active:scale-95 border border-amber-300"
            >
              <Calendar className="w-4 h-4 text-slate-900" />
              <span>{t('btn_book_appointment')}</span>
            </Link>
          </div>

          {/* Tablet CTA (sm-lg) */}
          <div className="hidden sm:flex lg:hidden items-center gap-2">
            <Link
              href="/appointments/book"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-slate-950 bg-[#FFD700] shadow-sm border border-amber-300"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-900" />
              <span>{t('btn_book_appointment')}</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile hamburger button (< sm) */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <Link
              href="/appointments/book"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-[#FFD700] shadow-sm whitespace-nowrap"
            >
              {language === 'en' ? 'Book' : 'بک'}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive(link.href)
                    ? 'text-[#1E90FF] bg-blue-50 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/appointments/book"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl font-bold text-slate-950 bg-[#FFD700] shadow-sm"
              >
                {t('btn_book_appointment')}
              </Link>
              <div className="flex items-center justify-between px-2 pt-2">
                <span className="text-xs text-slate-500 font-medium">زبان / Language</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded-md ${language === 'en' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('ur')}
                    className={`px-3 py-1 rounded-md ${language === 'ur' ? 'bg-[#FFD700] shadow-xs text-slate-950' : 'text-slate-600'}`}
                  >
                    اردو
                  </button>
                </div>
              </div>
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                {t('btn_staff_login')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
