const fs = require('fs');
const file = 'C:/Users/Infinity Touch Store/Desktop/zubairmedicalcompexjhelum/src/app/api/appointments/[id]/route.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `   const previousStatus = current.status;
    const updated = storage.updateAppointmentStatus(current.id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    // If status changed to Booked/Confirmed or Cancelled/Checked, automatically trigger notification
    let notifResult = null;
    if (previousStatus !== status && (status === 'Booked' || status === 'Confirmed' || status === 'Cancelled' || status === 'Checked')) {
      const doctor = storage.getDoctorById(updated.doctor_id);
      if (doctor) {
        try {
          const event =
            status === 'Booked' || status === 'Confirmed'
              ? 'confirmed'
              : status === 'Cancelled'
              ? 'cancelled'
              : 'status_update';

          notifResult = await sendAppointmentNotifications(
            {\n              event,
              appointment: updated,
              doctor,
              customNotes
            }
          );
        } catch (e) {
          console.error('StatUs notification error:', e);
        }
      }
    }`;

const replacement = `    const previousStatus = current.status;
    const isConfirmation = status === 'Confirmed' || status === 'Booked';
    const wasAlreadyConfirmed = previousStatus === 'Confirmed' || previousStatus === 'Booked';

    // 1. Update the appointment status to Confirmed (or requested status) in the database first
    const updated = storage.updateAppointmentStatus(current.id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    // 2. Prevent duplicate confirmation messages when receptionist clicks Confirm repeatedly
    if (isConfirmation && wasAlreadyConfirmed) {
      return NextResponse.json({
        success: true,
        appointment: updated,
        message: 'Appointment is already confirmed. Duplicate notification prevented.',
        duplicatePrevented: true
      });
    }

    // 3. Send notifications only after database update succeeds
    let notifResult = null;
    if (isConfirmation || (previousStatus !== status && (status === 'Cancelled' || status === 'Checked'))) {
      const doctor = storage.getDoctorById(updated.doctor_id);
      if (doctor) {
        try {
          const event = isConfirmation
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
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Successfully patched appointments/[id]/route.ts');
} else {
  console.log('Target block not found in appointments/[id]/route.ts');
}