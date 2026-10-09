import React from 'react';
import Link from 'next/link';
import { Activity, Stethoscope, Award, Users, CheckCircle2, Phone, Calendar } from 'lucide-react';

export const metadata = {
  title: 'About | Zubair Medical Complex Jhelum',
  description: 'Learn about Zubair Medical Complex Jhelum, providing specialist medical consultation and clinical outpatient care.',
};

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-bold uppercase tracking-wider border border-blue-200">
          <Activity className="w-3.5 h-3.5" />
          Clinical Excellence
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About Zubair Medical Complex Jhelum
        </h1>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
          Professional healthcare and specialist consultation dedicated to the healthcare needs of patients in Jhelum.
        </p>
      </div>

      {/* Main Narrative Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm space-y-8">
        <div className="space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Dedicated Specialist Consultation
          </h2>
          <p>
            <strong>Zubair Medical Complex Jhelum</strong> is an outpatient specialist medical center established to connect patients with qualified physicians across key clinical disciplines.
          </p>
          <p>
            Our medical staff comprises experienced consultants in Internal Medicine, Gynecology, Rheumatology, and Laparoscopic Surgery, each providing structured consultation timetables from Monday to Saturday.
          </p>
        </div>

        {/* Clinical Services Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1E90FF] flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Specialist Clinical Care</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consultations for systemic internal diseases, women's health, autoimmune joint conditions, and surgical assessments.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Scheduled Appointments</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dedicated morning and evening consultation schedules with automated slot reservations and patient tracking.
            </p>
          </div>
        </div>

        {/* Consultation Doctors Roster */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            Our Consultant Panel
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <li className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E90FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Dr. Syed Zubair Younis</strong>
                <span className="text-slate-500">MBBS, FCPS • Medical Specialist</span>
              </div>
            </li>

            <li className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E90FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Dr. Fozia Choudhary</strong>
                <span className="text-slate-500">Gynecologist / Consultant</span>
              </div>
            </li>

            <li className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E90FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Dr. Muhammad Arshad</strong>
                <span className="text-slate-500">MBBS, FCPS • Rheumatologist (Saturdays Only)</span>
              </div>
            </li>

            <li className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E90FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Dr. Umar Farooq</strong>
                <span className="text-slate-500">Laparoscopic Surgeon</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Action Link */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Appointment Desk: <strong className="text-slate-800 font-mono">0318-3621341</strong> / <strong className="text-slate-800 font-mono">0300-3918459</strong></span>
          </div>

          <Link
            href="/appointments/book"
            className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-sm"
          >
            Book Consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
