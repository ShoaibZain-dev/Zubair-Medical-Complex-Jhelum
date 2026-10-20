import React from 'react';
import { storage } from '@/lib/storage';
import HomeClientView from '@/components/HomeClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  const doctors = storage.getDoctors();
  const schedules = storage.getSchedules();

  return <HomeClientView doctors={doctors} schedules={schedules} />;
}
