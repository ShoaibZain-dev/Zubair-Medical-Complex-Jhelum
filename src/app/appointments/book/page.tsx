import React from 'react';
import { storage } from '@/lib/storage';
import BookingWizard from '@/components/BookingWizard';

interface Props {
  searchParams: { doctor?: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Book Appointment | Zubair Medical Complex Jhelum',
  description: 'Book your medical consultation appointment online at Zubair Medical Complex Jhelum.',
};

export default function BookAppointmentPage({ searchParams }: Props) {
  const doctors = storage.getDoctors();
  const initialDoctorId = searchParams.doctor;

  return (
    <div className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Book a Clinic Consultation
        </h1>
        <p className="text-sm sm:text-base text-slate-500">
          Fast, structured, and verified outpatient booking at Zubair Medical Complex Jhelum.
        </p>
      </div>

      <BookingWizard
        doctors={doctors}
        initialDoctorId={initialDoctorId}
      />
    </div>
  );
}
