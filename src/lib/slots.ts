import { DayOfWeek, DoctorSchedule, Appointment } from '../types';

export interface TimeSlot {
  time: string;           // "09:00 AM"
  time24: string;         // "09:00"
  period: 'morning' | 'evening';
  isAvailable: boolean;
  reason?: string;
}

const DAY_NAMES: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export function getDayOfWeekFromDateString(dateStr: string): DayOfWeek {
  // dateStr is "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return DAY_NAMES[date.getDay()];
}

export function formatTime12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  const paddedH = h < 10 ? `0${h}` : `${h}`;
  const paddedM = m < 10 ? `0${m}` : `${m}`;
  return `${paddedH}:${paddedM} ${ampm}`;
}

export function generateDoctorSlotsForDate(
  dateStr: string,
  schedules: DoctorSchedule[],
  existingAppointments: Appointment[]
): {
  dayName: DayOfWeek;
  isOffDay: boolean;
  slots: TimeSlot[];
} {
  const dayName = getDayOfWeekFromDateString(dateStr);

  // Active schedules for this specific day of week
  const daySchedules = schedules.filter(
    s => s.active && s.day_of_week.toLowerCase() === dayName.toLowerCase()
  );

  if (daySchedules.length === 0) {
    return {
      dayName,
      isOffDay: true,
      slots: []
    };
  }

  // Active appointments for this doctor on this date (exclude cancelled)
  const bookedTimes = new Set(
    existingAppointments
      .filter(a => a.appointment_date === dateStr && a.status !== 'Cancelled')
      .map(a => a.appointment_time.trim().toUpperCase())
  );

  const slots: TimeSlot[] = [];

  for (const sch of daySchedules) {
    const slotDuration = sch.slot_duration || 30;
    const [startH, startM] = sch.start_time.split(':').map(Number);
    const [endH, endM] = sch.end_time.split(':').map(Number);

    let startTotalMins = startH * 60 + startM;
    const endTotalMins = endH * 60 + endM;

    while (startTotalMins + slotDuration <= endTotalMins) {
      const curH = Math.floor(startTotalMins / 60);
      const curM = startTotalMins % 60;
      const time24 = `${curH.toString().padStart(2, '0')}:${curM.toString().padStart(2, '0')}`;
      const time12 = formatTime12Hour(time24);

      const isBooked = bookedTimes.has(time12.toUpperCase());

      slots.push({
        time: time12,
        time24,
        period: sch.period === 'evening' ? 'evening' : 'morning',
        isAvailable: !isBooked,
        reason: isBooked ? 'Slot already booked' : undefined
      });

      startTotalMins += slotDuration;
    }
  }

  // Sort slots chronologically
  slots.sort((a, b) => a.time24.localeCompare(b.time24));

  return {
    dayName,
    isOffDay: false,
    slots
  };
}
