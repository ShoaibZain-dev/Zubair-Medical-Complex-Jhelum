export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export type UserRole = 'Admin' | 'Receptionist';

export interface Doctor {
  id: string;
  name: string;
  qualification?: string;
  specialty: string;
  contact: string;
  social_media?: string;
  active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: DayOfWeek;
  period?: 'morning' | 'evening' | 'general';
  start_time: string; // "09:00"
  end_time: string;   // "14:00"
  slot_duration: number; // in minutes, e.g. 30
  active: boolean;
}

export interface Appointment {
  id: string;
  appointment_id: string; // e.g. "ZMC-84291"
  patient_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  doctor_id: string;
  appointment_date: string; // "YYYY-MM-DD"
  appointment_time: string; // "09:00 AM"
  specialty: string;
  notes?: string;
  status: AppointmentStatus;
  notification_status?: 'Sent' | 'Mock-Sent' | 'Failed' | 'Pending';
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface SocialMediaLink {
  id: string;
  platform: 'Facebook' | 'Instagram' | 'YouTube' | 'WhatsApp';
  url: string;
  active: boolean;
}

export interface SystemSetting {
  id: string;
  setting_name: string;
  setting_value: string;
}

export interface NotificationLog {
  id: string;
  appointment_id: string;
  recipient_type: 'patient' | 'hospital';
  recipient_number: string;
  event: 'new_appointment' | 'confirmed' | 'cancelled' | 'status_update';
  channel: 'whatsapp' | 'sms' | 'mock';
  message: string;
  status: 'sent' | 'failed' | 'simulated';
  timestamp: string;
}
