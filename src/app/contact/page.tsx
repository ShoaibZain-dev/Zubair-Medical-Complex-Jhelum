import React from 'react';
import Link from 'next/link';
import { Phone, Calendar, Clock, Activity, MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Contact | Zubair Medical Complex Jhelum',
  description: 'Official contact and appointment numbers for Zubair Medical Complex Jhelum.',
};

export default function ContactPage() {
  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-bold uppercase tracking-wider border border-blue-200">
          <Phone className="w-3.5 h-3.5" />
          Direct Appointment Contact
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Zubair Medical Complex
        </h1>
        <p className="text-sm font-semibold text-[#1E90FF]">
          Kala Gujran, Jhelum, Punjab, Pakistan
        </p>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
          For outpatient appointment scheduling, doctor availability inquiries, and confirmation status, please reach out to our official desk lines below.
        </p>
      </div>

      {/* Main Hospital Contact Card */}
      <div className="bg-gradient-to-br from-blue-50/70 via-white to-emerald-50/40 rounded-3xl border-2 border-[#1E90FF]/30 p-7 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
          <div>
            <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider block mb-1">
              Official Hospital Desk
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              +92 315 6621341
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Main reception and appointment coordination line for Zubair Medical Complex (Kala Gujran, Jhelum, Punjab, Pakistan).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            <a
              href="tel:+923156621341"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1E90FF] hover:bg-[#0B72DF] transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Hospital Contact</span>
            </a>

            <a
              href="https://wa.me/923156621341"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] transition-colors shadow-xs"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>

      {/* Verified Doctors' Contact Lines Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
          Doctor Consultation & Specialist Lines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doctor Line 1 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-sm space-y-4 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider block mb-1">
                Doctors' Consultation Desk
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                0318-3621341
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct consultation line for Dr. Syed Zubair Younis, Dr. Fozia Choudhary, and Dr. Umar Farooq.
            </p>
            <div className="pt-2">
              <a
                href="tel:03183621341"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1E90FF] hover:bg-[#0B72DF] transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Doctors Line</span>
              </a>
            </div>
          </div>

          {/* Doctor Line 2 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-sm space-y-4 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Specialist Doctor Line
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                0300-3918459
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct consultation line for Dr. Muhammad Arshad (Rheumatologist - Saturday clinics).
            </p>
            <div className="pt-2">
              <a
                href="tel:03003918459"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Specialist Line</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Online Services Navigation */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold">Prefer Online Appointment Booking?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            Select your doctor, pick your preferred date and time slot, and submit patient details in under two minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/appointments/book"
            className="text-center px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-[#FFD700] hover:brightness-105 shadow-sm"
          >
            Book Appointment
          </Link>
          <Link
            href="/appointments/status"
            className="text-center px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Check Status
          </Link>
        </div>
      </div>
    </div>
  );
}
