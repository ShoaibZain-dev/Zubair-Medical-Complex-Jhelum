import { Appointment, Doctor, MultiChannelNotificationResult } from '../types';
import { storage } from './storage';

export const HOSPITAL_DEFAULT_NUMBER = '+92 315 6621341';

// ---------------------------------------------------------------------------
// Pakistani phone number normalizer: converts any local format to E.164
// e.g.  03001234567  -> +923001234567
//       3001234567   -> +923001234567
//       +923001234567 -> +923001234567
// ---------------------------------------------------------------------------
export function normalizeToE164(phone: string): string {
  let digits = phone.replace(/[^\d]/g, '');
  // Remove leading zero â†’ prepend 92
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '92' + digits.slice(1);
  }
  // 10-digit starting with 3 (e.g. 3001234567)
  if (digits.startsWith('3') && digits.length === 10) {
    digits = '92' + digits;
  }
  // Already has country code
  if (!digits.startsWith('92') && digits.length > 11) {
    // leave as-is for non-PK numbers
    return '+' + digits;
  }
  if (digits.startsWith('92') && digits.length === 12) {
    return '+' + digits;
  }
  // fallback: just prefix +
  return '+' + digits;
}

export interface NotificationPayload {
  event: 'new_appointment' | 'confirmed' | 'cancelled' | 'status_update';
  appointment: Appointment;
  doctor: Doctor;
  customNotes?: string;
}

// Legacy result shape kept for backwards compatibility with existing API callers
export interface NotificationResult {
  success: boolean;
  channel: 'whatsapp' | 'sms' | 'email' | 'mock';
  patientNotified: boolean;
  hospitalNotified: boolean;
  patientError?: string;
  hospitalError?: string;
  /** Granular per-channel result */
  channels?: MultiChannelNotificationResult;
}

// ---------------------------------------------------------------------------
// Recipient Validation & Hospital Number Protection
// ---------------------------------------------------------------------------

export function cleanDigits(num?: string | null): string {
  if (!num || typeof num !== 'string') return '';
  return num.replace(/[^0-9]/g, '');
}

export function isHospitalContactNumber(num?: string | null, hospitalNumber: string = HOSPITAL_DEFAULT_NUMBER): boolean {
  if (!num || typeof num !== 'string') return false;
  const digits = cleanDigits(num);
  if (!digits) return false;
  const hospDigits = cleanDigits(hospitalNumber);
  const defHospDigits = cleanDigits(HOSPITAL_DEFAULT_NUMBER);
  return digits === hospDigits || digits === defHospDigits;
}

