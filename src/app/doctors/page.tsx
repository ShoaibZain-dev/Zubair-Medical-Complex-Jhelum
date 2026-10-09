import React from 'react';
import { storage } from '@/lib/storage';
import DoctorCard from '@/components/DoctorCard';
import { Stethoscope, Calendar, Phone, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Specialist Doctors | Zubair Medical Complex Jhelum',
  description: 'View consulting specialists at Zubair Medical Complex Jhelum including Medical Specialist, Gynecologist, Rheumatologist, and Laparoscopic Surgeon.',
};

export default function DoctorsPage() {
  const doctors = storage.getDoctors();

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-bold uppercase tracking-wider border border-blue-200">
          <Stethoscope className="w-3.5 h-3.5" />
          Qualified Medical Faculty
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Consultant Doctors & Specialists
        </h1>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
          Zubair Medical Complex Jhelum provides specialist consultations with scheduled clinic timings. Select a doctor to review their full weekly timetable or book an appointment.
        </p>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {doctors.map(doctor => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>

      {/* Appointment Information Banner */}
      <div className="p-8 rounded-3xl bg-blue-50/70 border border-blue-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-lg font-bold text-slate-900">
            Need assistance choosing a specialist?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            You can call our reception desk directly for appointment queries and schedule assistance during clinic hours.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-800 pt-1">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#1E90FF]" />
              0318-3621341
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#1E90FF]" />
              0300-3918459
            </span>
          </div>
        </div>

        <Link
          href="/appointments/book"
          className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 transition-all shadow-md shrink-0"
        >
          Book An Appointment Now
        </Link>
      </div>
    </div>
  );
}
