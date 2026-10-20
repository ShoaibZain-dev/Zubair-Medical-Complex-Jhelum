'use client';

import React from 'react';
import Link from 'next/link';
import { Doctor, DoctorSchedule } from '@/types';
import DoctorCard from '@/components/DoctorCard';
import { 
  Calendar, Clock, Phone, Stethoscope, Users, CheckCircle2, 
  ArrowRight, ShieldCheck, HeartHandshake, UserPlus, Search, 
  Sparkles, FileText, Activity
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getDoctorDisplayName, getDoctorDisplaySpecialty, formatDoctorScheduleSummary } from '@/lib/doctorUtils';

interface HomeClientViewProps {
  doctors: Doctor[];
  schedules?: DoctorSchedule[];
}

export default function HomeClientView({ doctors, schedules = [] }: HomeClientViewProps) {
  const { t, isUrdu } = useLanguage();
  const [doctorList, setDoctorList] = React.useState<Doctor[]>(doctors);
  const [scheduleList, setScheduleList] = React.useState<DoctorSchedule[]>(schedules);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/doctors').then(r => r.json()),
      fetch('/api/schedules').then(r => r.json())
    ]).then(([docs, schs]) => {
      if (Array.isArray(docs)) setDoctorList(docs);
      if (Array.isArray(schs)) setScheduleList(schs);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-12 sm:pt-20 pb-20 border-b border-slate-200/60">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left rtl:lg:text-right">

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.25]">
                <span className="block text-slate-900">{t('hospital_name')}</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] via-[#00BFFF] to-[#0857AC]">
                  {t('hospital_city')}
                </span>
              </h1>

              <div className="space-y-1.5">
                <p className="text-lg sm:text-xl text-slate-800 font-bold leading-relaxed">
                  {isUrdu ? 'پیشہ ورانہ صحت کی دیکھ بھال اور ماہرانہ مشاورت' : 'Professional Healthcare and Specialist Consultation'}
                </p>
                <p className="text-sm font-semibold text-[#1E90FF] italic">
                  "{t('hospital_tagline')}"
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                {t('hero_desc')}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start rtl:lg:justify-start gap-3.5">
                <Link
                  href="/appointments/book"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-slate-950 bg-gradient-to-r from-[#FFD700] via-[#FFDF33] to-[#FFD700] hover:brightness-105 shadow-lg shadow-amber-400/25 active:scale-95 transition-all border border-amber-300"
                >
                  <Calendar className="w-5 h-5 text-slate-900" />
                  <span>{t('btn_book_appointment')}</span>
                </Link>

                <Link
                  href="/doctors"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-slate-700 bg-white hover:bg-slate-50 hover:text-[#1E90FF] shadow-sm hover:shadow transition-all border border-slate-200"
                >
                  <Stethoscope className="w-5 h-5 text-[#1E90FF]" />
                  <span>{t('btn_view_doctors')}</span>
                </Link>
              </div>

              {/* Contact line banner */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start rtl:lg:justify-start gap-4 text-xs font-semibold text-slate-500">
                <a
                  href="tel:+923156621341"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-[#1E90FF] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#1E90FF]" />
                  <span>{t('label_hospital')}: </span>
                  <strong className="text-slate-900 font-mono phone-number">+92 315 6621341</strong>
                </a>
                <span className="text-slate-300">|</span>
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span>{t('label_doctor_desks')}: </span>
                  <strong className="text-slate-900 font-mono phone-number">0318-3621341</strong>
                  <span> / </span>
                  <strong className="text-slate-900 font-mono phone-number">0300-3918459</strong>
                </span>
                <span className="text-slate-300">|</span>
                <a
                  href="https://wa.me/923156621341"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{t('label_whatsapp')}: </span>
                  <strong className="font-mono text-emerald-800 phone-number">+92 315 6621341</strong>
                </a>
              </div>
            </div>

            {/* Right Healthcare Visual / Quick Status Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1E90FF] flex items-center justify-center font-bold">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          {isUrdu ? 'مشاورت کے اوقات' : 'Consultation Timetable'}
                        </h2>
                        <span className="text-xs text-slate-500">
                          {isUrdu ? 'پیر تا ہفتہ (اتوار چھٹی)' : 'Monday to Saturday'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {isUrdu ? 'او پی ڈی جاری' : 'Open Today'}
                    </span>
                  </div>

                  {/* Doctor quick roster snapshot */}
                  <div className="space-y-3 text-xs">
                    {doctorList.slice(0, 4).map(doc => {
                      const dName = getDoctorDisplayName(doc, isUrdu, t);
                      const dSpec = getDoctorDisplaySpecialty(doc, isUrdu, t);
                      const dSummary = formatDoctorScheduleSummary(
                        scheduleList.filter(s => s.doctor_id === doc.id),
                        isUrdu
                      );

                      return (
                        <div key={doc.id} className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-900 truncate">
                              {dName}
                            </span>
                            <span className="text-[10px] font-bold text-[#1E90FF] bg-blue-100/60 px-1.5 py-0.5 rounded shrink-0">
                              {dSpec}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {dSummary.days}: {dSummary.timing}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href="/appointments/book"
                    className="w-full py-3 rounded-xl text-center text-xs font-bold text-white bg-[#1E90FF] hover:bg-[#0B72DF] transition-colors block shadow-md shadow-blue-500/20"
                  >
                    {isUrdu ? 'ڈاکٹر منتخب کریں اور وقت حاصل کریں ←' : 'Select Doctor & Reserve Time Slot →'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 CORE INFORMATION CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Specialist Doctors */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('feature_specialists_title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('feature_specialists_desc')}
            </p>
          </div>

          {/* Card 2: Appointment Booking */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('feature_easy_booking_title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('feature_easy_booking_desc')}
            </p>
          </div>

          {/* Card 3: Professional Healthcare */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#00BFFF] flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('feature_prof_doctors_title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('feature_prof_doctors_desc')}
            </p>
          </div>

          {/* Card 4: Patient Support */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('feature_patient_support_title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('feature_patient_support_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED SPECIALISTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E90FF] block mb-1">
              {isUrdu ? 'طبی معالجین کی فہرست' : 'Medical Directory'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {t('section_consultant_specialists')}
            </h2>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E90FF] hover:underline"
          >
            <span>{isUrdu ? 'تمام ڈاکٹرز دیکھیں' : 'View All Schedules'}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctorList.map(doctor => (
            <DoctorCard 
              key={doctor.id} 
              doctor={doctor} 
              schedules={scheduleList.filter(s => s.doctor_id === doctor.id)}
            />
          ))}
        </div>
      </section>

      {/* HOW TO BOOK AN APPOINTMENT (4 STEPS) */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E90FF] block mb-1">
              {isUrdu ? 'آسان طریقہ کار' : 'Simple Workflow'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {t('section_how_to_book')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              {t('section_how_to_book_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
              <div className="text-3xl font-black text-blue-100 absolute top-4 right-4 rtl:left-4 rtl:right-auto">01</div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                {t('step_1_title')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('step_1_desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
              <div className="text-3xl font-black text-blue-100 absolute top-4 right-4 rtl:left-4 rtl:right-auto">02</div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                {t('step_2_title')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('step_2_desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
              <div className="text-3xl font-black text-blue-100 absolute top-4 right-4 rtl:left-4 rtl:right-auto">03</div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                {t('step_3_title')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('step_3_desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
              <div className="text-3xl font-black text-blue-100 absolute top-4 right-4 rtl:left-4 rtl:right-auto">04</div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-sm mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                {t('step_4_title')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('step_4_desc')}
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/appointments/book"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 shadow-md shadow-amber-400/20 border border-amber-300"
            >
              <span>{t('btn_start_booking_now')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK STATUS LOOKUP BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left rtl:md:text-right">
            <span className="text-xs font-bold text-[#FFD700] uppercase tracking-wider block">
              {isUrdu ? 'کیا آپ کی اپوائنٹمنٹ پہلے سے درج ہے؟' : 'Already have an appointment?'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {t('section_track_status_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('section_track_status_desc')}
            </p>
          </div>

          <Link
            href="/appointments/status"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 transition-colors shadow-md shrink-0"
          >
            <Search className="w-4 h-4 text-[#1E90FF]" />
            <span>{t('btn_check_status_now')}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
