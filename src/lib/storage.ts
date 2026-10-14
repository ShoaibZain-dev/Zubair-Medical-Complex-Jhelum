import fs from 'fs';
import path from 'path';
import os from 'os';
import { Doctor, DoctorSchedule, Appointment, AdminUser, SocialMediaLink, SystemSetting, NotificationLog } from '../types';

// Extended NotificationLog with WhatsApp tracking fields (stored but not in public types)
interface NotificationLogExtended extends NotificationLog {
  whatsapp_message_id?: string;
  delivered_at?: string;
}

interface DatabaseData {
  doctors: Doctor[];
  schedules: DoctorSchedule[];
  appointments: Appointment[];
  users: AdminUser[];
  socialLinks: SocialMediaLink[];
  settings: Record<string, string>;
  notificationLogs: NotificationLogExtended[];
}

const PRIMARY_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PRIMARY_DB_FILE = path.join(PRIMARY_DATA_DIR, 'store.json');

const FALLBACK_DATA_DIR = os.tmpdir();
const FALLBACK_DB_FILE = path.join(FALLBACK_DATA_DIR, 'zmc_store.json');

let memoryDbData: DatabaseData | null = null;

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-zubair',
    name: 'Dr. Syed Zubair Younis',
    qualification: 'MBBS, FCPS',
    specialty: 'Medical Specialist',
    contact: '0318-3621341',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-fozia',
    name: 'Dr. Fozia Choudhary',
    specialty: 'Gynecologist / Consultant',
    contact: '0318-3621341',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-arshad',
    name: 'Dr. Muhammad Arshad',
    qualification: 'MBBS, FCPS',
    specialty: 'Rheumatologist',
    contact: '0300-3918459',
    social_media: 'zubairmedicalcomplex',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-umar',
    name: 'Dr. Umar Farooq',
    specialty: 'Laparoscopic Surgeon',
    contact: '0318-3621341',
    active: true,
    created_at: new Date().toISOString()
  }
];

const DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const INITIAL_SCHEDULES: DoctorSchedule[] = [
  // Dr. Syed Zubair Younis: Mon-Sat Morning (9:00 AM - 2:00 PM), Evening (5:00 PM - 8:00 PM), Sunday Off
  ...DAYS.map(day => ({
    id: `sch-zubair-${day.toLowerCase()}-morn`,
    doctor_id: 'doc-zubair',
    day_of_week: day,
    period: 'morning' as const,
    start_time: '09:00',
    end_time: '14:00',
    slot_duration: 30,
    active: true
  })),
  ...DAYS.map(day => ({
    id: `sch-zubair-${day.toLowerCase()}-eve`,
    doctor_id: 'doc-zubair',
    day_of_week: day,
    period: 'evening' as const,
    start_time: '17:00',
    end_time: '20:00',
    slot_duration: 30,
    active: true
  })),

  // Dr. Fozia Choudhary: Mon-Sat Morning (9:00 AM - 2:00 PM), Sunday Off
  ...DAYS.map(day => ({
    id: `sch-fozia-${day.toLowerCase()}`,
    doctor_id: 'doc-fozia',
    day_of_week: day,
    period: 'morning' as const,
    start_time: '09:00',
    end_time: '14:00',
    slot_duration: 30,
    active: true
  })),

  // Dr. Muhammad Arshad: Saturday only (9:00 AM - 3:00 PM)
  {
    id: 'sch-arshad-saturday',
    doctor_id: 'doc-arshad',
    day_of_week: 'Saturday',
    period: 'morning',
    start_time: '09:00',
    end_time: '15:00',
    slot_duration: 30,
    active: true
  },

  // Dr. Umar Farooq: Mon-Sat Evening (5:00 PM - 8:00 PM), Sunday Off
  ...DAYS.map(day => ({
    id: `sch-umar-${day.toLowerCase()}`,
    doctor_id: 'doc-umar',
    day_of_week: day,
    period: 'evening' as const,
    start_time: '17:00',
    end_time: '20:00',
    slot_duration: 30,
    active: true
  }))
];

const INITIAL_SOCIAL_LINKS: SocialMediaLink[] = [
  {
    id: 'soc-fb',
    platform: 'Facebook',
    url: 'https://www.facebook.com/search/top?q=zubair%20medical%20complex%20jhelum',
    active: true
  },
  {
    id: 'soc-ig',
    platform: 'Instagram',
    url: 'https://www.instagram.com/explore/tags/zubairmedicalcomplexjhelum/',
    active: true
  },
  {
    id: 'soc-yt',
    platform: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=zubair+medical+complex+jhelum',
    active: true
  },
  {
    id: 'soc-wa',
    platform: 'WhatsApp',
    url: 'https://wa.me/923156621341',
    active: true
  }
];

