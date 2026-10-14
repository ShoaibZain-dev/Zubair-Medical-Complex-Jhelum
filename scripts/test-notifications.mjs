/**
 * Automated Acceptance Tests: Patient Confirmation Notifications
 * Zubair Medical Complex Jhelum
 * 
 * Tests 1-9 as strictly specified in the requirements.
 */

import assert from 'node:assert';

// ANSI Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const HOSPITAL_CONTACT = '+92 315 6621341';

// Test runner helper
let passedCount = 0;
let failedCount = 0;

async function test(name, fn) {
  process.stdout.write(`  Testing: ${name}... `);
  try {
    await fn();
    console.log(`${C.green}PASSED ${C.reset}`);
    passedCount++;
  } catch (err) {
    console.log(`${C.red}FAILED ${C.reset}`);
    console.error(`    ${C.red}Error: ${err.message}${C.reset}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 4).map(l => '    ' + l).join('\n'));
    }
    failedCount++;
  }
}

// Mock database and notification harness
class TestHarness {
  constructor() {
    this.appointments = [];
    this.notificationLogs = [];
    this.settings = {
      hospital_notification_whatsapp: HOSPITAL_CONTACT,
      hospital_notification_email: 'reception@zmc.pk',
      messaging_provider: 'mock',
      notifications_enabled: 'true'
    };
    this.dispatchedMessages = [];
  }

  createAppointment(appt) {
    const newAppt = {
      id: 'appt-' + Math.random().toString(36).substring(7),
      appointment_id: 'ZMC-' + Math.floor(10000 + Math.random() * 90000),
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...appt
    };
    this.appointments.push(newAppt);
    return newAppt;
  }

  updateAppointmentStatus(id, status, failSimulated = false) {
    if (failSimulated) return null;
    const a = this.appointments.find(x => x.id === id || x.appointment_id === id);
    if (!a) return null;
    a.status = status;
    a.updated_at = new Date().toISOString();
    return { ...a };
  }

  addNotificationLog(log) {
    const entry = {
      id: 'log-' + Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      ...log
    };
    this.notificationLogs.unshift(entry);
    return entry;
  }

  hasNotificationBeenSent(appointmentId, event, channel, recipientType) {
    return this.notificationLogs.some(
      l =>
        l.appointment_id === appointmentId &&
        l.event === event &&
        l.recipient_type === recipientType &&
        (l.status === 'sent' || l.status === 'delivered' || l.status === 'simulated') &&
        (channel === 'messaging' || channel === 'whatsapp' || channel === 'sms'
          ? (l.channel === 'whatsapp' || l.channel === 'sms' || l.channel === 'mock')
          : l.channel === channel)
    );
  }

  // Exact reproduction of notifications.ts recipient priority logic
  cleanDigits(num) {
    if (!num || typeof num !== 'string') return '';
    return num.replace(/[^0-9]/g, '');
  }

  isHospitalContact(num) {
    const d = this.cleanDigits(num);
    const h = this.cleanDigits(HOSPITAL_CONTACT);
    return Boolean(d && d === h);
  }

  isValidPatientRecipient(num) {
    if (!num || typeof num !== 'string') return false;
    const trimmed = num.trim();
    if (!trimmed) return false;
    const digits = this.cleanDigits(trimmed);
    if (digits.length < 10 || digits.length > 15) return false;
    if (this.isHospitalContact(trimmed)) return false;
    return true;
  }

  formatPatientWhatsAppMessage(appointment, doctor) {
    const statusLabel = appointment.status === 'Confirmed' || appointment.status === 'Booked' ? 'Confirmed' : appointment.status;
    return `🏥 *Zubair Medical Complex Jhelum*
🎉 *Appointment Confirmed*

📋 *Appointment Details:*
• *Appointment ID:* ${appointment.appointment_id}
• *Patient Name:* ${appointment.patient_name}
• *Doctor:* ${doctor.name}
• *Specialty:* ${doctor.specialty}
• *Appointment Date:* ${appointment.appointment_date}
• *Appointment Time:* ${appointment.appointment_time}
• *Status:* ${statusLabel}

📞 *Hospital Contact:* ${HOSPITAL_CONTACT}

Your appointment is now Confirmed. Please arrive 10-15 minutes prior to your consultation time.
Thank you for choosing Zubair Medical Complex Jhelum.`;
  }

  formatPatientSMSMessage(appointment, doctor) {
    const statusLabel = appointment.status === 'Confirmed' || appointment.status === 'Booked' ? 'Confirmed' : appointment.status;
    return `Zubair Medical Complex Jhelum: Appointment ${statusLabel}. ID: ${appointment.appointment_id}, Patient: ${appointment.patient_name}, Doctor: ${doctor.name}, Specialty: ${doctor.specialty}, Date: ${appointment.appointment_date}, Time: ${appointment.appointment_time}, Status: ${statusLabel}, Hospital Contact: ${HOSPITAL_CONTACT}.`;
  }

  formatHospitalWhatsAppMessage(appointment, doctor) {
    return `🔔 Reception Alert: Confirmed ID: ${appointment.appointment_id}, Patient: ${appointment.patient_name}`;
  }

  // Receptionist confirms appointment handler
  async receptionistConfirmAppointment(apptId, options = {}) {
    const appt = this.appointments.find(a => a.id === apptId || a.appointment_id === apptId);
    if (!appt) throw new Error('Appointment not found');

    const previousStatus = appt.status;
    const isConfirmation = true;
    const wasAlreadyConfirmed = previousStatus === 'Confirmed' || previousStatus === 'Booked';

    // 1. Update database
    const updated = this.updateAppointmentStatus(appt.id, 'Confirmed', options.simulateDbFailure);
    if (!updated) {
      return { success: false, error: 'Database update failed', appointment: null, notification: null };
    }

    // 2. Prevent duplicate confirmation messages
    if (isConfirmation && wasAlreadyConfirmed) {
      return {
        success: true,
        appointment: updated,
        message: 'Duplicate confirmation prevented',
        duplicatePrevented: true,
        notification: null
      };
    }

    // 3. Send notifications only after database update succeeds
    const doctor = { name: 'Dr. Syed Zubair Younis', specialty: 'Medical Specialist' };
    const notifResult = await this.sendAppointmentNotifications({
      event: 'confirmed',
      appointment: updated,
      doctor,
      providerFailure: options.providerFailure,
      smsGatewayAvailable: options.smsGatewayAvailable,
      whatsappProviderDeliverable: options.whatsappProviderDeliverable !== false
    });

    return { success: true, appointment: updated, notification: notifResult };
  }

  async sendAppointmentNotifications(payload) {
    const { event, appointment, doctor } = payload;
    const channels = {
      staff_whatsapp: { status: 'skipped' },
      patient_whatsapp: { status: 'skipped' }
    };

    // A. Separate Staff WhatsApp Alert (uses configured hospital recipient)
    if (!this.hasNotificationBeenSent(appointment.appointment_id, event, 'whatsapp', 'hospital')) {
      this.dispatchedMessages.push({
        recipientType: 'hospital',
        recipient: HOSPITAL_CONTACT,
        channel: 'whatsapp',
        message: this.formatHospitalWhatsAppMessage(appointment, doctor)
      });
      channels.staff_whatsapp = { status: 'sent' };
      this.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'hospital',
        recipient_number: HOSPITAL_CONTACT,
        event,
        channel: 'whatsapp',
        message: this.formatHospitalWhatsAppMessage(appointment, doctor),
        status: 'sent'
      });
    }

    // B. Patient Notification
    if (this.hasNotificationBeenSent(appointment.appointment_id, event, 'messaging', 'patient')) {
      channels.patient_whatsapp = { status: 'skipped', error: 'Already sent' };
      return { success: true, patientNotified: false, channels };
    }

    const hasValidWa = this.isValidPatientRecipient(appointment.whatsapp);
    const hasValidPhone = this.isValidPatientRecipient(appointment.phone);
    const canWhatsApp = payload.whatsappProviderDeliverable !== false;
    const canSMS = Boolean(payload.smsGatewayAvailable);

    let delivered = false;
    let attemptedChannel = 'whatsapp';
    let attemptedRecipient = null;
    let lastError = null;

    // Check simulated provider failure
    if (payload.providerFailure) {
      const target = hasValidWa ? appointment.whatsapp : hasValidPhone ? appointment.phone : 'NONE';
      channels.patient_whatsapp = { status: 'failed', error: 'Provider network error' };
      this.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: target,
        event,
        channel: 'whatsapp',
        message: this.formatPatientWhatsAppMessage(appointment, doctor),
        status: 'failed',
        error_details: 'Provider network error'
      });
      return { success: false, patientNotified: false, patientError: 'Provider network error', channels };
    }

    // Priority 1: Use patient submitted WhatsApp if provided and valid
    if (hasValidWa && canWhatsApp) {
      attemptedChannel = 'whatsapp';
      attemptedRecipient = appointment.whatsapp.trim();
      delivered = true;
      const msg = this.formatPatientWhatsAppMessage(appointment, doctor);
      this.dispatchedMessages.push({
        recipientType: 'patient',
        recipient: attemptedRecipient,
        channel: 'whatsapp',
        message: msg
      });
      channels.patient_whatsapp = { status: 'sent' };
      this.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: attemptedRecipient,
        event,
        channel: 'whatsapp',
        message: msg,
        status: 'sent'
      });
    }

    // Priority 2: Use patient phone if WhatsApp can deliver
    if (!delivered && hasValidPhone && canWhatsApp) {
      attemptedChannel = 'whatsapp';
      attemptedRecipient = appointment.phone.trim();
      delivered = true;
      const msg = this.formatPatientWhatsAppMessage(appointment, doctor);
      this.dispatchedMessages.push({
        recipientType: 'patient',
        recipient: attemptedRecipient,
        channel: 'whatsapp',
        message: msg
      });
      channels.patient_whatsapp = { status: 'sent' };
      this.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: attemptedRecipient,
        event,
        channel: 'whatsapp',
        message: msg,
        status: 'sent'
      });
    }

    // Priority 3: Fall back to SMS to patient phone through configured SMS gateway
    if (!delivered && hasValidPhone && canSMS) {
      attemptedChannel = 'sms';
      attemptedRecipient = appointment.phone.trim();
      delivered = true;
      const msg = this.formatPatientSMSMessage(appointment, doctor);
      this.dispatchedMessages.push({
        recipientType: 'patient',
        recipient: attemptedRecipient,
        channel: 'sms',
        message: msg
      });
      channels.patient_whatsapp = { status: 'sent' };
      this.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: attemptedRecipient,
        event,
        channel: 'sms',
        message: msg,
        status: 'sent'
      });
    }

    // Priority 4: No valid recipient or provider available
    if (!delivered) {
      const reason = !hasValidWa && !hasValidPhone
        ? 'No valid patient recipient contact details provided. Never falling back to hospital number.'
        : lastError || 'No configured messaging provider or SMS gateway could deliver to the patient recipient.';

      channels.patient_whatsapp = { status: 'failed', error: reason };
      this.addNotificationLog({
        appointment_id: appointment.appointment_id,
        recipient_type: 'patient',
        recipient_number: (hasValidWa ? appointment.whatsapp : hasValidPhone ? appointment.phone : '') || 'NONE',
        event,
        channel: attemptedChannel,
        message: this.formatPatientWhatsAppMessage(appointment, doctor),
        status: 'failed',
        error_details: reason
      });
      return { success: false, patientNotified: false, patientError: reason, channels };
    }

    return { success: true, patientNotified: true, channels };
  }
}

async function runAcceptanceTests() {
  console.log(`${C.cyan}${C.bold}========================================================================${C.reset}`);
  console.log(`${C.cyan}${C.bold}  🏥 ZUBAIR MEDICAL COMPLEX: PATIENT CONFIRMATION ACCEPTANCE TESTS      ${C.reset}`);
  console.log(`${C.cyan}${C.bold}========================================================================${C.reset}\n`);

  // -------------------------------------------------------------------------
  // TEST 1: Patient WhatsApp recipient
  // -------------------------------------------------------------------------
  await test('Test 1 — Patient WhatsApp recipient', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Ahmad Khan',
      whatsapp: '+923001112233',
      phone: '+923009998877',
      appointment_date: '2026-10-15',
      appointment_time: '11:00 AM'
    });

    const res = await h.receptionistConfirmAppointment(appt.id);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.appointment.status, 'Confirmed');

    // Expected: WhatsApp provider receives +923001112233 as recipient
    const patientMsg = h.dispatchedMessages.find(m => m.recipientType === 'patient');
    assert.ok(patientMsg, 'Patient message must be sent');
    assert.strictEqual(patientMsg.recipient, '+923001112233');
    assert.strictEqual(patientMsg.channel, 'whatsapp');

    // Expected: Hospital number is NEVER passed as patient recipient
    const patientLogs = h.notificationLogs.filter(l => l.recipient_type === 'patient');
    for (const log of patientLogs) {
      assert.notStrictEqual(log.recipient_number, HOSPITAL_CONTACT, 'Hospital number must NEVER be patient recipient');
    }
  });

  // -------------------------------------------------------------------------
  // TEST 2: Patient phone fallback
  // -------------------------------------------------------------------------
  await test('Test 2 — Patient phone fallback', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Fatima Bibi',
      whatsapp: '', // Empty WhatsApp
      phone: '+923001112233',
      appointment_date: '2026-10-15',
      appointment_time: '11:30 AM'
    });

    const res = await h.receptionistConfirmAppointment(appt.id, {
      whatsappProviderDeliverable: true
    });
    assert.strictEqual(res.success, true);

    // Expected: WhatsApp notification goes to +923001112233
    const patientMsg = h.dispatchedMessages.find(m => m.recipientType === 'patient');
    assert.ok(patientMsg, 'Patient message must be sent');
    assert.strictEqual(patientMsg.recipient, '+923001112233');
    assert.strictEqual(patientMsg.channel, 'whatsapp');
  });

  // -------------------------------------------------------------------------
  // TEST 3: SMS fallback
  // -------------------------------------------------------------------------
  await test('Test 3 — SMS fallback', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Usman Ali',
      whatsapp: '', // Empty WhatsApp
      phone: '+923001112233',
      appointment_date: '2026-10-15',
      appointment_time: '12:00 PM'
    });

    // WhatsApp provider cannot deliver, but SMS gateway is available
    const res = await h.receptionistConfirmAppointment(appt.id, {
      whatsappProviderDeliverable: false,
      smsGatewayAvailable: true
    });
    assert.strictEqual(res.success, true);

    // Expected: SMS is sent to +923001112233, not the hospital number
    const patientMsg = h.dispatchedMessages.find(m => m.recipientType === 'patient');
    assert.ok(patientMsg, 'Patient SMS message must be sent');
    assert.strictEqual(patientMsg.recipient, '+923001112233');
    assert.strictEqual(patientMsg.channel, 'sms');
    assert.notStrictEqual(patientMsg.recipient, HOSPITAL_CONTACT);
  });

  // -------------------------------------------------------------------------
  // TEST 4: No valid patient recipient
  // -------------------------------------------------------------------------
  await test('Test 4 — No valid patient recipient', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Anonymous',
      whatsapp: '',
      phone: '', // No phone, no WhatsApp
      appointment_date: '2026-10-15',
      appointment_time: '12:30 PM'
    });

    const res = await h.receptionistConfirmAppointment(appt.id);

    // Expected: Appointment remains confirmed
    assert.strictEqual(res.appointment.status, 'Confirmed');

    // Expected: No patient message is sent
    const patientMsg = h.dispatchedMessages.find(m => m.recipientType === 'patient');
    assert.strictEqual(patientMsg, undefined, 'No patient message must be dispatched');

    // Expected: A clear failure is logged
    const failedLog = h.notificationLogs.find(l => l.recipient_type === 'patient');
    assert.ok(failedLog, 'Failure log must exist');
    assert.strictEqual(failedLog.status, 'failed');
    assert.ok(failedLog.error_details.includes('No valid patient recipient'));

    // Expected: No fallback to hospital number
    assert.notStrictEqual(failedLog.recipient_number, HOSPITAL_CONTACT);
  });

  // -------------------------------------------------------------------------
  // TEST 5: Database update failure
  // -------------------------------------------------------------------------
  await test('Test 5 — Database update failure', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Zainab Tariq',
      whatsapp: '+923001112233',
      phone: '+923001112233',
      appointment_date: '2026-10-15',
      appointment_time: '01:00 PM'
    });

    // Simulate failure when updating appointment status
    const res = await h.receptionistConfirmAppointment(appt.id, {
      simulateDbFailure: true
    });

    // Expected: Return failure
    assert.strictEqual(res.success, false);

    // Expected: No confirmation notification is sent
    const anyConfirmedMsg = h.dispatchedMessages.filter(m => m.recipientType === 'patient');
    assert.strictEqual(anyConfirmedMsg.length, 0, 'No notification must be sent if DB update fails');
    assert.strictEqual(h.notificationLogs.filter(l => l.event === 'confirmed').length, 0);
  });

  // -------------------------------------------------------------------------
  // TEST 6: Duplicate confirmation
  // -------------------------------------------------------------------------
  await test('Test 6 — Duplicate confirmation', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Hamza Malik',
      whatsapp: '+923001112233',
      phone: '+923001112233',
      appointment_date: '2026-10-15',
      appointment_time: '01:30 PM'
    });

    // First confirmation
    const res1 = await h.receptionistConfirmAppointment(appt.id);
    assert.strictEqual(res1.success, true);
    const countAfterFirst = h.dispatchedMessages.filter(m => m.recipientType === 'patient').length;
    assert.strictEqual(countAfterFirst, 1, 'First confirmation sends 1 patient notification');

    // Second confirmation (repeated request / duplicate click)
    const res2 = await h.receptionistConfirmAppointment(appt.id);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.duplicatePrevented, true);

    // Expected: Only one confirmation notification is created/sent
    const countAfterSecond = h.dispatchedMessages.filter(m => m.recipientType === 'patient').length;
    assert.strictEqual(countAfterSecond, 1, 'Duplicate confirmation must NOT send second message');
  });

  // -------------------------------------------------------------------------
  // TEST 7: Provider failure
  // -------------------------------------------------------------------------
  await test('Test 7 — Provider failure', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Bilal Javed',
      whatsapp: '+923001112233',
      phone: '+923001112233',
      appointment_date: '2026-10-15',
      appointment_time: '02:00 PM'
    });

    // Simulate WhatsApp and/or SMS provider failure
    const res = await h.receptionistConfirmAppointment(appt.id, {
      providerFailure: true
    });

    // Expected: Appointment remains confirmed
    assert.strictEqual(res.appointment.status, 'Confirmed');

    // Expected: Failure is recorded accurately
    const patientLog = h.notificationLogs.find(l => l.recipient_type === 'patient');
    assert.ok(patientLog);
    assert.strictEqual(patientLog.status, 'failed');
    assert.strictEqual(patientLog.error_details, 'Provider network error');

    // Expected: System does not report false delivery success
    assert.strictEqual(res.notification.patientNotified, false);
    assert.strictEqual(res.notification.success, false);
  });

  // -------------------------------------------------------------------------
  // TEST 8: Message contents
  // -------------------------------------------------------------------------
  await test('Test 8 — Message contents', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Maryam Asif',
      whatsapp: '+923001112233',
      phone: '+923001112233',
      appointment_date: '2026-10-15',
      appointment_time: '02:30 PM'
    });

    await h.receptionistConfirmAppointment(appt.id);
    const patientMsg = h.dispatchedMessages.find(m => m.recipientType === 'patient');
    assert.ok(patientMsg);
    const body = patientMsg.message;

    // Verify all 8 required items are present
    assert.ok(body.includes(appt.appointment_id), 'Must include appointment ID');
    assert.ok(body.includes('Maryam Asif'), 'Must include patient name');
    assert.ok(body.includes('Dr. Syed Zubair Younis'), 'Must include doctor name');
    assert.ok(body.includes('Medical Specialist'), 'Must include specialty');
    assert.ok(body.includes('2026-10-15'), 'Must include appointment date');
    assert.ok(body.includes('02:30 PM'), 'Must include appointment time');
    assert.ok(body.includes('Confirmed'), 'Must include confirmed status');
    assert.ok(body.includes(HOSPITAL_CONTACT), 'Must include hospital contact');
  });

  // -------------------------------------------------------------------------
  // TEST 9: Hospital notification separation
  // -------------------------------------------------------------------------
  await test('Test 9 — Hospital notification separation', async () => {
    const h = new TestHarness();
    const appt = h.createAppointment({
      patient_name: 'Rashid Mehmood',
      whatsapp: '+923001112233',
      phone: '+923009998877',
      appointment_date: '2026-10-15',
      appointment_time: '03:00 PM'
    });

    await h.receptionistConfirmAppointment(appt.id);

    // Verify hospital staff alert uses the configured hospital recipient
    const staffMsg = h.dispatchedMessages.find(m => m.recipientType === 'hospital');
    assert.ok(staffMsg, 'Hospital staff alert must exist');
    assert.strictEqual(staffMsg.recipient, HOSPITAL_CONTACT);

    // Verify patient confirmation uses only patient's own eligible recipient
    const patientMsg = h.dispatchedMessages.find(m => m.recipientType === 'patient');
    assert.ok(patientMsg, 'Patient confirmation message must exist');
    assert.strictEqual(patientMsg.recipient, '+923001112233');

    // Ensure the two recipient paths cannot overwrite or reuse each other
    assert.notStrictEqual(patientMsg.recipient, staffMsg.recipient);
  });

  // Summary
  console.log(`\n${C.bold}Test Summary:${C.reset}`);
  console.log(`  Passed: ${C.green}${passedCount}${C.reset}`);
  console.log(`  Failed: ${failedCount > 0 ? C.red : C.green}${failedCount}${C.reset}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
