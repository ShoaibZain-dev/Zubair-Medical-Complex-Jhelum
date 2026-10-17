import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { storage } from '@/lib/storage';
import { 
  Calendar, Clock, Phone, Award, CheckCircle2, XCircle, 
  ArrowLeft, CalendarCheck, Share2, ShieldCheck, Stethoscope
} from 'lucide-react';

interface Props {
  params: { id: string };
}

export default function DoctorDetailPage({ params }: Props) {
  const doctor = storage.getDoctorById(params.id);

  if (!doctor) {
    notFound();
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  const doctorSchedules = storage.getSchedules(doctor.id);

  // Compute live availability from database schedules
  const getDayAvailability = (day: string) => {
    const dayShifts = doctorSchedules.filter(
      s => s.active && s.day_of_week.toLowerCase() === day.toLowerCase()
    );

    if (dayShifts.length === 0) {
      return {
        status: day === 'Sunday' ? 'Sunday Off' : 'Off-day',
        available: false,
        timing: 'No Consultations Scheduled',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
      };
    }

    const shiftTimings = dayShifts.map(s => {
      const p = s.period ? `${s.period.charAt(0).toUpperCase() + s.period.slice(1)}: ` : '';
      return `${p}${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`;
    }).join(' | ');

    return {
      status: 'Available',
      available: true,
      timing: shiftTimings,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
  };

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1E90FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Doctors</span>
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Top brand banner */}
        <div className="h-4 w-full bg-gradient-to-r from-[#1E90FF] via-[#00BFFF] to-[#FFD700]" />

        <div className="p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-blue-50 border border-blue-200 overflow-hidden flex items-center justify-center text-[#1E90FF] shadow-inner shrink-0">
                {doctor.avatar_url ? (
                  <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-[#1E90FF]" />
                )}
              </div>

              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100/70 text-[#1E90FF]">
                  {doctor.specialty}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {doctor.name}
                </h1>
                {doctor.qualification && (
                  <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 pt-0.5">
                    <Award className="w-4 h-4 text-[#1E90FF]" />
                    <span>Qualification: <strong>{doctor.qualification}</strong></span>
                  </p>
                )}
                {doctor.social_media && (
                  <p className="text-xs text-slate-500 font-medium">
                    Social Identifier: <span className="font-mono text-slate-700">@{doctor.social_media}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Direct CTA */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Link
                href={`/appointments/book?doctor=${doctor.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 shadow-md shadow-amber-400/25 border border-amber-300 transition-all text-center"
              >
                <CalendarCheck className="w-4 h-4 text-slate-950" />
                <span>Book Appointment</span>
              </Link>

              <a
                href={`tel:${doctor.contact.replace(/[^0-9]/g, '')}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call: {doctor.contact}</span>
              </a>
            </div>
          </div>

          {/* Clean Weekly Schedule Table */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#1E90FF]" />
                  Weekly Consultation Timetable
                </h2>
                <p className="text-xs text-slate-500">
                  Comprehensive availability status for every day of the week.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                Timezone: PKT (Local Jhelum Time)
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Day of Week</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4">Consultation Timings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daysOfWeek.map(day => {
                    const info = getDayAvailability(day);
                    return (
                      <tr key={day} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {day}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${info.badgeColor}`}>
                            {info.available ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {info.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {info.timing}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {doctor.id === 'doc-arshad' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                <strong>Notice:</strong> Dr. Muhammad Arshad holds specialist consultations every Saturday between 9:00 AM and 3:00 PM only. Appointments for Sunday through Friday are unavailable.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
