import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';
import { isHospitalAdminOrAbove } from '@/types';
import { deleteDoctorPhotoFromSupabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = storage.getDoctorById(params.id);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const schedules = storage.getSchedules(params.id);
    return NextResponse.json({ doctor, schedules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionUser();
    if (!session || !isHospitalAdminOrAbove(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Hospital Admin or Super Admin access required.' }, { status: 403 });
    }

    const existingDoctor = storage.getDoctorById(params.id);
    if (!existingDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const body = await request.json();

    // If avatar_url changed or was removed, clean up old photo from Supabase if applicable
    if (existingDoctor.avatar_url && body.avatar_url !== undefined && body.avatar_url !== existingDoctor.avatar_url) {
      deleteDoctorPhotoFromSupabase(existingDoctor.avatar_url);
    }

    const updated = storage.updateDoctor(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update doctor' }, { status: 400 });
    }

    return NextResponse.json(updated);
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
    if (!session || !isHospitalAdminOrAbove(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Hospital Admin or Super Admin access required.' }, { status: 403 });
    }

    const existingDoctor = storage.getDoctorById(params.id);
    if (!existingDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const result = storage.deleteDoctor(params.id);

    // If completely deleted and had avatar, clean up photo
    if (result.success && !result.deactivated && existingDoctor.avatar_url) {
      deleteDoctorPhotoFromSupabase(existingDoctor.avatar_url);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

