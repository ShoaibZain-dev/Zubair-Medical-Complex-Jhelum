'use client';

import React from 'react';
import Link from 'next/link';
import { Doctor, DoctorSchedule } from '../types';
import { Calendar, Clock, Phone, Award, ArrowRight, UserCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getDoctorDisplayName, getDoctorDisplaySpecialty, formatDoctorScheduleSummary } from '@/lib/doctorUtils';

interface DoctorCardProps {
  doctor: Doctor;
  schedules?: DoctorSchedule[];
}

export default function DoctorCard({ doctor, schedules }: DoctorCardProps) {
  const { t, isUrdu } = useLanguage();
  const [localSchedules, setLocalSchedules] = React.useState<DoctorSchedule[]>(schedules || []);

  React.useEffect(() => {
    if (schedules) {
      setLocalSchedules(schedules);
      return;
    }
    // Fetch live schedules if not passed by parent
    fetch(`/api/schedules?doctorId=${doctor.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLocalSchedules(data);
        }
      })
      .catch(() => {});
  }, [doctor.id, schedules]);

  const displayName = getDoctorDisplayName(doctor, isUrdu, t);
  const displaySpecialty = getDoctorDisplaySpecialty(doctor, isUrdu, t);
  const scheduleInfo = formatDoctorScheduleSummary(localSchedules, isUrdu);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top decorative gradient line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1E90FF] via-[#00BFFF] to-[#FFD700]" />

      <div className="p-6">
        {/* Header with avatar / badge */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 border border-blue-200 overflow-hidden flex items-center justify-center text-[#1E90FF] font-black text-xl shadow-inner group-hover:scale-105 transition-transform shrink-0">
              {doctor.avatar_url ? (
                <img 
                  src={doctor.avatar_url} 
                  alt={doctor.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <UserCheck className="w-7 h-7 text-[#1E90FF]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#1E90FF] border border-blue-100">
                  {displaySpecialty}
                </span>
                {scheduleInfo.hasShifts && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {scheduleInfo.badge}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1E90FF] transition-colors leading-snug">
                {displayName}
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
