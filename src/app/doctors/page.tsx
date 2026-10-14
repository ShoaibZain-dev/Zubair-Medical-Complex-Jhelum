import React from 'react';
import { storage } from '@/lib/storage';
import DoctorsClientView from '@/components/DoctorsClientView';

export const metadata = {
  title: 'Specialist Doctors | Zubair Medical Complex Jhelum',
  description: 'View consulting specialists at Zubair Medical Complex Jhelum including Medical Specialist, Gynecologist, Rheumatologist, and Laparoscopic Surgeon.',
};

export default function DoctorsPage() {
  const doctors = storage.getDoctors();

  return <DoctorsClientView doctors={doctors} />;
}
