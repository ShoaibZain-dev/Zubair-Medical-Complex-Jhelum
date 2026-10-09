import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';

export const metadata: Metadata = {
  title: 'Zubair Medical Complex Jhelum | Professional Healthcare & Specialist Consultation',
  description: 'Book doctor appointments at Zubair Medical Complex Jhelum. Dedicated specialist medical consultation, outpatient care, and clinical appointments.',
  keywords: 'Zubair Medical Complex, Jhelum, Doctor Appointment, Medical Specialist, Gynecologist, Rheumatologist, Laparoscopic Surgeon, Healthcare Jhelum',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-[#1E90FF] selection:text-white">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <WhatsAppFloatingButton />
        <Footer />
      </body>
    </html>
  );
}
