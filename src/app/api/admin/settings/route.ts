import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const settings = storage.getSettings();

    // If receptionist, mask sensitive keys
    if (session.role !== 'Admin') {
      return NextResponse.json({
        hospital_name: settings.hospital_name,
        hospital_notification_number: settings.hospital_notification_number,
        default_slot_duration: settings.default_slot_duration
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    storage.updateMultipleSettings(body);
    return NextResponse.json({ success: true, settings: storage.getSettings() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
