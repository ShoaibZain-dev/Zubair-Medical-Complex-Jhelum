import { Appointment, Doctor, MultiChannelNotificationResult } from '../types';
import { storage } from './storage';

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
// Message formatters
// ---------------------------------------------------------------------------

function formatPatientWhatsAppMessage(payload: NotificationPayload, hospitalContact: string): string {
  const { event, appointment, doctor } = payload;
  const header = `🏥 *Zubair Medical Complex Jhelum*\nAppointment Notification`;

  let eventTitle = '';
  let statusNote = '';

  switch (event) {
    case 'new_appointment':
      eventTitle = '✅ *Appointment Received (Pending)*';
      statusNote = 'Your appointment request has been submitted and your status is now Pending. Our team will book your slot shortly.';
      break;
    case 'confirmed':
      eventTitle = '🎉 *Appointment Booked*';
      statusNote = 'Your appointment is now Booked. Please arrive 10-15 minutes prior to your consultation time.';
      break;
    case 'cancelled':
      eventTitle = '❌ *Appointment Cancelled*';
      statusNote = 'Your appointment has been cancelled. For queries or rescheduling, please contact the clinic.';
      break;
    case 'status_update':
      eventTitle = `ℹ️ *Appointment Status Update: ${appointment.status}*`;
      if (appointment.status === 'Checked') {
        statusNote = 'Your consultation has been Checked (Completed). Thank you for visiting Zubair Medical Complex!';
      } else {
        statusNote = `Status has been updated to: ${appointment.status}.`;
      }
      break;
  }

  return `${header}
${eventTitle}

📋 *Appointment Details:*
• *Appointment ID:* ${appointment.appointment_id}
• *Patient Name:* ${appointment.patient_name}
• *Doctor:* ${doctor.name}
• *Specialty:* ${doctor.specialty}
• *Appointment Date:* ${appointment.appointment_date}
• *Appointment Time:* ${appointment.appointment_time}
• *Status:* ${appointment.status}

📞 *Hospital Contact:* ${hospitalContact}
${payload.customNotes ? `\n📝 *Notes:* ${payload.customNotes}` : ''}
${statusNote}

Thank you for choosing Zubair Medical Complex Jhelum.`;
}

