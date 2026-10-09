'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Calendar, Clock, Menu, X, Shield, Activity, Search } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Doctors', href: '/doctors' },
    { name: 'Appointments', href: '/appointments/book' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Check Appointment', href: '/appointments/status' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      {/* Top emergency and clinic announcement bar */}
      <div className="bg-gradient-to-r from-[#1E90FF] to-[#0857AC] text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-4 h-4 text-[#FFD700]" />
              Zubair Medical Complex Jhelum
            </span>
            <span className="hidden md:inline text-blue-200">|</span>
            <span className="flex items-center gap-1.5 text-blue-100">
              <Phone className="w-3.5 h-3.5 text-[#FFD700]" />
              Hospital: <a href="tel:+923156621341" className="hover:text-white font-semibold underline decoration-dotted">+92 315 6621341</a>
              <span className="text-blue-300">|</span>
              Doctors: <a href="tel:03183621341" className="hover:text-white font-semibold underline decoration-dotted">0318-3621341</a>
            </span>
            <span className="hidden md:inline text-blue-200">|</span>
            <a
              href="https://wa.me/923156621341"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-300 hover:text-white font-semibold transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              WhatsApp: +92 315 6621341
            </a>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/appointments/status"
              className="flex items-center gap-1 text-blue-100 hover:text-white transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#FFD700]" />
              Check Status
            </Link>
            <span className="text-blue-300">|</span>
            <Link
              href="/admin/login"
              className="flex items-center gap-1 text-blue-200 hover:text-white transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Hospital Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 border-2 border-white bg-white shrink-0">
              <img
                src="/logo.png"
                alt="Zubair Medical Complex Jhelum"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="block font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-none group-hover:text-[#1E90FF] transition-colors">
                Zubair Medical Complex
              </span>
              <span className="text-xs font-semibold text-[#4682B4] tracking-wider uppercase block mt-0.5">
                Kala Gujran, Jhelum, Punjab, Pakistan
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
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

          {/* Prominent CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/appointments/book"
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] via-[#FFDF33] to-[#FFD700] hover:brightness-105 shadow-md shadow-amber-400/25 hover:shadow-lg hover:shadow-amber-400/35 transition-all duration-200 active:scale-95 border border-amber-300"
            >
              <Calendar className="w-4 h-4 text-slate-900" />
              <span>Book Appointment</span>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/appointments/book"
              className="sm:hidden px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-[#FFD700] shadow-sm"
            >
              Book Now
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
                key={link.name}
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
                Book Appointment
              </Link>
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Staff Portal Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
