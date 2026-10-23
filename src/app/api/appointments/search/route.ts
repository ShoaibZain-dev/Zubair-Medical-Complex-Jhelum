import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// Privacy fix: the public appointment-status lookup must never enumerate
// records. Only an exact appointment ID (e.g. ZMC-12345) or a full phone
// number returns a result, and phone numbers are always masked.

function normalizePhone(p: string): string {
  let d = (p || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('92')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}

function isExactLookup(q: string): boolean {
  const t = q.trim();
  if (/^ZMC-\d+$/i.test(t)) return true;
  // Phone-like input only (digits, spaces, +, -) with a full-length number
  if (!/^[\d\s+-]+$/.test(t)) return false;
  const d = normalizePhone(t);
  return d.length >= 10 && d.length <= 13;
}

function maskPhone(p: string): string {
  const d = (p || '').replace(/\D/g, '');
  if (!d) return p;
  return '***' + d.slice(-3);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    const q = query.trim();

    // Block prefix/partial queries (e.g. q=ZMC) that would list everyone.
    if (!isExactLookup(q)) {
      return NextResponse.json({ results: [] });
    }

    const appointments = storage.searchAppointments(q);
    const doctors = storage.getDoctors(true);
    const doctorMap = new Map(doctors.map(d => [d.id, d]));

    const qId = q.toLowerCase();
    const qPhone = normalizePhone(q);

    // Defense in depth: keep only true exact matches.
    const exact = appointments.filter(a => {
      if (a.appointment_id && a.appointment_id.toLowerCase() === qId) return true;
      if (qPhone && normalizePhone(a.phone || '') === qPhone) return true;
      if (qPhone && normalizePhone(a.whatsapp || '') === qPhone) return true;
      return false;
    });

    const results = exact.map(a => {
      const doc = doctorMap.get(a.doctor_id);
      return {
        id: a.id,
        appointment_id: a.appointment_id,
        patient_name: a.patient_name,
        phone: maskPhone(a.phone),
        whatsapp: maskPhone(a.whatsapp),
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
