import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { generateDoctorSlotsForDate } from '@/lib/slots';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date'); // YYYY-MM-DD

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'doctorId and date query parameters are required.' },
        { status: 400 }
      );
    }

    const doctor = storage.getDoctorById(doctorId);
    if (!doctor || !doctor.active) {
      return NextResponse.json(
        { error: 'Doctor not found or inactive.' },
        { status: 404 }
      );
    }

    const schedules = storage.getSchedules(doctorId);
    const existingAppointments = storage.getAppointments({ doctorId, date });

    const result = generateDoctorSlotsForDate(date, schedules, existingAppointments);

    return NextResponse.json({
      doctorId,
      doctorName: doctor.name,
      date,
      dayName: result.dayName,
      isOffDay: result.isOffDay,
      slots: result.slots
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
