import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    const appointments = storage.searchAppointments(query);
    const doctors = storage.getDoctors(true);
    const doctorMap = new Map(doctors.map(d => [d.id, d]));

    // Format safe patient response
    const results = appointments.map(a => {
      const doc = doctorMap.get(a.doctor_id);
      return {
        id: a.id,
        appointment_id: a.appointment_id,
        patient_name: a.patient_name,
        phone: a.phone,
        whatsapp: a.whatsapp,
        doctor_name: doc ? doc.name : 'Consultant',
        specialty: a.specialty,
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
        status: a.status,
        created_at: a.created_at
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