function formatHospitalWhatsAppMessage(payload: NotificationPayload): string {
  const { event, appointment, doctor } = payload;
  return `🔔 *Zubair Medical Complex - Reception Alert*
*Event:* ${event.toUpperCase()}

• *Appointment ID:* ${appointment.appointment_id}
• *Patient:* ${appointment.patient_name} (Age: ${appointment.age}, Gender: ${appointment.gender})
• *Phone:* ${appointment.phone} | *WhatsApp:* ${appointment.whatsapp}
${appointment.email ? `• *Email:* ${appointment.email}` : ''}
• *Doctor:* ${doctor.name} (${doctor.specialty})
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
      ? 'Appointment Booked'
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
              ${row('Specialty', doctor.specialty)}
              ${row('Date', appointment.appointment_date)}
              ${row('Time', appointment.appointment_time)}
              ${row('Status', `<strong style="color:${appointment.status === 'Booked' ? '#15803d' : appointment.status === 'Checked' ? '#2563eb' : appointment.status === 'Cancelled' ? '#dc2626' : '#92400e'};">${appointment.status}</strong>`)}
              ${appointment.notes ? row('Patient Notes', appointment.notes) : ''}
            </table>
          </td>
        </tr>
        <!-- Dashboard Link -->
        <tr>
          <td style="padding:0 40px 28px;text-align:center;">
            <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#1E90FF,#1565C0);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
              Open Receptionist Dashboard →
            </a>
          </td>
        </tr>
        <!-- Footer -->
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

function formatPatientEmailHtml(payload: NotificationPayload): string {
  const { event, appointment, doctor } = payload;
  const isConfirmed = event === 'confirmed';
  const isCancelled = event === 'cancelled';

  const statusColor = isConfirmed ? '#15803d' : isCancelled ? '#dc2626' : '#1d4ed8';
  const statusBg = isConfirmed ? '#dcfce7' : isCancelled ? '#fee2e2' : '#dbeafe';
  const eventLabel = isConfirmed
    ? 'Appointment Confirmed ✅'
    : isCancelled
    ? 'Appointment Cancelled'
    : event === 'new_appointment'
    ? 'Appointment Received (Pending)'
    : `Appointment Update: ${appointment.status}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${eventLabel} – Zubair Medical Complex Jhelum</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1E3A5F 0%,#1E90FF 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🏥 Zubair Medical Complex Jhelum</h1>
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
              ${row('Specialty', doctor.specialty)}
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? `92${cleanPhone.slice(1)}`
      : cleanPhone;

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
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

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Meta API error' };
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
// Internal helpers: send WhatsApp via configured provider
// ---------------------------------------------------------------------------

async function dispatchWhatsApp(
  toPhone: string,
  message: string,
  settings: Record<string, string>
): Promise<{ success: boolean; error?: string; channel: 'whatsapp' | 'sms' | 'mock' }> {
  const provider = (settings.messaging_provider || 'mock').toLowerCase();

  if (provider === 'meta_whatsapp') {
    const phoneId = settings.meta_whatsapp_phone_number_id || process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = settings.meta_whatsapp_token || process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;

    if (phoneId && token) {
      const result = await sendMetaWhatsAppMessage(toPhone, message, phoneId, token);
      return { ...result, channel: 'whatsapp' };
    }
    return { success: false, error: 'Meta WhatsApp credentials not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN)', channel: 'whatsapp' };
  }

  if (provider === 'twilio') {
    const sid = settings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
    const auth = settings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
    const fromNum = settings.twilio_from_number || process.env.TWILIO_FROM_NUMBER;

    if (sid && auth && fromNum) {
      const result = await sendTwilioMessage(toPhone, message, sid, auth, fromNum);
      return { ...result, channel: 'sms' };
    }
    return { success: false, error: 'Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER)', channel: 'sms' };
  }

  // Mock mode: log to console but count as simulated success
  console.log(`[WhatsApp MOCK] → ${toPhone}\n${message}\n`);
  return { success: true, channel: 'mock' };
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
    // No key configured – log and return as mock/skipped
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
// Public API
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

  // Resolve configured recipients
  const hospitalWhatsAppNumber =
    settings.hospital_notification_whatsapp ||
    settings.hospital_notification_number ||
    process.env.HOSPITAL_NOTIFICATION_WHATSAPP ||
    '+92 315 6621341';

  const hospitalEmail =
    settings.hospital_notification_email ||
    process.env.HOSPITAL_NOTIFICATION_EMAIL ||
    '';

  const patientWhatsAppNumber = appointment.whatsapp || appointment.phone;
  const patientEmail = appointment.email || '';

  // Build messages
  const patientWaMsg = formatPatientWhatsAppMessage(payload, hospitalWhatsAppNumber);
  const hospitalWaMsg = formatHospitalWhatsAppMessage(payload);

  // Dashboard URL (for staff email)
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
  // 1. Staff WhatsApp notification
  // -------------------------------------------------------------------------
  {
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
        channel: result.channel === 'mock' ? 'mock' : result.channel === 'sms' ? 'sms' : 'whatsapp',
        message: hospitalWaMsg,
        status,
        error_details: result.error
      });
    }
  }

  // -------------------------------------------------------------------------
  // 2. Staff Email notification
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
  // 3. Patient WhatsApp notification
  // -------------------------------------------------------------------------
  if (patientWhatsAppNumber) {
    const alreadySent = storage.hasNotificationBeenSent(appointment.appointment_id, event, 'whatsapp', 'patient');
    if (alreadySent) {
      channels.patient_whatsapp = { status: 'skipped', error: 'Already sent' };
    } else {
      const result = await dispatchWhatsApp(patientWhatsAppNumber, patientWaMsg, settings);
      const status = result.channel === 'mock' ? 'simulated' : result.success ? 'sent' : 'failed';
      channels.patient_whatsapp = { status: result.success || result.channel === 'mock' ? 'sent' : 'failed', error: result.error };

      storage.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: patientWhatsAppNumber,
        event,
        channel: result.channel === 'mock' ? 'mock' : result.channel === 'sms' ? 'sms' : 'whatsapp',
        message: patientWaMsg,
        status,
        error_details: result.error
      });
    }
  }

  // -------------------------------------------------------------------------
  // 4. Patient Email notification
  // -------------------------------------------------------------------------
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

  // Aggregate for legacy callers
  const patientNotified =
    channels.patient_whatsapp.status === 'sent' || channels.patient_email.status === 'sent';
  const hospitalNotified =
    channels.staff_whatsapp.status === 'sent' || channels.staff_email.status === 'sent';

  const provider = (settings.messaging_provider || 'mock').toLowerCase();
  const legacyChannel: 'whatsapp' | 'sms' | 'email' | 'mock' =
    provider === 'meta_whatsapp' ? 'whatsapp' : provider === 'twilio' ? 'sms' : 'mock';

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
