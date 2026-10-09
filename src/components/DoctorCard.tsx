import React from 'react';
import Link from 'next/link';
import { Doctor } from '../types';
import { Calendar, Clock, Phone, Award, ArrowRight, UserCheck } from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  // Extract schedule highlights based on exact doctor
  const getScheduleHighlights = (docId: string) => {
    switch (docId) {
      case 'doc-zubair':
        return {
          days: 'Monday – Saturday (Sunday Off)',
          timing: 'Morning: 9:00 AM – 2:00 PM | Evening: 5:00 PM – 8:00 PM',
          badge: 'Dual Shift'
        };
      case 'doc-fozia':
        return {
          days: 'Monday – Saturday (Sunday Off)',
          timing: 'Morning: 9:00 AM – 2:00 PM',
          badge: 'Morning Consultant'
        };
      case 'doc-arshad':
        return {
          days: 'Every Saturday Only',
          timing: 'Saturday: 9:00 AM – 3:00 PM',
          badge: 'Saturday Specialist'
        };
      case 'doc-umar':
        return {
          days: 'Monday – Saturday (Sunday Off)',
          timing: 'Evening: 5:00 PM – 8:00 PM',
          badge: 'Evening Consultant'
        };
      default:
        return {
          days: 'Consultation Schedule',
          timing: 'Contact clinic for details',
          badge: 'Consultant'
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 border border-blue-200 flex items-center justify-center text-[#1E90FF] font-black text-xl shadow-inner group-hover:scale-105 transition-transform">
              <UserCheck className="w-7 h-7 text-[#1E90FF]" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#1E90FF] border border-blue-100 mb-1">
                {doctor.specialty}
              </span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1E90FF] transition-colors leading-tight">
                {doctor.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Qualification if available */}
        {doctor.qualification ? (
          <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
            <Award className="w-4 h-4 text-[#1E90FF] shrink-0" />
            <span>Qualification: {doctor.qualification}</span>
          </div>
        ) : (
          <div className="mb-4 h-7"></div>
        )}

        {/* Schedule & Timing Info */}
        <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-2.5 text-slate-600">
            <Calendar className="w-4 h-4 text-[#1E90FF] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Available Days:</span>
              <span className="text-slate-600 font-medium">{scheduleInfo.days}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-600">
            <Clock className="w-4 h-4 text-[#4682B4] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Consultation Timing:</span>
              <span className="text-slate-600 font-medium">{scheduleInfo.timing}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600 pt-1">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800">Appointment Contact:</span>
              <a
                href={`tel:${doctor.contact.replace(/[^0-9]/g, '')}`}
                className="font-mono font-bold text-slate-900 hover:text-[#1E90FF] underline decoration-dotted"
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
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href={`/appointments/book?doctor=${doctor.id}`}
          className="flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 transition-all shadow-xs flex items-center justify-center gap-1"
        >
          <span>Book Appointment</span>
        </Link>
      </div>
    </div>
  );
}