export function isValidPatientRecipientNumber(num?: string | null, hospitalNumber: string = HOSPITAL_DEFAULT_NUMBER): boolean {
  if (!num || typeof num !== 'string') return false;
  const trimmed = num.trim();
  if (!trimmed) return false;
  const digits = cleanDigits(trimmed);
  // Phone must be between 10 and 15 digits
  if (digits.length < 10 || digits.length > 15) return false;
  // Patient recipient must NEVER be the hospital contact number
  if (isHospitalContactNumber(trimmed, hospitalNumber)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Message formatters
// ---------------------------------------------------------------------------

export function formatPatientWhatsAppMessage(payload: NotificationPayload, hospitalContact: string): string {
  const { event, appointment, doctor } = payload;

  switch (event) {
    case 'new_appointment':
      return `Assalam-o-Alaikum ${appointment.patient_name},

Your appointment request at Zubair Medical Complex Jhelum has been received successfully.

Doctor: ${doctor.name}
Appointment Date: ${appointment.appointment_date}
Appointment Time: ${appointment.appointment_time}
Appointment ID: ${appointment.appointment_id}
Status: Pending Confirmation

Our reception team will review your request and notify you once your appointment is confirmed.

Thank you for choosing Zubair Medical Complex Jhelum.`;

    case 'confirmed':
      return `Assalam-o-Alaikum ${appointment.patient_name},

Good news! Your appointment at Zubair Medical Complex Jhelum has been confirmed.

Doctor: ${doctor.name}
Appointment Date: ${appointment.appointment_date}
Appointment Time: ${appointment.appointment_time}
Appointment ID: ${appointment.appointment_id}
Status: Confirmed

Please arrive 10-15 minutes before your appointment.

For assistance, contact Zubair Medical Complex Jhelum at ${hospitalContact}.

Thank you.`;

    case 'cancelled':
      return `Assalam-o-Alaikum ${appointment.patient_name},

We regret to inform you that your appointment at Zubair Medical Complex Jhelum has been cancelled.

Doctor: ${doctor.name}
Appointment Date: ${appointment.appointment_date}
Appointment ID: ${appointment.appointment_id}

For queries or rescheduling, please contact us at ${hospitalContact}.

Thank you for choosing Zubair Medical Complex Jhelum.`;

    default: {
      const statusLabel = appointment.status;
      return `Assalam-o-Alaikum ${appointment.patient_name},

Your appointment status at Zubair Medical Complex Jhelum has been updated.

Doctor: ${doctor.name}
Appointment Date: ${appointment.appointment_date}
Appointment Time: ${appointment.appointment_time}
Appointment ID: ${appointment.appointment_id}
Status: ${statusLabel}

For assistance, contact us at ${hospitalContact}.

Thank you for choosing Zubair Medical Complex Jhelum.`;
    }
  }
}

export function formatPatientSMSMessage(payload: NotificationPayload, hospitalContact: string): string {
  const { event, appointment, doctor } = payload;
  const isConfirmed = event === 'confirmed' || appointment.status === 'Confirmed' || appointment.status === 'Booked';
  const statusLabel = isConfirmed ? 'Confirmed' : appointment.status;

  return `Zubair Medical Complex Jhelum: Appointment ${statusLabel}. ID: ${appointment.appointment_id}, Patient: ${appointment.patient_name}, Doctor: ${doctor.name}, Specialty: ${doctor.specialty || appointment.specialty}, Date: ${appointment.appointment_date}, Time: ${appointment.appointment_time}, Status: ${statusLabel}, Hospital Contact: ${hospitalContact}.`;
}

export function formatHospitalWhatsAppMessage(payload: NotificationPayload): string {
  const { event, appointment, doctor } = payload;
  return `🔔 *Zubair Medical Complex - Reception Alert*
*Event:* ${event.toUpperCase()}

• *Appointment ID:* ${appointment.appointment_id}
• *Patient:* ${appointment.patient_name} (Age: ${appointment.age}, Gender: ${appointment.gender})
• *Phone:* ${appointment.phone} | *WhatsApp:* ${appointment.whatsapp}
${appointment.email ? `• *Email:* ${appointment.email}` : ''}
• *Doctor:* ${doctor.name} (${doctor.specialty || appointment.specialty})
• *Date:* ${appointment.appointment_date}
• *Time:* ${appointment.appointment_time}
• *Status:* ${appointment.status}
${appointment.notes ? `• *Patient Notes:* ${appointment.notes}` : ''}`;
}

// ---------------------------------------------------------------------------
// Email HTML templates
// ---------------------------------------------------------------------------

function formatStaffEmailHtml(payload: NotificationPayload, dashboardUrl: string): string {
  const { event, appointment, doctor } = payload;
  const eventLabel =
    event === 'new_appointment'
      ? 'New Appointment Booking'
      : event === 'confirmed'
      ? 'Appointment Confirmed'
      : event === 'cancelled'
      ? 'Appointment Cancelled'
      : `Status Update: ${appointment.status}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${eventLabel} – Zubair Medical Complex</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1E3A5F 0%,#1E90FF 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🏥 Zubair Medical Complex</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Kala Gujran, Jhelum, Punjab, Pakistan</p>
          </td>
        </tr>
        <!-- Event Badge -->
        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <span style="display:inline-block;background:${event === 'new_appointment' ? '#dbeafe' : event === 'confirmed' ? '#dcfce7' : event === 'cancelled' ? '#fee2e2' : '#fef3c7'};color:${event === 'new_appointment' ? '#1d4ed8' : event === 'confirmed' ? '#15803d' : event === 'cancelled' ? '#dc2626' : '#92400e'};padding:8px 20px;border-radius:100px;font-size:13px;font-weight:700;">
              ${eventLabel}
            </span>
            <h2 style="margin:16px 0 0;font-size:18px;color:#0f172a;">${eventLabel}</h2>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Received on ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
          </td>
        </tr>
        <!-- Appointment Details -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr><td colspan="2" style="background:#1E90FF;padding:10px 20px;"><span style="color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Appointment Details</span></td></tr>
              ${row('Appointment ID', `<strong style="font-family:monospace;color:#1E90FF;">${appointment.appointment_id}</strong>`)}
              ${row('Patient Name', appointment.patient_name)}
              ${row('Phone', appointment.phone)}
              ${row('WhatsApp', appointment.whatsapp)}
              ${appointment.email ? row('Email', appointment.email) : ''}
              ${row('Age / Gender', `${appointment.age} yrs / ${appointment.gender}`)}
              ${row('Doctor', doctor.name)}
              ${row('Specialty', doctor.specialty || appointment.specialty)}
              ${row('Date', appointment.appointment_date)}
              ${row('Time', appointment.appointment_time)}
              ${row('Status', `<strong style="color:${appointment.status === 'Booked' || appointment.status === 'Confirmed' ? '#15803d' : appointment.status === 'Checked' ? '#2563eb' : appointment.status === 'Cancelled' ? '#dc2626' : '#92400e'};">${appointment.status}</strong>`)}
              ${appointment.notes ? row('Patient Notes', appointment.notes) : ''}
            </table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#1E90FF;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(30,144,255,0.3);">
              View in Admin Dashboard →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Zubair Medical Complex Jhelum · Kala Gujran, Jhelum, Punjab, Pakistan</p>
            <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">This is an automated reception alert. Do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatPatientEmailHtml(payload: NotificationPayload): string {
  const { event, appointment, doctor } = payload;
  const isConfirmed = event === 'confirmed' || appointment.status === 'Confirmed' || appointment.status === 'Booked';
  const isCancelled = event === 'cancelled' || appointment.status === 'Cancelled';

  const eventLabel =
    isConfirmed
      ? 'Appointment Confirmed'
      : isCancelled
      ? 'Appointment Cancelled'
      : event === 'new_appointment'
      ? 'Appointment Request Received'
      : `Appointment Update: ${appointment.status}`;

  const statusColor = isConfirmed ? '#15803d' : isCancelled ? '#dc2626' : '#1d4ed8';
  const statusBg = isConfirmed ? '#dcfce7' : isCancelled ? '#fee2e2' : '#dbeafe';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${eventLabel} – Zubair Medical Complex</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1E3A5F 0%,#1E90FF 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🏥 Zubair Medical Complex</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Kala Gujran, Jhelum, Punjab, Pakistan</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;text-align:center;">
            <div style="display:inline-block;background:${statusBg};color:${statusColor};padding:8px 20px;border-radius:100px;font-size:14px;font-weight:700;">${eventLabel}</div>
            <p style="margin:20px 0 0;font-size:16px;color:#0f172a;">Dear <strong>${appointment.patient_name}</strong>,</p>
            <p style="margin:10px 0 0;font-size:14px;color:#475569;line-height:1.6;">
              ${isConfirmed
                ? 'Your appointment at Zubair Medical Complex Jhelum has been <strong>confirmed</strong>. Please arrive 10–15 minutes early.'
                : isCancelled
                ? 'Your appointment has been <strong>cancelled</strong>. Please contact us to reschedule.'
                : event === 'new_appointment'
                ? 'Your appointment request has been received and is <strong>pending confirmation</strong> by our team.'
                : `Your appointment status has been updated to <strong>${appointment.status}</strong>.`}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr><td colspan="2" style="background:#1E90FF;padding:10px 20px;"><span style="color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Your Appointment</span></td></tr>
              ${row('Appointment ID', `<strong style="font-family:monospace;color:#1E90FF;">${appointment.appointment_id}</strong>`)}
              ${row('Doctor', doctor.name)}
              ${row('Specialty', doctor.specialty || appointment.specialty)}
              ${row('Date', appointment.appointment_date)}
              ${row('Time', appointment.appointment_time)}
              ${row('Status', `<strong style="color:${statusColor};">${appointment.status}</strong>`)}
              ${row('Hospital Contact', '+92 315 6621341')}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Zubair Medical Complex Jhelum · +92 315 6621341</p>
            <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">This is an automated notification. Do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 20px;font-size:13px;color:#64748b;font-weight:600;white-space:nowrap;border-bottom:1px solid #f1f5f9;width:40%;">${label}</td>
    <td style="padding:10px 20px;font-size:13px;color:#0f172a;border-bottom:1px solid #f1f5f9;">${value}</td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// Transport implementations
// ---------------------------------------------------------------------------

async function sendMetaWhatsAppMessage(
  toPhone: string,
  message: string,
  phoneNumberId: string,
  token: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? `92${cleanPhone.slice(1)}`
      : cleanPhone;

    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { preview_url: false, body: message }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error?.message || `HTTP ${res.status}` };
    }

    const resData = await res.json().catch(() => ({}));
    // Extract the WhatsApp message ID for delivery tracking via webhooks
    const messageId = resData.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Meta API error' };
  }
}

// ---------------------------------------------------------------------------
// Meta WhatsApp Template Message — Required for business-initiated messages
// to users who have NOT messaged you first in the last 24 hours.
// Template must be approved in Meta WhatsApp Business Manager.
// ---------------------------------------------------------------------------
async function sendMetaWhatsAppTemplate(
  toPhone: string,
  templateName: string,
  languageCode: string,
  components: Array<{ type: string; parameters: Array<{ type: string; text: string }> }>,
  phoneNumberId: string,
  token: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? `92${cleanPhone.slice(1)}`
      : cleanPhone;

    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components
        }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${res.status}`;
      console.error(`[Meta WhatsApp Template] Failed to send template '${templateName}': ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const resData = await res.json().catch(() => ({}));
    const messageId = resData.messages?.[0]?.id;
    console.log(`[Meta WhatsApp Template] Sent '${templateName}' to ${formattedPhone}, msgId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Meta Template API error' };
  }
}

async function sendTwilioMessage(
  toPhone: string,
  message: string,
  accountSid: string,
  authToken: string,
  fromNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? `+92${cleanPhone.slice(1)}`
      : `+${cleanPhone}`;

    const formattedFrom = fromNumber.startsWith('+') ? fromNumber : `+${fromNumber}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To: formattedFrom.includes('whatsapp:') ? `whatsapp:${formattedPhone}` : formattedPhone,
      From: formattedFrom,
      Body: message
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || `Twilio HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Twilio API error' };
  }
}

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from: string;
  apiKey: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: opts.from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, error: data.message || data.name || `Resend HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Resend API error' };
  }
}

// ---------------------------------------------------------------------------
// Provider Availability Checks
// ---------------------------------------------------------------------------

export function isWhatsAppProviderDeliverable(settings: Record<string, string>): boolean {
  const provider = (settings.messaging_provider || 'mock').toLowerCase();
  if (provider === 'meta_whatsapp') {
    const phoneId = settings.meta_whatsapp_phone_number_id || process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = settings.meta_whatsapp_token || process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    return Boolean(phoneId && token);
  }
  if (provider === 'twilio') {
    const sid = settings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
    const auth = settings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
    const fromNum = settings.twilio_from_number || process.env.TWILIO_FROM_NUMBER;
    return Boolean(sid && auth && fromNum && fromNum.toLowerCase().includes('whatsapp'));
  }
  if (provider === 'mock') {
    return true;
  }
  return true;
}

export function isSMSGatewayAvailable(settings: Record<string, string>): boolean {
  const smsProvider = (settings.sms_provider || '').toLowerCase();
  const provider = (settings.messaging_provider || 'mock').toLowerCase();

  if (settings.sms_gateway_url || process.env.SMS_GATEWAY_URL || smsProvider === 'sms_gateway' || provider === 'sms_gateway') {
    return Boolean(settings.sms_gateway_url || process.env.SMS_GATEWAY_URL);
  }

  if (smsProvider === 'twilio' || provider === 'twilio') {
    const sid = settings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
    const auth = settings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
    const fromNum = settings.twilio_sms_from_number || settings.twilio_from_number || process.env.TWILIO_SMS_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER;
    return Boolean(sid && auth && fromNum);
  }

  if (smsProvider === 'mock' || provider === 'mock' || provider === 'sms_mock') {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Internal helpers: Dispatch WhatsApp / SMS / Email
// ---------------------------------------------------------------------------

export async function dispatchWhatsApp(
  toPhone: string,
  message: string,
  settings: Record<string, string>,
  templateParams?: {
    name: string;
    language: string;
    components: Array<{ type: string; parameters: Array<{ type: string; text: string }> }>;
  }
): Promise<{ success: boolean; error?: string; channel: 'whatsapp' | 'mock'; messageId?: string }> {
  // 1. Priority: Local or Hosted WhatsApp Web Gateway (Baileys)
  const gatewayUrl = (settings.whatsapp_gateway_url || process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:5005').replace(/\/+$/, '');
  try {
    const gwRes = await fetch(`${gatewayUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toPhone, message }),
      signal: AbortSignal.timeout(5000)
    });
    if (gwRes.ok) {
      const gwData = await gwRes.json();
      if (gwData.success) {
        console.log(`[WhatsApp Web Gateway SUCCESS] → ${toPhone}`);
        return { success: true, channel: 'whatsapp', messageId: gwData.messageId };
      }
    }
  } catch {}

  const provider = (settings.messaging_provider || 'mock').toLowerCase();

  if (provider === 'meta_whatsapp') {
    const phoneId = settings.meta_whatsapp_phone_number_id || process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = settings.meta_whatsapp_token || process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;

    if (phoneId && token) {
      const normalizedPhone = normalizeToE164(toPhone);

      // Prefer template message if template name is configured (required for business-initiated messages)
      const templateName = templateParams?.name || process.env.WHATSAPP_TEMPLATE_NAME;
      const templateLanguage = templateParams?.language || process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';

      if (templateName && templateParams?.components) {
        // Send approved template message
        const result = await sendMetaWhatsAppTemplate(
          normalizedPhone,
          templateName,
          templateLanguage,
          templateParams.components,
          phoneId,
          token
        );
        return { success: result.success, error: result.error, channel: 'whatsapp', messageId: result.messageId };
      } else if (templateName && !templateParams?.components) {
        // Template name set but no components provided — fall back to free-text
        console.warn(`[Meta WhatsApp] Template name '${templateName}' set but no components provided — falling back to free-text message.`);
      }

      // Free-text message (works within 24hr customer service window)
      const result = await sendMetaWhatsAppMessage(normalizedPhone, message, phoneId, token);
      return { success: result.success, error: result.error, channel: 'whatsapp', messageId: result.messageId };
    }
    return { success: false, error: 'Meta WhatsApp credentials not configured', channel: 'whatsapp' };
  }

  if (provider === 'twilio') {
    const sid = settings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
    const auth = settings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
    const fromNum = settings.twilio_from_number || process.env.TWILIO_FROM_NUMBER;

    if (sid && auth && fromNum) {
      const formattedFrom = fromNum.startsWith('whatsapp:') ? fromNum : `whatsapp:${fromNum}`;
      const result = await sendTwilioMessage(toPhone, message, sid, auth, formattedFrom);
      return { success: result.success, error: result.error, channel: 'whatsapp' };
    }
    return { success: false, error: 'Twilio WhatsApp credentials not configured', channel: 'whatsapp' };
  }

  if (provider === 'mock') {
    console.log(`[WhatsApp MOCK] → ${toPhone}\n${message}\n`);
    return { success: true, channel: 'mock' };
  }

  return { success: false, error: `WhatsApp provider '${provider}' not supported or not configured`, channel: 'whatsapp' };
}

