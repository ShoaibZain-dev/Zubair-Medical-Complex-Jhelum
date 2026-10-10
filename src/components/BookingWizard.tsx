'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Doctor } from '../types';
import { TimeSlot } from '../lib/slots';
import { 
  User, Calendar as CalendarIcon, Clock, Phone, Mail, FileText, 
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, ArrowRight,
  Stethoscope, ShieldAlert, Sparkles, Loader2, Award
} from 'lucide-react';

interface BookingWizardProps {
  initialDoctorId?: string;
  doctors: Doctor[];
}

export default function BookingWizard({ initialDoctorId, doctors }: BookingWizardProps) {
  const router = useRouter();

  // Wizard Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<number>(initialDoctorId ? 2 : 1);

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || (doctors[0]?.id || ''));
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Patient details
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [notes, setNotes] = useState('');

  // Slot fetching state
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsData, setSlotsData] = useState<{
    dayName: string;
    isOffDay: boolean;
    slots: TimeSlot[];
  } | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Synchronize whatsapp when sameAsPhone is checked
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone);
    }
  }, [sameAsPhone, phone]);

  // Generate minimum selectable date (today in local time)
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      setLoadingSlots(true);
      setErrorMessage(null);
      setSelectedTime('');

      fetch(`/api/slots?doctorId=${selectedDoctorId}&date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          setLoadingSlots(false);
          if (data.error) {
            setErrorMessage(data.error);
            setSlotsData(null);
          } else {
            setSlotsData(data);
          }
        })
        .catch(err => {
          setLoadingSlots(false);
          setErrorMessage('Failed to load slots for this date.');
        });
    } else {
      setSlotsData(null);
    }
  }, [selectedDoctorId, selectedDate]);

  // Validate if date is allowed for selected doctor
  const isDateSelectable = (dateStr: string) => {
    if (!dateStr) return true;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay(); // 0 is Sunday, 6 is Saturday

    // Sunday is off for all doctors
    if (day === 0) return false;

    // Dr. Muhammad Arshad is Saturday only
    if (selectedDoctorId === 'doc-arshad' && day !== 6) {
      return false;
    }

    return true;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setErrorMessage(null);

    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const day = dateObj.getDay();

      if (day === 0) {
        setErrorMessage('Sunday is an official off-day for consultations. Please choose Monday to Saturday.');
        return;
      }

      if (selectedDoctorId === 'doc-arshad' && day !== 6) {
        setErrorMessage('Dr. Muhammad Arshad is available exclusively on Saturdays (9:00 AM – 3:00 PM). Please select a Saturday.');
        return;
      }

      setSelectedDate(val);
      // Auto-advance to time slot step
      setCurrentStep(3);
    } else {
      setSelectedDate('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!patientName.trim()) {
      setErrorMessage('Please enter patient full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter patient phone number.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMessage('Please enter patient WhatsApp number (or check "Same as phone").');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      // Email is optional - only validate format if provided
      if (email.trim() && !email.includes('@')) {
        setErrorMessage('Please enter a valid email address if provided.');
        return;
      }
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setErrorMessage('Please enter a valid patient age (1 - 120).');
      return;
    }
    if (!selectedTime) {
      setErrorMessage('Please select a consultation time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          phone,
          whatsapp,
          email,
          age: ageNum,
          gender,
          doctor_id: selectedDoctorId,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          specialty: selectedDoctor?.specialty || '',
          notes
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit appointment.');
        return;
      }

      // Redirect to confirmation page
      router.push(`/appointments/confirmation/${data.appointment.appointment_id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Network error occurred.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
      {/* Wizard Header / Step Progress Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FFD700] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Clinic Appointment Booking
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Zubair Medical Complex Jhelum
              </h2>
            </div>
            <div className="text-xs text-slate-300 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/80 self-start sm:self-auto">
              Step {currentStep} of 4: {
                currentStep === 1 ? 'Select Doctor' :
                currentStep === 2 ? 'Select Date' :
                currentStep === 3 ? 'Select Time Slot' : 'Patient Information'
              }
            </div>
          </div>

          {/* Stepper Steps — clickable for navigation */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-xs font-semibold">
            {[
              { num: 1, title: 'Doctor' },
              { num: 2, title: 'Date' },
              { num: 3, title: 'Time Slot' },
              { num: 4, title: 'Patient Info' }
            ].map(step => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              const isAccessible = 
                step.num === 1 || 
                (step.num === 2 && Boolean(selectedDoctorId)) ||
                (step.num === 3 && Boolean(selectedDoctorId && selectedDate)) ||
                (step.num === 4 && Boolean(selectedDoctorId && selectedDate && selectedTime));

              return (
                <button
                  key={step.num}
                  type="button"
                  disabled={!isAccessible}
                  onClick={() => { if (isAccessible) setCurrentStep(step.num); }}
                  className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all text-left ${
                    isCurrent
                      ? 'bg-[#1E90FF] border-[#1E90FF] text-white shadow-md'
                      : isCompleted || isAccessible
                      ? 'bg-slate-800/90 border-emerald-500/40 text-emerald-300 cursor-pointer hover:border-emerald-400'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-white text-[#1E90FF]'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {isCompleted ? '✓' : step.num}
                  </div>
                  <span className="hidden sm:inline truncate">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wizard Body */}
      <div className="p-6 sm:p-10 max-w-3xl mx-auto">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: SELECT DOCTOR — Column list of Doctor buttons */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-0.5">Select Consultant Doctor</h3>
              <p className="text-sm text-slate-500">Click on any doctor below to proceed to date selection.</p>
            </div>

            <div className="flex flex-col gap-3">
              {doctors.map(doctor => {
                const isSelected = selectedDoctorId === doctor.id;
                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctorId(doctor.id);
                      setSelectedDate('');
                      setSelectedTime('');
                      setErrorMessage(null);
                      setCurrentStep(2);
                    }}
                    className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 text-left group cursor-pointer ${
                      isSelected
                        ? 'border-[#1E90FF] bg-blue-50/80 shadow-md ring-2 ring-blue-200'
                        : 'border-slate-200/90 bg-white hover:border-[#1E90FF] hover:bg-blue-50/40 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#1E90FF] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-[#1E90FF] group-hover:text-white'
                      }`}>
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-900 group-hover:text-[#1E90FF] transition-colors">
                          {doctor.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                          <span className="text-[#1E90FF] font-bold">{doctor.specialty}</span>
                          {doctor.qualification && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600">{doctor.qualification}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#1E90FF] text-white'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-[#1E90FF] group-hover:text-white'
                    }`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: SELECT DATE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Step 2: Select Consultation Date</h3>
              <p className="text-sm text-slate-500">
                Choose an available date for <strong className="text-slate-900">{selectedDoctor?.name}</strong>.
              </p>
            </div>

            {/* Doctor info banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider block">
                  {selectedDoctor?.specialty}
                </span>
                <div className="text-base font-bold text-slate-900">{selectedDoctor?.name}</div>
                {selectedDoctor?.qualification && (
                  <div className="text-xs text-slate-600 font-medium">{selectedDoctor?.qualification}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-[#1E90FF] hover:underline"
              >
                Change Doctor
              </button>
            </div>

            {selectedDoctorId === 'doc-arshad' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Notice: Dr. Muhammad Arshad is available exclusively on Saturdays (9:00 AM – 3:00 PM). Please select a Saturday on the calendar.</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Select Consultation Date (Sunday is Off)
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all bg-white"
                />
              </div>
              <p className="text-xs text-slate-400">
                Clinic consultations operate Monday to Saturday. Sunday is an off-day.
              </p>
            </div>

            {/* Auto-advance hint */}
            <p className="text-xs text-slate-400 italic">
              Pick a valid date above and you'll be taken to time slot selection automatically.
            </p>
          </div>
        )}

        {/* STEP 3: SELECT AVAILABLE TIME */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Step 3: Select Available Time Slot</h3>
              <p className="text-sm text-slate-500">
                Showing available consultation slots on <strong className="text-slate-900">{selectedDate}</strong> ({slotsData?.dayName}) for <strong className="text-slate-900">{selectedDoctor?.name}</strong>.
              </p>
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
                <span className="text-sm font-semibold">Generating consultation time slots...</span>
              </div>
            ) : slotsData?.isOffDay ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="font-bold text-amber-900 mb-1">No Schedule Available</h4>
                <p className="text-xs text-amber-700">
                  {selectedDoctor?.name} does not hold consultations on {slotsData.dayName}s. Please pick another date.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white"
                >
                  Change Date
                </button>
              </div>
            ) : slotsData && slotsData.slots.length > 0 ? (
              <div className="space-y-6">
                {/* Morning Slots */}
                {slotsData.slots.some(s => s.period === 'morning') && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#1E90FF]" />
                      Morning Shift Slots
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {slotsData.slots.filter(s => s.period === 'morning').map(slot => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => {
                              setSelectedTime(slot.time);
                              setCurrentStep(4);
                            }}
                            className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                              isSelected
                                ? 'bg-[#1E90FF] border-[#1E90FF] text-white shadow-md scale-102 ring-2 ring-blue-300'
                                : slot.isAvailable
                                ? 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            }`}
                          >
                            <div>{slot.time}</div>
                            <div className={`text-[10px] mt-0.5 font-semibold ${
                              isSelected
                                ? 'text-blue-100'
                                : slot.isAvailable
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}>
                              {slot.isAvailable ? 'Available' : 'Booked'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {slotsData.slots.some(s => s.period === 'evening') && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#4682B4]" />
                      Evening Shift Slots
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {slotsData.slots.filter(s => s.period === 'evening').map(slot => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => {
                              setSelectedTime(slot.time);
                              setCurrentStep(4);
                            }}
                            className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                              isSelected
                                ? 'bg-[#1E90FF] border-[#1E90FF] text-white shadow-md scale-102 ring-2 ring-blue-300'
                                : slot.isAvailable
                                ? 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            }`}
                          >
                            <div>{slot.time}</div>
                            <div className={`text-[10px] mt-0.5 font-semibold ${
                              isSelected
                                ? 'text-blue-100'
                                : slot.isAvailable
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}>
                              {slot.isAvailable ? 'Available' : 'Booked'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No slots configured for this date.
              </div>
            )}

            {/* Auto-advance hint */}
            <p className="text-xs text-slate-400 italic">
              Select a time slot above to continue to patient details automatically.
            </p>
          </div>
        )}

        {/* STEP 4: ENTER PATIENT INFORMATION */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Step 4: Patient Information & Confirmation</h3>
              <p className="text-sm text-slate-500">
                Please provide accurate contact details so we can issue your appointment ID and send automated SMS / WhatsApp confirmation.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Consultant Doctor:</span>
                <span className="text-slate-900 font-bold text-sm">{selectedDoctor?.name}</span>
                <span className="text-[#1E90FF] block font-semibold">{selectedDoctor?.specialty}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Appointment Schedule:</span>
                <span className="text-slate-900 font-bold text-sm">{selectedDate} ({slotsData?.dayName})</span>
                <span className="text-emerald-700 font-bold block">{selectedTime}</span>
              </div>
            </div>

            {/* Patient Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 03001234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all font-mono"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#1E90FF] cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={e => setSameAsPhone(e.target.checked)}
                      className="rounded text-[#1E90FF] focus:ring-blue-400"
                    />
                    Same as phone
                  </label>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    disabled={sameAsPhone}
                    placeholder="e.g. 03001234567"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all font-mono disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="e.g. patient@example.com (optional)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all"
                  />
                </div>
              </div>

              {/* Age and Gender */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="Age"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Additional Notes (Reason for visit, past symptoms)
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional brief notes for the consultant..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all"
                ></textarea>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 flex items-center justify-end border-t border-slate-100">

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] via-[#FFDF33] to-[#FFD700] hover:brightness-105 shadow-lg shadow-amber-400/25 active:scale-95 transition-all border border-amber-300 disabled:opacity-50 min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Submit Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
