import { Doctor, DoctorSchedule, DayOfWeek } from '@/types';
import { formatTime12Hour } from './slots';

const DAYS_IN_WEEK: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function urduDayName(day: string): string {
  switch (day.toLowerCase()) {
    case 'monday': return 'پیر';
    case 'tuesday': return 'منگل';
    case 'wednesday': return 'بدھ';
    case 'thursday': return 'جمعرات';
    case 'friday': return 'جمعہ';
    case 'saturday': return 'ہفتہ';
    case 'sunday': return 'اتوار';
    default: return day;
  }
}

/**
 * Returns the doctor's display name, honoring any edits made by the admin.
 * If in Urdu and the doctor still has their default English name, returns the localized Urdu name.
 */
export function getDoctorDisplayName(
  doctor?: Doctor | null,
  isUrdu: boolean = false,
  t?: (key: string) => string
): string {
  if (!doctor) return '';
  if (!isUrdu || !t) return doctor.name;

  if (doctor.id === 'doc-zubair' && doctor.name === 'Dr. Syed Zubair Younis') {
    return t('doc_zubair_name');
  }
  if (doctor.id === 'doc-fozia' && doctor.name === 'Dr. Fozia Choudhary') {
    return t('doc_fozia_name');
  }
  if (doctor.id === 'doc-arshad' && doctor.name === 'Dr. Muhammad Arshad') {
    return t('doc_arshad_name');
  }
  if (doctor.id === 'doc-umar' && doctor.name === 'Dr. Umar Farooq') {
    return t('doc_umar_name');
  }

  // Doctor was edited in admin or is a newly created doctor
  return doctor.name;
}

/**
 * Returns the doctor's display specialty, honoring any edits made by the admin.
 */
export function getDoctorDisplaySpecialty(
  doctor?: Doctor | null,
  isUrdu: boolean = false,
  t?: (key: string) => string
): string {
  if (!doctor) return '';
  if (!isUrdu || !t) return doctor.specialty;

  if (doctor.id === 'doc-zubair' && doctor.specialty === 'Medical Specialist') {
    return t('doc_zubair_specialty');
  }
  if (doctor.id === 'doc-fozia' && doctor.specialty === 'Gynecologist / Consultant') {
    return t('doc_fozia_specialty');
  }
  if (doctor.id === 'doc-arshad' && doctor.specialty === 'Rheumatologist') {
    return t('doc_arshad_specialty');
  }
  if (doctor.id === 'doc-umar' && doctor.specialty === 'Laparoscopic Surgeon') {
    return t('doc_umar_specialty');
  }

  // Doctor specialty was edited or newly created
  return doctor.specialty;
}

export interface DoctorScheduleSummary {
  days: string;
  timing: string;
  badge: string;
  activeDaysCount: number;
  hasShifts: boolean;
}

/**
 * Computes live, dynamic schedule summary directly from the doctor's active schedules.
 */
export function formatDoctorScheduleSummary(
  schedules: DoctorSchedule[] = [],
  isUrdu: boolean = false
): DoctorScheduleSummary {
  const active = schedules.filter(s => s.active);

  if (active.length === 0) {
    return {
      days: isUrdu ? 'شیڈول دستیاب نہیں' : 'Schedule Pending',
      timing: isUrdu ? 'تفصیلات کے لیے کلینک سے رابطہ کریں' : 'Contact clinic for details',
      badge: isUrdu ? 'کنسلٹنٹ' : 'Consultant',
      activeDaysCount: 0,
      hasShifts: false
    };
  }

  // Extract unique active days ordered by DAYS_IN_WEEK
  const activeDays = DAYS_IN_WEEK.filter(day =>
    active.some(s => s.day_of_week.toLowerCase() === day.toLowerCase())
  );

  let days = '';
  if (activeDays.length === 7) {
    days = isUrdu ? 'پیر تا اتوار (تمام دن)' : 'Monday – Sunday (All Days)';
  } else if (activeDays.length === 6 && !activeDays.includes('Sunday')) {
    days = isUrdu ? 'پیر تا ہفتہ (اتوار چھٹی)' : 'Monday – Saturday (Sunday Off)';
  } else if (activeDays.length === 1) {
    days = isUrdu ? `صرف ہر ${urduDayName(activeDays[0])}` : `Every ${activeDays[0]} Only`;
  } else {
    days = activeDays
      .map(d => (isUrdu ? urduDayName(d) : d.slice(0, 3)))
      .join(', ');
  }

  // Determine shift timings
  const morningShifts = active.filter(s => s.period === 'morning' || s.start_time < '14:00');
  const eveningShifts = active.filter(s => s.period === 'evening' || (s.start_time >= '14:00' && s.period !== 'morning'));

  let timing = '';
  let badge = isUrdu ? 'سپیشلسٹ' : 'Specialist';

  if (morningShifts.length > 0 && eveningShifts.length > 0) {
    const mStart = formatTime12Hour(morningShifts[0].start_time);
    const mEnd = formatTime12Hour(morningShifts[0].end_time);
    const eStart = formatTime12Hour(eveningShifts[0].start_time);
    const eEnd = formatTime12Hour(eveningShifts[0].end_time);

    timing = isUrdu
      ? `صبح: ${mStart} – ${mEnd} | شام: ${eStart} – ${eEnd}`
      : `Morning: ${mStart} – ${mEnd} | Evening: ${eStart} – ${eEnd}`;
    badge = isUrdu ? 'ڈبل شفٹ' : 'Dual Shift';
  } else if (morningShifts.length > 0) {
    const mStart = formatTime12Hour(morningShifts[0].start_time);
    const mEnd = formatTime12Hour(morningShifts[0].end_time);

    timing = isUrdu ? `صبح: ${mStart} – ${mEnd}` : `Morning: ${mStart} – ${mEnd}`;
    badge = isUrdu ? 'صبح کی شفٹ' : 'Morning Shift';
  } else if (eveningShifts.length > 0) {
    const eStart = formatTime12Hour(eveningShifts[0].start_time);
    const eEnd = formatTime12Hour(eveningShifts[0].end_time);

    timing = isUrdu ? `شام: ${eStart} – ${eEnd}` : `Evening: ${eStart} – ${eEnd}`;
    badge = isUrdu ? 'شام کی شفٹ' : 'Evening Shift';
  } else {
    const tStart = formatTime12Hour(active[0].start_time);
    const tEnd = formatTime12Hour(active[0].end_time);

    timing = `${tStart} – ${tEnd}`;
    badge = isUrdu ? 'کنسلٹنٹ' : 'Consultant';
  }

  return {
    days,
    timing,
    badge,
    activeDaysCount: activeDays.length,
    hasShifts: true
  };
}
