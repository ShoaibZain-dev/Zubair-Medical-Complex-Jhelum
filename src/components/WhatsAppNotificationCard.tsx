'use client';

import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Info, Smartphone } from 'lucide-react';
import { Appointment, Doctor, MultiChannelNotificationResult } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export interface WhatsAppNotificationCardProps {
  appointment: Partial<Appointment> | any;
  doctor?: Partial<Doctor> | any;
  hospitalContact?: string;
  className?: string;
  notificationResult?: {
    success?: boolean;
    channel?: string;
    patientNotified?: boolean;
    hospitalNotified?: boolean;
    channels?: MultiChannelNotificationResult;
  } | null;
}

type DisplayStatus = 'sent' | 'simulated' | 'queued' | 'failed' | 'pending';

export default function WhatsAppNotificationCard({
  appointment,
  doctor,
  hospitalContact = '+92 315 6621341',
  className = '',
  notificationResult,
}: WhatsAppNotificationCardProps) {
  const { isUrdu } = useLanguage();

  // Determine patient recipient number
  const patientRecipient =
    (appointment.whatsapp && appointment.whatsapp.trim())
      ? appointment.whatsapp.trim()
      : (appointment.phone && appointment.phone.trim())
      ? appointment.phone.trim()
      : '';

  // Resolve notification status from multiple sources
  const resolveStatus = (): DisplayStatus => {
    // 1. From fresh API response (most authoritative)
    const channelStatus = (notificationResult?.channels?.patient_whatsapp?.status as string | undefined);
    if (channelStatus === 'sent') return 'sent';
    if (channelStatus === 'simulated') return 'simulated';
    if (channelStatus === 'failed') return 'failed';
    if (channelStatus === 'skipped') return 'queued';

    if (notificationResult?.patientNotified === true) return 'sent';

    // 2. From appointment record notification_status
    const apptStatus = (appointment as Appointment).notification_status;
    if (apptStatus === 'Sent') return 'sent';
    if (apptStatus === 'Mock-Sent') return 'simulated';
    if (apptStatus === 'Failed') return 'failed';

    // 3. Default in local dev without cloud credentials is simulated/dev mode
    return 'simulated';
  };

  const status = resolveStatus();
  const errorDetail = notificationResult?.channels?.patient_whatsapp?.error;

  const statusConfig: Record<DisplayStatus, {
    icon: React.ReactNode;
    label: string;
    labelUr: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    desc: string;
    descUr: string;
  }> = {
    sent: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
      label: 'WhatsApp Message Sent',
      labelUr: 'واٹس ایپ میسج بھیج دیا گیا',
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-200/90',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      desc: `Appointment notification sent automatically to patient (${patientRecipient}).`,
      descUr: `اپوائنٹمنٹ نوٹیفکیشن مریض کے نمبر (${patientRecipient}) پر خودکار طریقے سے بھیج دی گئی ہے۔`,
    },
    simulated: {
      icon: <Clock className="w-5 h-5 text-amber-600 shrink-0" />,
      label: 'Local Dev Mode (Simulated / Mock)',
      labelUr: 'ٹیسٹ موڈ (سسٹم میں لاگ ہو گیا)',
      bg: 'bg-amber-50/80',
      border: 'border-amber-200/90',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-white',
      desc: `Notification generated for patient (${patientRecipient}). In local test mode, messages are logged to console.`,
      descUr: `مریض کے نمبر (${patientRecipient}) کے لیے نوٹیفکیشن سسٹم میں تیار اور لاگ ہو گئی ہے۔`,
    },
    queued: {
      icon: <Clock className="w-5 h-5 text-blue-600 shrink-0" />,
      label: 'Notification Queued',
      labelUr: 'نوٹیفکیشن قطار میں ہے',
      bg: 'bg-blue-50/80',
      border: 'border-blue-200/90',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      desc: `Appointment notification dispatched automatically to patient (${patientRecipient || 'entered number'}).`,
      descUr: `اپوائنٹمنٹ نوٹیفکیشن مریض (${patientRecipient || 'درج نمبر'}) کو خودکار بھیج دی گئی ہے۔`,
    },
    failed: {
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      label: 'Notification Failed',
      labelUr: 'نوٹیفکیشن ناکام',
      bg: 'bg-rose-50/80',
      border: 'border-rose-200/90',
      badgeBg: 'bg-rose-600',
      badgeText: 'text-white',
      desc: errorDetail || `Could not send to patient (${patientRecipient || 'no valid number'}). Check server logs.`,
      descUr: `مریض (${patientRecipient || 'کوئی نمبر نہیں'}) کو نہیں بھیجا جا سکا۔ سرور لاگز چیک کریں۔`,
    },
    pending: {
      icon: <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />,
      label: 'Notification Pending',
      labelUr: 'نوٹیفکیشن زیر التواء',
      bg: 'bg-slate-50/80',
      border: 'border-slate-200/90',
      badgeBg: 'bg-slate-400',
      badgeText: 'text-white',
      desc: 'Notification status pending.',
      descUr: 'نوٹیفکیشن کی حیثیت ابھی زیر التواء ہے۔',
    },
  };

  const cfg = statusConfig[status];

  return (
    <div
      className={`${cfg.bg} border ${cfg.border} rounded-2xl p-5 sm:p-6 shadow-xs transition-all ${className}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          {cfg.icon}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {isUrdu ? cfg.labelUr : cfg.label}
          </h3>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText} shadow-xs`}
        >
          {status === 'sent'
            ? (isUrdu ? 'بھیج دی گئی' : 'Sent')
            : status === 'simulated'
            ? (isUrdu ? 'ٹیسٹ موڈ' : 'Dev / Mock')
            : status === 'queued'
            ? (isUrdu ? 'قطار میں' : 'Queued')
            : status === 'failed'
            ? (isUrdu ? 'ناکام' : 'Failed')
            : (isUrdu ? 'زیر التواء' : 'Pending')}
        </span>
      </div>

      {/* Patient number indicator */}
      {patientRecipient && (
        <div className="text-xs text-slate-700 font-medium mb-3 flex items-center justify-between bg-white/70 border border-slate-200/80 rounded-xl px-3.5 py-2">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>{isUrdu ? 'مریض کا نمبر:' : 'Patient Number:'}</span>
          </span>
          <span className="font-mono font-bold text-slate-900" dir="ltr">{patientRecipient}</span>
        </div>
      )}

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
        {isUrdu ? cfg.descUr : cfg.desc}
      </p>

      {/* Development / Mock Mode Explanation Notice */}
      {status === 'simulated' && (
        <div className="mt-3.5 flex items-start gap-2.5 p-3.5 bg-amber-100/70 rounded-xl border border-amber-200/80">
          <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">
              {isUrdu ? 'اصلی موبائل پر میسج کیوں نہیں آیا؟' : 'Why did no message arrive on your physical phone?'}
            </p>
            <p className="text-amber-800 leading-relaxed">
              {isUrdu
                ? 'لوکل ہوسٹ پر میسج کامیابی سے تیار ہو کر سرور ٹرمینل پر لاگ ہو چکا ہے۔ اصلی موبائل یا سم پر میسج بھیجنے کے لیے Meta WhatsApp Business API یا Twilio کی کیز سیٹ کرنا ضروری ہیں۔'
                : 'Your message was successfully generated and logged in the server console. To deliver real messages to physical phones via WhatsApp or SIM, configure Meta WhatsApp Cloud API or Twilio credentials in your environment.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
