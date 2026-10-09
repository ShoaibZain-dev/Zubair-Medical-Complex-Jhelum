import { Appointment, Doctor } from '../types';
import { storage } from './storage';

export interface NotificationPayload {
  event: 'new_appointment' | 'confirmed' | 'cancelled' | 'status_update';
  appointment: Appointment;
  doctor: Doctor;
  customNotes?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: 'whatsapp' | 'sms' | 'mock';
  patientNotified: boolean;
  hospitalNotified: boolean;
  patientError?: string;
  hospitalError?: string;
}

function formatPatientMessage(payload: NotificationPayload, hospitalContact: string): string {
  const { event, appointment, doctor } = payload;
  const header = `🏥 *Zubair Medical Complex Jhelum*\nAppointment Notification`;

  let eventTitle = '';
  let statusNote = '';

  switch (event) {
    case 'new_appointment':
      eventTitle = '✅ *Appointment Received (Pending Confirmation)*';
      statusNote = 'Your appointment request has been submitted. Our team will review and confirm your slot shortly.';
      break;
    case 'confirmed':
      eventTitle = '🎉 *Appointment Confirmed*';
      statusNote = 'Your appointment has been approved. Please arrive 10-15 minutes prior to your consultation time.';
      break;
    case 'cancelled':
      eventTitle = '❌ *Appointment Cancelled*';
      statusNote = 'Your appointment has been cancelled. For queries or rescheduling, please contact the clinic.';
      break;
    case 'status_update':
      eventTitle = `ℹ️ *Appointment Status Update: ${appointment.status}*`;
      statusNote = `Status has been updated to: ${appointment.status}.`;
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

function formatHospitalMessage(payload: NotificationPayload): string {
  const { event, appointment, doctor } = payload;
  return `🔔 *Zubair Medical Complex - Reception Alert*
*Event:* ${event.toUpperCase()}

• *Appointment ID:* ${appointment.appointment_id}
• *Patient:* ${appointment.patient_name} (Age: ${appointment.age}, Gender: ${appointment.gender})
• *Phone:* ${appointment.phone} | *WhatsApp:* ${appointment.whatsapp}
• *Doctor:* ${doctor.name} (${doctor.specialty})
• *Date:* ${appointment.appointment_date}
• *Time:* ${appointment.appointment_time}
• *Status:* ${appointment.status}
${appointment.notes ? `• *Patient Notes:* ${appointment.notes}` : ''}`;
}

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

export async function sendAppointmentNotifications(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const settings = storage.getSettings();
  const enabled = settings.notifications_enabled !== 'false';
  const hospitalNumber = settings.hospital_notification_number || '+92 315 6621341';
  const provider = (settings.messaging_provider || 'mock').toLowerCase();

  const patientMsg = formatPatientMessage(payload, hospitalNumber);
  const hospitalMsg = formatHospitalMessage(payload);

  if (!enabled) {
    return {
      success: true,
      channel: 'mock',
      patientNotified: false,
      hospitalNotified: false,
      patientError: 'Notifications disabled in settings'
    };
  }

  const patientPhone = payload.appointment.whatsapp || payload.appointment.phone;
  let patientSuccess = false;
  let hospitalSuccess = false;
  let patientErr: string | undefined;
  let hospitalErr: string | undefined;

  // 1. Meta WhatsApp Cloud API
  if (provider === 'meta_whatsapp') {
    const phoneId = settings.meta_whatsapp_phone_number_id || process.env.META_WHATSAPP_PHONE_ID;
    const token = settings.meta_whatsapp_token || process.env.META_WHATSAPP_TOKEN;

    if (phoneId && token) {
      const patRes = await sendMetaWhatsAppMessage(patientPhone, patientMsg, phoneId, token);
      patientSuccess = patRes.success;
      patientErr = patRes.error;

      const hospRes = await sendMetaWhatsAppMessage(hospitalNumber, hospitalMsg, phoneId, token);
      hospitalSuccess = hospRes.success;
      hospitalErr = hospRes.error;
    } else {
      patientErr = 'Meta WhatsApp credentials missing; fell back to simulated mock dispatch.';
    }
  }

  // 2. Twilio API
  else if (provider === 'twilio') {
    const sid = settings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
    const auth = settings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
    const fromNum = settings.twilio_from_number || process.env.TWILIO_FROM_NUMBER;

    if (sid && auth && fromNum) {
      const patRes = await sendTwilioMessage(patientPhone, patientMsg, sid, auth, fromNum);
      patientSuccess = patRes.success;
      patientErr = patRes.error;

      const hospRes = await sendTwilioMessage(hospitalNumber, hospitalMsg, sid, auth, fromNum);
      hospitalSuccess = hospRes.success;
      hospitalErr = hospRes.error;
    } else {
      patientErr = 'Twilio credentials missing; fell back to simulated mock dispatch.';
    }
  }

  // 3. Fallback / Mock Mode (Production-ready abstraction with logging)
  if (!patientSuccess && !patientErr?.includes('credentials missing')) {
    // Already failed via live API
  } else {
    // Mock simulation
    patientSuccess = true;
    hospitalSuccess = true;
  }

  // Record into Notification Logs for audit and Admin UI inspection
  storage.addNotificationLog({
    appointment_id: payload.appointment.appointment_id,
    recipient_type: 'patient',
    recipient_number: patientPhone,
    event: payload.event,
    channel: provider === 'meta_whatsapp' ? 'whatsapp' : provider === 'twilio' ? 'sms' : 'mock',
    message: patientMsg,
    status: patientSuccess ? (provider === 'mock' ? 'simulated' : 'sent') : 'failed'
  });

  storage.addNotificationLog({
    appointment_id: payload.appointment.appointment_id,
    recipient_type: 'hospital',
    recipient_number: hospitalNumber,
    event: payload.event,
    channel: provider === 'meta_whatsapp' ? 'whatsapp' : provider === 'twilio' ? 'sms' : 'mock',
    message: hospitalMsg,
    status: hospitalSuccess ? (provider === 'mock' ? 'simulated' : 'sent') : 'failed'
  });

  return {
    success: patientSuccess,
    channel: (provider as any) || 'mock',
    patientNotified: patientSuccess,
    hospitalNotified: hospitalSuccess,
    patientError: patientErr,
    hospitalError: hospitalErr
  };
}
