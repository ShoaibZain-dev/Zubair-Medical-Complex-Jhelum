import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';
import { isHospitalAdminOrAbove, DayOfWeek } from '@/types';

const VALID_DAYS: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function checkShiftOverlap(
  doctorId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): boolean {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  const existingSchedules = storage.getSchedules(doctorId).filter(
    s => s.active && 
         s.day_of_week.toLowerCase() === dayOfWeek.toLowerCase() &&
         (!excludeScheduleId || s.id !== excludeScheduleId)
  );

  for (const s of existingSchedules) {
    const sStart = timeToMinutes(s.start_time);
    const sEnd = timeToMinutes(s.end_time);
    // Two shifts overlap if newStart < sEnd && newEnd > sStart
    if (newStart < sEnd && newEnd > sStart) {
      return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const schedules = storage.getSchedules(doctorId || undefined);
    return NextResponse.json(schedules);
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
    const { doctor_id, day_of_week, period, start_time, end_time, slot_duration, active } = body;

    if (!doctor_id || !day_of_week || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'doctor_id, day_of_week, start_time, and end_time are required.' 
      }, { status: 400 });
    }

    const doctor = storage.getDoctorById(doctor_id);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }

    const normalizedDay = VALID_DAYS.find(d => d.toLowerCase() === day_of_week.toLowerCase());
    if (!normalizedDay) {
      return NextResponse.json({ error: 'Invalid day of week.' }, { status: 400 });
    }

    const startMins = timeToMinutes(start_time);
    const endMins = timeToMinutes(end_time);
    if (isNaN(startMins) || isNaN(endMins) || startMins >= endMins) {
      return NextResponse.json({ error: 'Start time must be strictly before end time.' }, { status: 400 });
    }

    const duration = parseInt(slot_duration, 10) || 30;
    if (duration <= 0 || duration > (endMins - startMins)) {
      return NextResponse.json({ 
        error: `Invalid slot duration (${duration} mins). It must be positive and fit within the shift window.` 
      }, { status: 400 });
    }

    // Overlap validation
    const isActive = active !== undefined ? Boolean(active) : true;
    if (isActive && checkShiftOverlap(doctor_id, normalizedDay, start_time, end_time)) {
      return NextResponse.json({ 
        error: `This shift (${start_time} - ${end_time}) overlaps with an existing shift for this doctor on ${normalizedDay}.` 
      }, { status: 409 });
    }

    const newSchedule = storage.createSchedule({
      doctor_id,
      day_of_week: normalizedDay,
      period: period === 'evening' ? 'evening' : period === 'morning' ? 'morning' : 'general',
      start_time,
      end_time,
      slot_duration: duration,
      active: isActive
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || !isHospitalAdminOrAbove(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Hospital Admin or Super Admin access required.' }, { status: 403 });
    }

    const body = await request.json();

    // Check if bulk slot duration update
    if (body.doctorId && body.slot_duration && !body.id) {
      const docSchedules = storage.getSchedules(body.doctorId);
      const newDuration = Number(body.slot_duration);
      for (const sch of docSchedules) {
        storage.updateSchedule(sch.id, { slot_duration: newDuration });
      }
      return NextResponse.json({ success: true, updatedCount: docSchedules.length });
    }

    const { id, updates } = body;
    if (!id || !updates) {
      return NextResponse.json({ error: 'Schedule ID and updates required' }, { status: 400 });
    }

    // If day or times are updated, validate overlap
    if (updates.start_time && updates.end_time) {
      const startMins = timeToMinutes(updates.start_time);
      const endMins = timeToMinutes(updates.end_time);
      if (startMins >= endMins) {
        return NextResponse.json({ error: 'Start time must be strictly before end time.' }, { status: 400 });
      }

      const allSchedules = storage.getSchedules();
      const existing = allSchedules.find(s => s.id === id);
      if (existing) {
        const targetDoctor = existing.doctor_id;
        const targetDay = (updates.day_of_week as DayOfWeek) || existing.day_of_week;
        if ((updates.active ?? existing.active) && checkShiftOverlap(targetDoctor, targetDay, updates.start_time, updates.end_time, id)) {
          return NextResponse.json({ 
            error: `Updated shift hours overlap with another active shift on ${targetDay}.` 
          }, { status: 409 });
        }
      }
    }

    const updated = storage.updateSchedule(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || !isHospitalAdminOrAbove(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Hospital Admin or Super Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const success = storage.deleteSchedule(id);
    if (!success) {
      return NextResponse.json({ error: 'Schedule not found or could not be deleted.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Schedule entry deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