const INITIAL_SETTINGS: Record<string, string> = {
  hospital_name: 'Zubair Medical Complex',
  hospital_location: 'Kala Gujran, Jhelum, Punjab, Pakistan',
  hospital_phone: '+92 315 6621341',
  hospital_whatsapp: '+92 315 6621341',
  hospital_whatsapp_url: 'https://wa.me/923156621341',
  hospital_notification_number: '+92 315 6621341',
  // Staff notification channels (email + WhatsApp)
  hospital_notification_email: '', // Admin must configure this - no default email invented
  hospital_notification_whatsapp: '+92 315 6621341',
  messaging_provider: 'mock', // mock | meta_whatsapp | twilio | sms_gateway
  email_provider: 'resend', // resend | mock
  notifications_enabled: 'true',
  default_slot_duration: '30',
  meta_whatsapp_phone_number_id: '',
  meta_whatsapp_token: '',
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_from_number: '',
  whatsapp_gateway_url: 'http://localhost:5005'
};

function ensureDataFile(): DatabaseData {
  if (memoryDbData) {
    return memoryDbData;
  }

  const initialData: DatabaseData = {
    doctors: INITIAL_DOCTORS,
    schedules: INITIAL_SCHEDULES,
    appointments: [],
    users: [],
    socialLinks: INITIAL_SOCIAL_LINKS,
    settings: INITIAL_SETTINGS,
    notificationLogs: []
  };

  // 1. Try reading from fallback (temp) file if it exists
  try {
    if (fs.existsSync(FALLBACK_DB_FILE)) {
      const raw = fs.readFileSync(FALLBACK_DB_FILE, 'utf8');
      memoryDbData = JSON.parse(raw);
      return memoryDbData!;
    }
  } catch (error) {
    console.error('Error reading fallback database file:', error);
  }

  // 2. Try reading from primary project file if it exists
  try {
    if (fs.existsSync(PRIMARY_DB_FILE)) {
      const raw = fs.readFileSync(PRIMARY_DB_FILE, 'utf8');
      memoryDbData = JSON.parse(raw);
      return memoryDbData!;
    }
  } catch (error) {
    console.error('Error reading primary database file:', error);
  }

  // 3. Fallback to initial default data (kept in memory, no disk write needed on initial read)
  memoryDbData = initialData;
  return memoryDbData;
}

function saveDataFile(data: DatabaseData): void {
  memoryDbData = data;

  // If running on Vercel serverless environment, write directly to /tmp
  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);

  if (!isVercel) {
    // Attempt writing to Primary path (local development)
    try {
      if (!fs.existsSync(PRIMARY_DATA_DIR)) {
        fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
      }
      const tempFile = `${PRIMARY_DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, PRIMARY_DB_FILE);
      return;
    } catch (error) {
      // Primary path is read-only
    }
  }

  // Fallback: Write to OS temp directory (/tmp)
  try {
    const tempFile = `${FALLBACK_DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, FALLBACK_DB_FILE);
  } catch (error) {
    console.error('Failed to save to fallback database file:', error);
  }
}

