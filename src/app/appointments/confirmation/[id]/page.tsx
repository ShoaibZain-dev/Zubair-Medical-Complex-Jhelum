'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Appointment, Doctor } from '@/types';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Printer, Download, Search, Phone, Calendar, 
  Clock, User, Stethoscope, Copy, Check, FileText, Activity, AlertCircle 
} from 'lucide-react';

export default function AppointmentConfirmationPage() {
  const params = useParams();
  const appointmentId = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetch(`/api/appointments/${appointmentId}`)
        .then(res => res.json())
        .then(data => {
          setLoading(false);
          if (data.appointment) {
            setAppointment(data.appointment);
            setDoctor(data.doctor);

            // Trigger celebration confetti
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch {}
          }
        })
        .catch(() => setLoading(false));
    }
  }, [appointmentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveDetails = () => {
    if (!appointment) return;
    const details = `ZUBAIR MEDICAL COMPLEX JHELUM
APPOINTMENT CONFIRMATION SLIP
========================================
Appointment ID: ${appointment.appointment_id}
Patient Name:   ${appointment.patient_name}
Doctor:         ${doctor?.name || 'Consultant'}
Specialty:      ${appointment.specialty}
Date:           ${appointment.appointment_date}
Time:           ${appointment.appointment_time}
Patient Contact:${appointment.phone}
Status:         ${appointment.status}
========================================
Hospital Appointment Desk: 0318-3621341 / 0300-3918459
Please arrive 10-15 minutes prior to your consultation time.`;

    const blob = new Blob([details], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZMC_Appointment_${appointment.appointment_id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyId = () => {
    if (!appointment) return;
    navigator.clipboard.writeText(appointment.appointment_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Retrieving appointment record...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Appointment Not Found</h2>
        <p className="text-sm text-slate-500">
          We could not locate the requested appointment record. Please verify the ID or contact clinic reception.
        </p>
        <Link
          href="/appointments/book"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#1E90FF] text-white text-xs font-bold"
        >
          Book New Appointment
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3 no-print">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Appointment Submitted Successfully
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your appointment request has been recorded. Our reception will review and confirm your slot. An automatic notification has been queued.
        </p>
      </div>

      {/* Appointment Confirmation Slip / Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print-slip">
        {/* Top brand header */}
        <div className="bg-gradient-to-r from-[#1E90FF] to-[#0857AC] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-white shrink-0 p-0.5 shadow">
              <img src="/logo.png" alt="ZMC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#FFD700] tracking-wider uppercase block">
                Official Appointment Slip
              </span>
              <h2 className="text-lg sm:text-xl font-bold">
                Zubair Medical Complex Jhelum
              </h2>
              <span className="text-[11px] text-blue-200 block">
                Kala Gujran, Jhelum, Punjab, Pakistan
              </span>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-[11px] text-blue-200 uppercase block font-semibold">Appointment ID</span>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-[#FFD700]">
                {appointment.appointment_id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                aria-label="Copy Appointment ID"
                className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition-colors no-print"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="p-6 sm:p-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            {/* Patient Name */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#1E90FF]" />
                Patient Name
              </span>
              <div className="text-base font-bold text-slate-900">
                {appointment.patient_name}
              </div>
              <div className="text-xs text-slate-500">
                Age: {appointment.age} • Gender: {appointment.gender}
              </div>
            </div>

            {/* Appointment Status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1E90FF]" />
                Appointment Status
              </span>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  appointment.status === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : appointment.status === 'Cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {appointment.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Default: Pending approval by reception
              </div>
            </div>

            {/* Doctor */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#1E90FF]" />
                Consultant Doctor
              </span>
              <div className="text-base font-bold text-slate-900">
                {doctor?.name || 'Medical Consultant'}
              </div>
              <div className="text-xs font-semibold text-[#1E90FF]">
                {appointment.specialty}
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1E90FF]" />
                Appointment Date & Time
              </span>
              <div className="text-base font-bold text-slate-900">
                {appointment.appointment_date}
              </div>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {appointment.appointment_time}
              </div>
            </div>

            {/* Patient Contact Numbers */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1E90FF]" />
                Contact Information
              </span>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-800 font-medium">
                <div>Phone: <strong className="font-mono">{appointment.phone}</strong></div>
                <div>WhatsApp: <strong className="font-mono text-emerald-700">{appointment.whatsapp}</strong></div>
                <div>Email: <strong className="text-slate-600">{appointment.email}</strong></div>
              </div>
            </div>
          </div>

          {/* Hospital Notes / Advisory */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Clinic Instructions:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
              <li>Please arrive 10-15 minutes prior to your allocated time slot.</li>
              <li>Bring your previous medical prescriptions or diagnostic reports if applicable.</li>
              <li>For inquiries or rescheduling, contact hospital reception: <strong>+92 315 6621341</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons (3 required buttons) */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Button 1: Print Appointment */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Appointment</span>
            </button>

            {/* Button 2: Save Appointment Details */}
            <button
              type="button"
              onClick={handleSaveDetails}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Save Details</span>
            </button>
          </div>

          {/* Button 3: Check Appointment Status */}
          <Link
            href={`/appointments/status?id=${appointment.appointment_id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-slate-950" />
            <span>Check Appointment Status</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
