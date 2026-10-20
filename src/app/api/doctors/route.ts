import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';
import { isHospitalAdminOrAbove } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    if (!session || !isHospitalAdminOrAbove(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Hospital Admin or Super Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name?.trim() || !body.specialty?.trim() || !body.contact?.trim()) {
      return NextResponse.json({ error: 'Name, specialty, and contact are required.' }, { status: 400 });
    }

    // Check for duplicate doctor with same name
    const existing = storage.getDoctors(true).find(
      d => d.name.trim().toLowerCase() === body.name.trim().toLowerCase()
    );
    if (existing) {
      return NextResponse.json({ error: `A doctor named "${body.name.trim()}" already exists.` }, { status: 409 });
    }

    const doctor = storage.createDoctor({
      name: body.name.trim(),
      qualification: body.qualification?.trim() || undefined,
      specialty: body.specialty.trim(),
      contact: body.contact.trim(),
      social_media: body.social_media?.trim() || undefined,
      avatar_url: body.avatar_url?.trim() || undefined,
      active: body.active !== undefined ? Boolean(body.active) : true
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

