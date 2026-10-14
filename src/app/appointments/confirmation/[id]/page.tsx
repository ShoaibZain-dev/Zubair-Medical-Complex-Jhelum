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
import WhatsAppNotificationCard from '@/components/WhatsAppNotificationCard';
import { useLanguage } from '@/context/LanguageContext';

export default function AppointmentConfirmationPage() {
  const params = useParams();
  const appointmentId = params?.id as string;
  const { t, isUrdu } = useLanguage();

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
Hospital Appointment Desk: 0318-3621341 / 0300-3918459 / +92 315 6621341
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
        <p className="text-sm font-semibold text-slate-600">
          {isUrdu ? 'اپوائنٹمنٹ ریکارڈ لوڈ ہو رہا ہے...' : 'Retrieving appointment record...'}
        </p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">
          {isUrdu ? 'اپوائنٹمنٹ ریکارڈ نہیں ملا' : 'Appointment Not Found'}
        </h2>
        <p className="text-sm text-slate-500">
          {isUrdu
            ? 'ہمیں مطلوبہ اپوائنٹمنٹ کا ریکارڈ نہیں ملا۔ برائے مہربانی آئی ڈی چیک کریں یا استقبالیہ سے رابطہ کریں۔'
            : 'We could not locate the requested appointment record. Please verify the ID or contact clinic reception.'}
        </p>
        <Link
          href="/appointments/book"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#1E90FF] text-white text-xs font-bold"
        >
          {isUrdu ? 'نئی اپوائنٹمنٹ بک کریں' : 'Book New Appointment'}
        </Link>
      </div>
    );
  }

  // Doctor Urdu name helper
  const getDoctorDisplayName = (docId?: string, fallback?: string) => {
    if (!isUrdu) return fallback || doctor?.name || 'Medical Consultant';
    switch (docId || doctor?.id) {
      case 'doc-zubair': return t('doc_zubair_name');
      case 'doc-fozia': return t('doc_fozia_name');
      case 'doc-arshad': return t('doc_arshad_name');
      case 'doc-umar': return t('doc_umar_name');
      default: return fallback || doctor?.name || 'کنسلٹنٹ ڈاکٹر';
    }
  };

  const getSpecialtyDisplayName = (docId?: string, fallback?: string) => {
    if (!isUrdu) return fallback || appointment.specialty;
    switch (docId || doctor?.id) {
      case 'doc-zubair': return t('doc_zubair_specialty');
      case 'doc-fozia': return t('doc_fozia_specialty');
      case 'doc-arshad': return t('doc_arshad_specialty');
      case 'doc-umar': return t('doc_umar_specialty');
      default: return fallback || appointment.specialty;
    }
  };

  return (
    <div className="py-12 sm:py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3 no-print">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('confirmation_heading')}
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {t('confirmation_subtext')}
        </p>
      </div>

      {/* WHATSAPP NOTIFICATION CARD (Feature Matching Reference Style) */}
      <div className="no-print">
        <WhatsAppNotificationCard
          appointment={appointment}
          doctor={doctor}
          hospitalContact="+92 315 6621341"
        />
      </div>

      {/* Appointment Confirmation Slip / Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print-slip">
        {/* Top brand header */}
        <div className="bg-gradient-to-r from-[#1E90FF] to-[#0857AC] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-white shrink-0 p-1 shadow flex items-center justify-center">
              <img src="/logo.png" alt="ZMC Logo" className="w-full h-full object-contain object-center" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#FFD700] tracking-wider uppercase block">
                {t('slip_official_title')}
              </span>
              <h2 className="text-lg sm:text-xl font-bold">
                {t('hospital_full_name')}
              </h2>
              <span className="text-[11px] text-blue-200 block">
                {t('hospital_address')}
              </span>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-[11px] text-blue-200 uppercase block font-semibold">
              {t('slip_appointment_id')}
            </span>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-[#FFD700] technical-value">
                {appointment.appointment_id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                aria-label="Copy Appointment ID"
                className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition-colors no-print cursor-pointer"
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
                {t('slip_patient_name')}
              </span>
              <div className="text-base font-bold text-slate-900">
                {appointment.patient_name}
              </div>
              <div className="text-xs text-slate-500">
                {isUrdu ? `عمر: ${appointment.age} • جنس: ${appointment.gender === 'Male' ? 'مرد' : appointment.gender === 'Female' ? 'خاتون' : 'دیگر'}` : `Age: ${appointment.age} • Gender: ${appointment.gender}`}
              </div>
            </div>

            {/* Appointment Status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1E90FF]" />
                {t('slip_status')}
              </span>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  appointment.status === 'Confirmed' || appointment.status === 'Booked'
                    ? 'bg-emerald-100 text-emerald-800'
                    : appointment.status === 'Cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {isUrdu 
                    ? (appointment.status === 'Confirmed' || appointment.status === 'Booked' ? t('status_confirmed') : appointment.status === 'Cancelled' ? t('status_cancelled') : t('status_pending'))
                    : appointment.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {isUrdu ? 'ڈیفالٹ: استقبالیہ کی طرف سے جائزہ جاری ہے' : 'Default: Pending approval by reception'}
              </div>
            </div>

            {/* Doctor */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#1E90FF]" />
                {t('slip_doctor')}
              </span>
              <div className="text-base font-bold text-slate-900">
                {getDoctorDisplayName(appointment.doctor_id, doctor?.name)}
              </div>
              <div className="text-xs font-semibold text-[#1E90FF]">
                {getSpecialtyDisplayName(appointment.doctor_id, appointment.specialty)}
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1E90FF]" />
                {t('slip_datetime')}
              </span>
              <div className="text-base font-bold text-slate-900 technical-value">
                {appointment.appointment_date}
              </div>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 technical-value">
                <Clock className="w-3.5 h-3.5" />
                <span>{appointment.appointment_time}</span>
              </div>
            </div>

            {/* Patient Contact Numbers */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1E90FF]" />
                {t('slip_contact_info')}
              </span>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-800 font-medium">
                <div>
                  {isUrdu ? 'فون: ' : 'Phone: '}
                  <strong className="font-mono phone-number">{appointment.phone}</strong>
                </div>
                {(appointment.whatsapp && appointment.whatsapp !== appointment.phone) && (
                  <div>
                    {isUrdu ? 'واٹس ایپ: ' : 'WhatsApp: '}
                    <strong className="font-mono text-emerald-700 phone-number">{appointment.whatsapp}</strong>
                  </div>
                )}
                {appointment.email && (
                  <div>
                    {isUrdu ? 'ای میل: ' : 'Email: '}
                    <strong className="text-slate-600 technical-value">{appointment.email}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hospital Notes / Advisory */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{t('slip_instructions_title')}</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
              <li>{t('slip_instruction_1')}</li>
              <li>{t('slip_instruction_2')}</li>
              <li>{t('slip_instruction_3')}</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Button 1: Print Appointment */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{t('btn_print_appointment')}</span>
            </button>

            {/* Button 2: Save Appointment Details */}
            <button
              type="button"
              onClick={handleSaveDetails}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{t('btn_save_details')}</span>
            </button>
          </div>

          {/* Button 3: Check Appointment Status */}
          <Link
            href={`/appointments/status?id=${appointment.appointment_id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-slate-950" />
            <span>{t('btn_check_appointment_status')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
