import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';
import { sendAppointmentNotifications } from '@/lib/notifications';
import { generateDoctorSlotsForDate } from '@/lib/slots';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Staff login required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId') || undefined;
    const date = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const appointments = storage.getAppointments({ doctorId, date, status, search });
    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      patient_name,
      phone,
      whatsapp,
      email,
      age,
      gender,
      doctor_id,
      appointment_date,
      appointment_time,
      specialty,
      notes
    } = body;

    // Strict validation
    if (!patient_name || !patient_name.trim()) {
      return NextResponse.json({ error: 'Patient Full Name is required.' }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone Number is required.' }, { status: 400 });
    }
    if (!whatsapp || !whatsapp.trim()) {
      return NextResponse.json({ error: 'WhatsApp Number is required.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid Email Address is required.' }, { status: 400 });
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      return NextResponse.json({ error: 'Please provide a valid Patient Age (1 - 120).' }, { status: 400 });
    }
    if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
      return NextResponse.json({ error: 'Please select a valid Gender.' }, { status: 400 });
    }
    if (!doctor_id) {
      return NextResponse.json({ error: 'Selected Doctor is required.' }, { status: 400 });
    }
    if (!appointment_date || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
      return NextResponse.json({ error: 'A valid Appointment Date (YYYY-MM-DD) is required.' }, { status: 400 });
    }
    if (!appointment_time) {
      return NextResponse.json({ error: 'Appointment Time slot is required.' }, { status: 400 });
    }

    // Verify doctor exists & active
    const doctor = storage.getDoctorById(doctor_id);
    if (!doctor || !doctor.active) {
      return NextResponse.json({ error: 'Selected doctor is not available.' }, { status: 400 });
    }

    // Doctor specific scheduling rules validation
    const schedules = storage.getSchedules(doctor_id);
    const existing = storage.getAppointments({ doctorId: doctor_id, date: appointment_date });
    const slotCheck = generateDoctorSlotsForDate(appointment_date, schedules, existing);

    if (slotCheck.isOffDay) {
      return NextResponse.json(
        { error: `${doctor.name} is not available on ${slotCheck.dayName}s.` },
        { status: 400 }
      );
    }

    // Verify the requested time exists in allowable slots
    const targetSlot = slotCheck.slots.find(
      s => s.time.toUpperCase() === appointment_time.trim().toUpperCase()
    );

    if (!targetSlot) {
      return NextResponse.json(
        { error: `The selected time slot (${appointment_time}) is not a valid consultation time for ${doctor.name}.` },
        { status: 400 }
      );
    }

    if (!targetSlot.isAvailable) {
      return NextResponse.json(
        { error: `The slot ${appointment_time} on ${appointment_date} is already booked. Please choose another slot.` },
        { status: 409 }
      );
    }

    // Create appointment in storage
    const createResult = storage.createAppointment({
      patient_name: patient_name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim().toLowerCase(),
      age: ageNum,
      gender,
      doctor_id,
      appointment_date,
      appointment_time: targetSlot.time,
      specialty: specialty || doctor.specialty,
      notes: notes?.trim() || undefined,
      status: 'Pending',
      notification_status: 'Pending'
    });

    if (!createResult.success || !createResult.appointment) {
      return NextResponse.json(
        { error: createResult.error || 'Failed to book appointment' },
        { status: 409 }
      );
    }

    const appointment = createResult.appointment;

    // Send automatic notifications to Patient & Hospital reception
    let notificationResult = null;
    try {
      notificationResult = await sendAppointmentNotifications({
        event: 'new_appointment',
        appointment,
        doctor
      });

      // Update notification status on appointment record
      storage.updateAppointmentStatus(
        appointment.id,
        appointment.status
      );
    } catch (notifErr) {
      console.error('Notification dispatch error:', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment Submitted Successfully',
        appointment,
        notification: notificationResult
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Staff login required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') as any;

    if (id) {
      const success = storage.deleteAppointment(id);
      return NextResponse.json({ success, id });
    }

    if (status) {
      const count = storage.deleteAppointmentsByStatus(status);
      return NextResponse.json({ success: true, count, message: `${count} ${status.toLowerCase()} appointments deleted.` });
    }

    return NextResponse.json({ error: 'Specify id or status=Cancelled to delete.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
