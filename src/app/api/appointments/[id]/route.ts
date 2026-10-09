import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';
import { sendAppointmentNotifications } from '@/lib/notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = storage.getAppointmentById(params.id);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const doctor = storage.getDoctorById(appointment.doctor_id);
    return NextResponse.json({ appointment, doctor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Staff login required.' }, { status: 401 });
    }

    const body = await request.json();
    const { status, customNotes } = body;

    if (!status || !['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required.' }, { status: 400 });
    }

    const current = storage.getAppointmentById(params.id);
    if (!current) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const previousStatus = current.status;
    const updated = storage.updateAppointmentStatus(current.id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    // If status changed to Confirmed or Cancelled, automatically trigger notification
    let notifResult = null;
    if (previousStatus !== status && (status === 'Confirmed' || status === 'Cancelled' || status === 'Completed')) {
      const doctor = storage.getDoctorById(updated.doctor_id);
      if (doctor) {
        try {
          const event =
            status === 'Confirmed'
              ? 'confirmed'
              : status === 'Cancelled'
              ? 'cancelled'
              : 'status_update';

          notifResult = await sendAppointmentNotifications({
            event,
            appointment: updated,
            doctor,
            customNotes
          });
        } catch (e) {
          console.error('Status notification error:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updated,
      notification: notifResult
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Staff login required.' }, { status: 401 });
    }

    const current = storage.getAppointmentById(params.id);
    if (!current) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const success = storage.deleteAppointment(current.id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Appointment ${current.appointment_id} deleted successfully.`,
      deletedId: current.id
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
