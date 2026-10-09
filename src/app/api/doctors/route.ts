import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const doctors = storage.getDoctors(includeInactive);
    return NextResponse.json(doctors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name || !body.specialty || !body.contact) {
      return NextResponse.json({ error: 'Name, specialty, and contact are required.' }, { status: 400 });
    }

    const doctor = storage.createDoctor({
      name: body.name,
      qualification: body.qualification || undefined,
      specialty: body.specialty,
      contact: body.contact,
      social_media: body.social_media || undefined,
      active: body.active ?? true
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
