import React from 'react';
import { storage } from '@/lib/storage';
import DoctorsClientView from '@/components/DoctorsClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Specialist Doctors | Zubair Medical Complex Jhelum',
  description: 'View consulting specialists at Zubair Medical Complex Jhelum including Medical Specialist, Gynecologist, Rheumatologist, and Laparoscopic Surgeon.',
};

export default function DoctorsPage() {
  const doctors = storage.getDoctors();
  const schedules = storage.getSchedules();

  return <DoctorsClientView doctors={doctors} schedules={schedules} />;
}