export async function dispatchSMS(
  toPhone: string,
  message: string,
  settings: Record<string, string>
): Promise<{ success: boolean; error?: string; channel: 'sms' | 'mock' }> {
  const provider = (settings.sms_provider || settings.messaging_provider || 'mock').toLowerCase();

  // 1. Custom HTTP SMS Gateway
  const smsUrl = settings.sms_gateway_url || process.env.SMS_GATEWAY_URL;
  if (smsUrl || provider === 'sms_gateway') {
    if (smsUrl) {
      try {
        const apiKey = settings.sms_gateway_api_key || process.env.SMS_GATEWAY_API_KEY || '';
        const res = await fetch(smsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({ to: toPhone, message })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.error || errData.message || `HTTP ${res.status}`, channel: 'sms' };
        }
        return { success: true, channel: 'sms' };
      } catch (err: any) {
        return { success: false, error: err.message || 'SMS Gateway error', channel: 'sms' };
      }
    }
    return { success: false, error: 'SMS Gateway URL not configured (SMS_GATEWAY_URL)', channel: 'sms' };
  }

  // 2. Twilio SMS
  if (provider === 'twilio' || settings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID) {
    const sid = settings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
    const auth = settings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
    const fromNum = settings.twilio_sms_from_number || settings.twilio_from_number || process.env.TWILIO_SMS_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER;

    if (sid && auth && fromNum) {
      const plainFrom = fromNum.replace(/^whatsapp:/i, '');
      const result = await sendTwilioMessage(toPhone, message, sid, auth, plainFrom);
      return { success: result.success, error: result.error, channel: 'sms' };
    }
    return { success: false, error: 'Twilio SMS credentials not configured', channel: 'sms' };
  }

  // 3. Mock mode
  if (provider === 'mock' || provider === 'sms_mock') {
    console.log(`[SMS MOCK] → ${toPhone}\n${message}\n`);
    return { success: true, channel: 'mock' };
  }

  return { success: false, error: 'No SMS gateway or Twilio credentials configured', channel: 'sms' };
}

