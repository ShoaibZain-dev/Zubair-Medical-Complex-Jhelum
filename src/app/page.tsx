import React from 'react';
import { storage } from '@/lib/storage';
import HomeClientView from '@/components/HomeClientView';

export default function HomePage() {
  const doctors = storage.getDoctors();

  return <HomeClientView doctors={doctors} />;
}
