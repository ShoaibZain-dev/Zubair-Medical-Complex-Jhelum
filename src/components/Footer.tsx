'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Calendar, Search, ShieldCheck, HeartPulse, FlaskConical, ExternalLink } from 'lucide-react';
import SocialSection from './SocialSection';
import LocationSection from './LocationSection';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 no-print">
      {/* Location Section */}
      <LocationSection />

      {/* Social Media Section */}
      <SocialSection />

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Hospital Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-white shrink-0">
                <img
                  src="/logo.png"
                  alt="Zubair Medical Complex Jhelum"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="block font-bold text-white text-base leading-tight">
                  {t('hospital_name')}
                </span>
                <span className="text-xs text-[#00BFFF] font-semibold tracking-wider uppercase">
                  {t('hospital_address')}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#FFD700] font-semibold italic">
              "{t('hospital_tagline')}"
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('hospital_desc')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1E90FF]"></span>
              {t('quick_navigation')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-150">
                  {t('nav_home')}
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-150">
                  {t('nav_doctors')}
                </Link>
              </li>
              <li>
                <Link href="/appointments/book" className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-150">
                  {t('btn_book_appointment')}
                </Link>
              </li>
              <li>
                <Link href="/appointments/status" className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-150">
                  {t('nav_check_status')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-150">
                  {t('nav_about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-150">
                  {t('nav_contact')}
                </Link>
              </li>
              <li>
                <a
                  href="http://labwithali.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FFD700] text-emerald-400 transition-colors hover:translate-x-1 inline-flex items-center gap-1.5 duration-150 font-medium"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-[#FFD700]" />
                  Partner Lab: Lab With Ali
                </a>
              </li>
            </ul>
          </div>

          {/* Official Appointment Contacts */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>
              {t('official_contacts')}
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              {t('contacts_desc')}
            </p>
            <div className="space-y-3">
              {/* Main Hospital Contact */}
              <a
                href="tel:+923156621341"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-[#1E90FF] hover:bg-slate-800 transition-all text-white group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1E90FF]/20 text-[#1E90FF] flex items-center justify-center group-hover:bg-[#1E90FF] group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Hospital Main Contact</div>
                  <div className="text-sm font-bold font-mono text-white">+92 315 6621341</div>
                </div>
              </a>

              {/* Official WhatsApp */}
              <a
                href="https://wa.me/923156621341"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-[#25D366] hover:bg-slate-800 transition-all text-white group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Official WhatsApp</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">+92 315 6621341</div>
                </div>
              </a>

              {/* Doctors' Consultation Phone Lines */}
              <a
                href="tel:03183621341"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-[#1E90FF] hover:bg-slate-800 transition-all text-white group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1E90FF]/20 text-[#1E90FF] flex items-center justify-center group-hover:bg-[#1E90FF] group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Doctors Desk (Zubair/Fozia/Umar)</div>
                  <div className="text-sm font-bold font-mono">0318-3621341</div>
                </div>
              </a>

              <a
                href="tel:03003918459"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-[#FFD700] hover:bg-slate-800 transition-all text-white group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center group-hover:bg-[#FFD700] group-hover:text-slate-900 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Doctor Desk (Dr. Arshad)</div>
                  <div className="text-sm font-bold font-mono">0300-3918459</div>
                </div>
              </a>
            </div>
          </div>

          {/* Staff & Security & Diagnostic Partner */}
          <div className="space-y-6">
            <div>
              <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {t('clinical_access')}
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                {t('clinical_access_desc')}
              </p>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#1E90FF]" />
                {t('btn_staff_login')}
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>
                {t('diagnostic_partner')}
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                {t('diagnostic_desc')}
              </p>
              <a
                href="http://labwithali.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#FFD700] hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-[#FFD700]/30 hover:border-[#FFD700] transition-all shadow-xs group"
              >
                <FlaskConical className="w-4 h-4 text-[#FFD700]" />
                <span>Lab With Ali</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white ml-auto" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{t('copyright')}</p>
          <p className="text-slate-400">
            {t('footer_subtext')}
          </p>
        </div>
      </div>
    </footer>
  );
}