async function dispatchEmail(opts: {
  to: string;
  subject: string;
  html: string;
  settings: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'Zubair Medical Complex <notifications@resend.dev>';

  if (!resendKey) {
    const emailProvider = opts.settings.email_provider || 'resend';
    if (emailProvider === 'mock') {
      console.log(`[Email MOCK] → ${opts.to} | Subject: ${opts.subject}`);
      return { success: true };
    }
    return { success: false, error: 'RESEND_API_KEY environment variable not set' };
  }

  return sendResendEmail({ to: opts.to, subject: opts.subject, html: opts.html, from: emailFrom, apiKey: resendKey });
}

// ---------------------------------------------------------------------------
// Public API: sendAppointmentNotifications
// ---------------------------------------------------------------------------

export async function sendAppointmentNotifications(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const settings = storage.getSettings();
  const enabled = settings.notifications_enabled !== 'false';

  if (!enabled) {
    return {
      success: true,
      channel: 'mock',
      patientNotified: false,
      hospitalNotified: false,
      patientError: 'Notifications disabled in settings'
    };
  }

  const { event, appointment, doctor } = payload;

  // Resolve hospital recipients (exclusively for staff alerts)
  const hospitalWhatsAppNumber =
    settings.hospital_notification_whatsapp ||
    settings.hospital_notification_number ||
    process.env.HOSPITAL_NOTIFICATION_WHATSAPP ||
    HOSPITAL_DEFAULT_NUMBER;

  const hospitalEmail =
    settings.hospital_notification_email ||
    process.env.HOSPITAL_NOTIFICATION_EMAIL ||
    '';

  // Build messages
  const patientWaMsg = formatPatientWhatsAppMessage(payload, hospitalWhatsAppNumber);
  const patientSmsMsg = formatPatientSMSMessage(payload, hospitalWhatsAppNumber);
  const hospitalWaMsg = formatHospitalWhatsAppMessage(payload);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
  const dashboardUrl = `${baseUrl}/admin/appointments`;

  const staffEmailSubject =
    event === 'new_appointment'
      ? `New Appointment Booking – Zubair Medical Complex`
      : event === 'confirmed'
      ? `Appointment Confirmed – ${appointment.appointment_id}`
      : event === 'cancelled'
      ? `Appointment Cancelled – ${appointment.appointment_id}`
      : `Appointment Update: ${appointment.status} – ${appointment.appointment_id}`;

  const patientEmailSubject =
    event === 'new_appointment'
      ? `Appointment Received – Zubair Medical Complex Jhelum (${appointment.appointment_id})`
      : event === 'confirmed'
      ? `✅ Appointment Confirmed – Zubair Medical Complex Jhelum`
      : event === 'cancelled'
      ? `Appointment Cancelled – Zubair Medical Complex Jhelum`
      : `Appointment Update – Zubair Medical Complex Jhelum`;

  const channels: MultiChannelNotificationResult = {
    staff_email: { status: 'skipped' },
    staff_whatsapp: { status: 'skipped' },
    patient_email: { status: 'skipped' },
    patient_whatsapp: { status: 'skipped' }
  };

  // -------------------------------------------------------------------------
  // 1. Staff WhatsApp notification (Exclusively to configured hospital staff recipient)
  // -------------------------------------------------------------------------
  if (hospitalWhatsAppNumber) {
    const alreadySent = storage.hasNotificationBeenSent(appointment.appointment_id, event, 'whatsapp', 'hospital');
    if (alreadySent) {
      channels.staff_whatsapp = { status: 'skipped', error: 'Already sent' };
    } else {
      const result = await dispatchWhatsApp(hospitalWhatsAppNumber, hospitalWaMsg, settings);
      const status = result.channel === 'mock' ? 'simulated' : result.success ? 'sent' : 'failed';
      channels.staff_whatsapp = { status: result.success || result.channel === 'mock' ? 'sent' : 'failed', error: result.error };

      storage.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'hospital',
        recipient_number: hospitalWhatsAppNumber,
        event,
        channel: result.channel === 'mock' ? 'mock' : 'whatsapp',
        message: hospitalWaMsg,
        status,
        error_details: result.error,
        ...(result.messageId ? { whatsapp_message_id: result.messageId } : {})
      });
    }
  }

  // -------------------------------------------------------------------------
  // 2. Staff Email notification (Exclusively to configured hospital staff email)
  // -------------------------------------------------------------------------
  if (hospitalEmail) {
    const alreadySent = storage.hasNotificationBeenSent(appointment.appointment_id, event, 'email', 'hospital');
    if (alreadySent) {
      channels.staff_email = { status: 'skipped', error: 'Already sent' };
    } else {
      const emailResult = await dispatchEmail({
        to: hospitalEmail,
        subject: staffEmailSubject,
        html: formatStaffEmailHtml(payload, dashboardUrl),
        settings
      });
      const status = emailResult.success ? 'sent' : 'failed';
      channels.staff_email = { status: emailResult.success ? 'sent' : 'failed', error: emailResult.error };

      storage.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'hospital',
        recipient_number: hospitalEmail,
        event,
        channel: 'email',
        message: `[HTML Email] Subject: ${staffEmailSubject}`,
        status,
        error_details: emailResult.error
      });
    }
  } else {
    channels.staff_email = { status: 'skipped', error: 'HOSPITAL_NOTIFICATION_EMAIL not configured' };
  }

  // -------------------------------------------------------------------------
  // 3. Patient WhatsApp / SMS notification (Strictly to patient's own eligible recipient)
  // -------------------------------------------------------------------------
  // Check if a patient notification has already been sent for this appointment + event (Idempotency)
  const alreadyPatientSent = storage.hasNotificationBeenSent(
    appointment.appointment_id,
    event,
    'messaging',
    'patient'
  );

  if (alreadyPatientSent) {
    channels.patient_whatsapp = { status: 'skipped', error: 'Already sent' };
  } else {
    const hasValidWa = isValidPatientRecipientNumber(appointment.whatsapp, hospitalWhatsAppNumber);
    const hasValidPhone = isValidPatientRecipientNumber(appointment.phone, hospitalWhatsAppNumber);

    const canWhatsApp = isWhatsAppProviderDeliverable(settings);
    const canSMS = isSMSGatewayAvailable(settings);

    let delivered = false;
    let attemptedChannel: 'whatsapp' | 'sms' = 'whatsapp';
    let attemptedRecipient: string | null = null;
    let lastError: string | undefined = undefined;

    // Build Meta WhatsApp template parameters for appointment confirmation
    // These map to the {{1}}, {{2}}, ... variables in the approved template.
    // Template: "Assalam-o-Alaikum {{1}}! Your appointment at Zubair Medical
    // Complex Jhelum has been confirmed. ID: {{2}}, Doctor: {{3}},
    // Date: {{4}}, Time: {{5}}. Thank you."
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
    const templateParams = templateName ? {
      name: templateName,
      language: templateLanguage,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: appointment.patient_name },
            { type: 'text', text: appointment.appointment_id },
            { type: 'text', text: doctor.name },
            { type: 'text', text: appointment.appointment_date },
            { type: 'text', text: appointment.appointment_time }
          ]
        }
      ]
    } : undefined;

    // Priority 1: Use patient's submitted WhatsApp number if provided and valid
    if (hasValidWa && canWhatsApp) {
      attemptedChannel = 'whatsapp';
      attemptedRecipient = appointment.whatsapp!.trim();
      const res = await dispatchWhatsApp(attemptedRecipient, patientWaMsg, settings, templateParams);
      if (res.success || res.channel === 'mock') {
        delivered = true;
        channels.patient_whatsapp = { status: 'sent' };
        storage.addNotificationLog({
          appointment_id: appointment.appointment_id,
          recipient_type: 'patient',
          recipient_number: attemptedRecipient,
          event,
          channel: res.channel === 'mock' ? 'mock' : 'whatsapp',
          message: patientWaMsg,
          status: res.channel === 'mock' ? 'simulated' : 'sent',
          ...(res.messageId ? { whatsapp_message_id: res.messageId } : {})
        });
      } else {
        lastError = res.error || 'WhatsApp delivery failed for patient WhatsApp number';
      }
    }

    // Priority 2: Fall back to patient's phone number via WhatsApp only if provider can deliver
    if (!delivered && hasValidPhone && canWhatsApp) {
      attemptedChannel = 'whatsapp';
      attemptedRecipient = appointment.phone!.trim();
      const res = await dispatchWhatsApp(attemptedRecipient, patientWaMsg, settings, templateParams);
      if (res.success || res.channel === 'mock') {
        delivered = true;
        channels.patient_whatsapp = { status: 'sent' };
        storage.addNotificationLog({
          appointment_id: appointment.appointment_id,
          recipient_type: 'patient',
          recipient_number: attemptedRecipient,
          event,
          channel: res.channel === 'mock' ? 'mock' : 'whatsapp',
          message: patientWaMsg,
          status: res.channel === 'mock' ? 'simulated' : 'sent',
          ...(res.messageId ? { whatsapp_message_id: res.messageId } : {})
        });
      } else {
        lastError = res.error || 'WhatsApp delivery failed for patient phone number';
      }
    }

    // Priority 3: If WhatsApp cannot be used, send SMS to patient's phone number through configured SMS gateway
    if (!delivered && hasValidPhone && canSMS) {
      attemptedChannel = 'sms';
      attemptedRecipient = appointment.phone!.trim();
      const res = await dispatchSMS(attemptedRecipient, patientSmsMsg, settings);
      if (res.success || res.channel === 'mock') {
        delivered = true;
        channels.patient_whatsapp = { status: 'sent' };
        storage.addNotificationLog({
          appointment_id: appointment.appointment_id,
          recipient_type: 'patient',
          recipient_number: attemptedRecipient,
          event,
          channel: res.channel === 'mock' ? 'mock' : 'sms',
          message: patientSmsMsg,
          status: res.channel === 'mock' ? 'simulated' : 'sent'
        });
      } else {
        lastError = res.error || 'SMS delivery failed';
      }
    }

    // Priority 4: If no valid recipient or provider is available, or provider failed:
    // Log failure clearly. Never substitute hospital number.
    if (!delivered) {
      const errorReason = !hasValidWa && !hasValidPhone
        ? 'No valid patient recipient contact details provided. Never falling back to hospital number.'
        : lastError || 'No configured messaging provider or SMS gateway could deliver to the patient recipient.';

      channels.patient_whatsapp = { status: 'failed', error: errorReason };
      storage.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: (hasValidWa ? appointment.whatsapp : hasValidPhone ? appointment.phone : '') || 'NONE',
        event,
        channel: attemptedChannel,
        message: attemptedChannel === 'sms' ? patientSmsMsg : patientWaMsg,
        status: 'failed',
        error_details: errorReason
      });
    }
  }

  // -------------------------------------------------------------------------
  // 4. Patient Email notification
  // -------------------------------------------------------------------------
  const patientEmail = (appointment.email && appointment.email.trim()) ? appointment.email.trim() : '';
  if (patientEmail) {
    const alreadySent = storage.hasNotificationBeenSent(appointment.appointment_id, event, 'email', 'patient');
    if (alreadySent) {
      channels.patient_email = { status: 'skipped', error: 'Already sent' };
    } else {
      const emailResult = await dispatchEmail({
        to: patientEmail,
        subject: patientEmailSubject,
        html: formatPatientEmailHtml(payload),
        settings
      });
      const status = emailResult.success ? 'sent' : 'failed';
      channels.patient_email = { status: emailResult.success ? 'sent' : 'failed', error: emailResult.error };

      storage.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: patientEmail,
        event,
        channel: 'email',
        message: `[HTML Email] Subject: ${patientEmailSubject}`,
        status,
        error_details: emailResult.error
      });
    }
  }

  // Aggregate results accurately
  const patientNotified =
    channels.patient_whatsapp.status === 'sent' || channels.patient_email.status === 'sent';
  const hospitalNotified =
    channels.staff_whatsapp.status === 'sent' || channels.staff_email.status === 'sent';

  const provider = (settings.messaging_provider || 'mock').toLowerCase();
  const legacyChannel: 'whatsapp' | 'sms' | 'email' | 'mock' =
    channels.patient_whatsapp.status === 'sent'
      ? (provider === 'meta_whatsapp' ? 'whatsapp' : provider === 'twilio' ? 'sms' : 'mock')
      : 'mock';

  return {
    success: patientNotified || hospitalNotified,
    channel: legacyChannel,
    patientNotified,
    hospitalNotified,
    patientError: channels.patient_whatsapp.error,
    hospitalError: channels.staff_whatsapp.error,
    channels
  };
}