// Storage API methods
export const storage = {
  getDoctors(includeInactive = false): Doctor[] {
    const data = ensureDataFile();
    return includeInactive ? data.doctors : data.doctors.filter(d => d.active);
  },

  getDoctorById(id: string): Doctor | undefined {
    const data = ensureDataFile();
    return data.doctors.find(d => d.id === id);
  },

  updateDoctor(id: string, updates: Partial<Doctor>): Doctor | null {
    const data = ensureDataFile();
    const index = data.doctors.findIndex(d => d.id === id);
    if (index === -1) return null;
    data.doctors[index] = { ...data.doctors[index], ...updates };
    saveDataFile(data);
    return data.doctors[index];
  },

  createDoctor(doctor: Omit<Doctor, 'id' | 'created_at'>): Doctor {
    const data = ensureDataFile();
    const newDoc: Doctor = {
      ...doctor,
      id: `doc-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    data.doctors.push(newDoc);
    saveDataFile(data);
    return newDoc;
  },

  getSchedules(doctorId?: string): DoctorSchedule[] {
    const data = ensureDataFile();
    if (doctorId) {
      return data.schedules.filter(s => s.doctor_id === doctorId);
    }
    return data.schedules;
  },

  updateSchedule(id: string, updates: Partial<DoctorSchedule>): DoctorSchedule | null {
    const data = ensureDataFile();
    const index = data.schedules.findIndex(s => s.id === id);
    if (index === -1) return null;
    data.schedules[index] = { ...data.schedules[index], ...updates };
    saveDataFile(data);
    return data.schedules[index];
  },

  saveDoctorSchedules(doctorId: string, newSchedules: DoctorSchedule[]): void {
    const data = ensureDataFile();
    // remove existing schedules for doctor and insert new ones
    data.schedules = data.schedules.filter(s => s.doctor_id !== doctorId).concat(newSchedules);
    saveDataFile(data);
  },

  getAppointments(filters?: {
    doctorId?: string;
    date?: string;
    status?: string;
    search?: string;
  }): Appointment[] {
    const data = ensureDataFile();
    let result = [...data.appointments];

    if (filters?.doctorId) {
      result = result.filter(a => a.doctor_id === filters.doctorId);
    }
    if (filters?.date) {
      result = result.filter(a => a.appointment_date === filters.date);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter(a => a.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        a =>
          a.appointment_id.toLowerCase().includes(q) ||
          a.patient_name.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          (a.whatsapp || '').toLowerCase().includes(q)
      );
    }

    // Sort descending by appointment_date and appointment_time
    return result.sort((a, b) => {
      const dtA = `${a.appointment_date} ${a.appointment_time}`;
      const dtB = `${b.appointment_date} ${b.appointment_time}`;
      return dtB.localeCompare(dtA);
    });
  },

  getAppointmentById(appointmentId: string): Appointment | undefined {
    const data = ensureDataFile();
    return data.appointments.find(
      a => a.appointment_id.toUpperCase() === appointmentId.toUpperCase() || a.id === appointmentId
    );
  },

  searchAppointments(query: string): Appointment[] {
    const data = ensureDataFile();
    const clean = query.trim().replace(/[-\s]/g, '').toLowerCase();
    return data.appointments.filter(a => {
      const matchId = a.appointment_id.toLowerCase().replace(/[-\s]/g, '').includes(clean);
      const matchPhone = a.phone.replace(/[-\s]/g, '').includes(clean);
      const matchWa = (a.whatsapp || '').replace(/[-\s]/g, '').includes(clean);
      return matchId || matchPhone || matchWa;
    });
  },

  createAppointment(payload: Omit<Appointment, 'id' | 'appointment_id' | 'created_at' | 'updated_at'>): {
    success: boolean;
    appointment?: Appointment;
    error?: string;
  } {
    const data = ensureDataFile();

    // Check duplicate: Doctor + Date + Time
    const duplicate = data.appointments.find(
      a =>
        a.doctor_id === payload.doctor_id &&
        a.appointment_date === payload.appointment_date &&
        a.appointment_time.trim().toUpperCase() === payload.appointment_time.trim().toUpperCase() &&
        a.status !== 'Cancelled'
    );

    if (duplicate) {
      return {
        success: false,
        error: `This time slot (${payload.appointment_time}) on ${payload.appointment_date} is already booked. Please choose another time slot.`
      };
    }

    // Generate readable appointment ID: ZMC-RANDOM
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const appointmentId = `ZMC-${randomCode}`;

    const newAppt: Appointment = {
      ...payload,
      id: `appt-${Date.now()}-${randomCode}`,
      appointment_id: appointmentId,
      status: payload.status || 'Pending',
      notification_status: payload.notification_status || 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.appointments.push(newAppt);
    saveDataFile(data);
    return { success: true, appointment: newAppt };
  },

  updateAppointmentStatus(
    id: string,
    status: Appointment['status']
  ): Appointment | null {
    const data = ensureDataFile();
    const index = data.appointments.findIndex(
      a => a.id === id || a.appointment_id.toUpperCase() === id.toUpperCase()
    );
    if (index === -1) return null;

    data.appointments[index].status = status;
    data.appointments[index].updated_at = new Date().toISOString();
    saveDataFile(data);
    return data.appointments[index];
  },

  deleteAppointment(id: string): boolean {
    const data = ensureDataFile();
    const initialLen = data.appointments.length;
    data.appointments = data.appointments.filter(
      a => a.id !== id && a.appointment_id.toUpperCase() !== id.toUpperCase()
    );
    if (data.appointments.length !== initialLen) {
      saveDataFile(data);
      return true;
    }
    return false;
  },

  deleteAppointmentsByStatus(status: Appointment['status']): number {
    const data = ensureDataFile();
    const initialLen = data.appointments.length;
    data.appointments = data.appointments.filter(a => a.status !== status);
    const removedCount = initialLen - data.appointments.length;
    if (removedCount > 0) {
      saveDataFile(data);
    }
    return removedCount;
  },

  getSettings(): Record<string, string> {
    const data = ensureDataFile();
    return data.settings;
  },

  updateSetting(key: string, value: string): void {
    const data = ensureDataFile();
    data.settings[key] = value;
    saveDataFile(data);
  },

  updateMultipleSettings(settings: Record<string, string>): void {
    const data = ensureDataFile();
    data.settings = { ...data.settings, ...settings };
    saveDataFile(data);
  },

  getSocialLinks(): SocialMediaLink[] {
    const data = ensureDataFile();
    return data.socialLinks;
  },

  updateSocialLinks(links: SocialMediaLink[]): void {
    const data = ensureDataFile();
    data.socialLinks = links;
    saveDataFile(data);
  },

  getUsers(): AdminUser[] {
    const data = ensureDataFile();
    return data.users;
  },

  findUserByEmail(email: string): AdminUser | undefined {
    const data = ensureDataFile();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(user: Omit<AdminUser, 'id' | 'created_at'>): AdminUser {
    const data = ensureDataFile();
    const newUser: AdminUser = {
      ...user,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    saveDataFile(data);
    return newUser;
  },

  updateUser(id: string, updates: Partial<AdminUser>): AdminUser | null {
    const data = ensureDataFile();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    data.users[index] = { ...data.users[index], ...updates };
    saveDataFile(data);
    return data.users[index];
  },

  deleteUser(id: string): boolean {
    const data = ensureDataFile();
    const initialLen = data.users.length;
    data.users = data.users.filter(u => u.id !== id);
    if (data.users.length !== initialLen) {
      saveDataFile(data);
      return true;
    }
    return false;
  },

  addNotificationLog(log: Omit<NotificationLog, 'id' | 'timestamp'> & { whatsapp_message_id?: string }): NotificationLogExtended {
    const data = ensureDataFile();
    const newLog: NotificationLogExtended = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    data.notificationLogs.unshift(newLog); // latest first
    // keep max 500 logs
    if (data.notificationLogs.length > 500) {
      data.notificationLogs = data.notificationLogs.slice(0, 500);
    }
    saveDataFile(data);
    return newLog;
  },

  /** Update a notification log entry by its WhatsApp message ID (for webhook delivery status updates) */
  updateNotificationLogByMessageId(
    whatsappMessageId: string,
    updates: { status?: NotificationLog['status']; error_details?: string; delivered_at?: string }
  ): boolean {
    const data = ensureDataFile();
    const index = data.notificationLogs.findIndex(
      (l: NotificationLogExtended) => l.whatsapp_message_id === whatsappMessageId
    );
    if (index === -1) return false;
    data.notificationLogs[index] = { ...data.notificationLogs[index], ...updates };
    saveDataFile(data);
    return true;
  },

  /** Check if a notification was already sent for this appointment+event+channel+recipient combo */
  hasNotificationBeenSent(
    appointmentId: string,
    event: string,
    channel: string,
    recipientType: string
  ): boolean {
    const data = ensureDataFile();
    return data.notificationLogs.some(
      l =>
        l.appointment_id === appointmentId &&
        l.event === event &&
        l.recipient_type === recipientType &&
        (l.status === 'sent' || l.status === 'delivered' || l.status === 'simulated') &&
        (channel === 'messaging' || channel === 'whatsapp'
          ? (l.channel === 'whatsapp' || l.channel === 'sms' || l.channel === 'mock')
          : l.channel === channel)
    );
  },

  getNotificationLogs(limit = 50): NotificationLogExtended[] {
    const data = ensureDataFile();
    return data.notificationLogs.slice(0, limit);
  },

  /** Internal helper: expose raw data for webhook handler (server-side only) */
  _getRawData(): DatabaseData {
    return ensureDataFile();
  },

  /** Internal helper: save raw data (used by webhook handler after updating logs) */
  _saveRawData(data: DatabaseData): void {
    saveDataFile(data);
  }
};
