'use client';

import React from 'react';
import Link from 'next/link';
import { Doctor } from '../types';
import { Calendar, Clock, Phone, Award, ArrowRight, UserCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const { t, isUrdu } = useLanguage();

  // Extract schedule highlights based on exact doctor
  const getScheduleHighlights = (docId: string) => {
    switch (docId) {
      case 'doc-zubair':
        return {
          name: isUrdu ? t('doc_zubair_name') : 'Dr. Syed Zubair Younis',
          specialty: isUrdu ? t('doc_zubair_specialty') : 'Medical Specialist',
          days: isUrdu ? t('days_mon_sat') : 'Monday – Saturday (Sunday Off)',
          timing: isUrdu ? t('timing_zubair') : 'Morning: 9:00 AM – 2:00 PM | Evening: 5:00 PM – 8:00 PM',
          badge: isUrdu ? t('badge_dual_shift') : 'Dual Shift'
        };
      case 'doc-fozia':
        return {
          name: isUrdu ? t('doc_fozia_name') : 'Dr. Fozia Choudhary',
          specialty: isUrdu ? t('doc_fozia_specialty') : 'Gynecologist / Consultant',
          days: isUrdu ? t('days_mon_sat') : 'Monday – Saturday (Sunday Off)',
          timing: isUrdu ? t('timing_fozia') : 'Morning: 9:00 AM – 2:00 PM',
          badge: isUrdu ? t('badge_morning_consultant') : 'Morning Consultant'
        };
      case 'doc-arshad':
        return {
          name: isUrdu ? t('doc_arshad_name') : 'Dr. Muhammad Arshad',
          specialty: isUrdu ? t('doc_arshad_specialty') : 'Rheumatologist',
          days: isUrdu ? t('days_sat_only') : 'Every Saturday Only',
          timing: isUrdu ? t('timing_arshad') : 'Saturday: 9:00 AM – 3:00 PM',
          badge: isUrdu ? t('badge_saturday_specialist') : 'Saturday Specialist'
        };
      case 'doc-umar':
        return {
          name: isUrdu ? t('doc_umar_name') : 'Dr. Umar Farooq',
          specialty: isUrdu ? t('doc_umar_specialty') : 'Laparoscopic Surgeon',
          days: isUrdu ? t('days_mon_sat') : 'Monday – Saturday (Sunday Off)',
          timing: isUrdu ? t('timing_umar') : 'Evening: 5:00 PM – 8:00 PM',
          badge: isUrdu ? t('badge_evening_consultant') : 'Evening Consultant'
        };
      default:
        return {
          name: doctor.name,
          specialty: doctor.specialty,
          days: isUrdu ? t('days_mon_sat') : 'Consultation Schedule',
          timing: isUrdu ? 'تفصیلات کے لیے کلینک سے رابطہ کریں' : 'Contact clinic for details',
          badge: isUrdu ? t('badge_consultant') : 'Consultant'
        };
    }
  };

  const scheduleInfo = getScheduleHighlights(doctor.id);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top decorative gradient line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1E90FF] via-[#00BFFF] to-[#FFD700]" />

      <div className="p-6">
        {/* Header with avatar / badge */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 border border-blue-200 flex items-center justify-center text-[#1E90FF] font-black text-xl shadow-inner group-hover:scale-105 transition-transform shrink-0">
              <UserCheck className="w-7 h-7 text-[#1E90FF]" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#1E90FF] border border-blue-100 mb-1">
                {scheduleInfo.specialty}
              </span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1E90FF] transition-colors leading-snug">
                {scheduleInfo.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Qualification if available */}
        {doctor.qualification ? (
          <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
            <Award className="w-4 h-4 text-[#1E90FF] shrink-0" />
            <span>{t('label_qualification')} <span className="technical-value font-medium">{doctor.qualification}</span></span>
          </div>
        ) : (
          <div className="mb-4 h-7"></div>
        )}

        {/* Schedule & Timing Info */}
        <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-2.5 text-slate-600">
            <Calendar className="w-4 h-4 text-[#1E90FF] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">{t('label_available_days')}</span>
              <span className="text-slate-600 font-medium leading-relaxed">{scheduleInfo.days}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-600">
            <Clock className="w-4 h-4 text-[#4682B4] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">{t('label_consultation_timing')}</span>
              <span className="text-slate-600 font-medium leading-relaxed">{scheduleInfo.timing}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600 pt-1">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-800">{t('label_appointment_contact')}</span>
              <a
                href={`tel:${doctor.contact.replace(/[^0-9]/g, '')}`}
                className="font-mono font-bold text-slate-900 hover:text-[#1E90FF] underline decoration-dotted phone-number"
              >
                {doctor.contact}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
        <Link
          href={`/doctors/${doctor.id}`}
          className="flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1 shadow-xs"
        >
          <span>{t('btn_view_profile')}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
        </Link>

        <Link
          href={`/appointments/book?doctor=${doctor.id}`}
          className="flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 transition-all shadow-xs flex items-center justify-center gap-1"
        >
          <span>{t('btn_book_doctor')}</span>
        </Link>
      </div>
    </div>
  );
}
