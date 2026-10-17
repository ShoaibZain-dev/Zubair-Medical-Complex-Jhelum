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
import { useLanguage } from '@/context/LanguageContext';

interface BookingWizardProps {
  initialDoctorId?: string;
  doctors: Doctor[];
}

export default function BookingWizard({ initialDoctorId, doctors }: BookingWizardProps) {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();

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
  const [whatsAppConsent, setWhatsAppConsent] = useState(true); // Pre-ticked for convenience

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

  // Doctor translation helper
  const getDoctorName = (doc?: Doctor) => {
    if (!doc) return '';
    if (!isUrdu) return doc.name;
    switch (doc.id) {
      case 'doc-zubair': return t('doc_zubair_name');
      case 'doc-fozia': return t('doc_fozia_name');
      case 'doc-arshad': return t('doc_arshad_name');
      case 'doc-umar': return t('doc_umar_name');
      default: return doc.name;
    }
  };

  const getDoctorSpecialty = (doc?: Doctor) => {
    if (!doc) return '';
    if (!isUrdu) return doc.specialty;
    switch (doc.id) {
      case 'doc-zubair': return t('doc_zubair_specialty');
      case 'doc-fozia': return t('doc_fozia_specialty');
      case 'doc-arshad': return t('doc_arshad_specialty');
      case 'doc-umar': return t('doc_umar_specialty');
      default: return doc.specialty;
    }
  };

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
        .catch(() => {
          setLoadingSlots(false);
          setErrorMessage(isUrdu ? 'اس تاریخ کے لیے دستیاب اوقات لوڈ نہیں ہو سکے۔' : 'Failed to load slots for this date.');
        });
    } else {
      setSlotsData(null);
    }
  }, [selectedDoctorId, selectedDate, isUrdu]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setErrorMessage(null);

    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const day = dateObj.getDay();

      if (day === 0) {
        setErrorMessage(isUrdu 
          ? 'اتوار کو کلینک میں چھٹی ہوتی ہے۔ برائے مہربانی پیر تا ہفتہ میں سے انتخاب کریں۔' 
          : 'Sunday is an official off-day for consultations. Please choose Monday to Saturday.');
        return;
      }

      if (selectedDoctorId === 'doc-arshad' && day !== 6) {
        setErrorMessage(isUrdu
          ? 'ڈاکٹر محمد ارشد صرف ہر ہفتہ (9:00 صبح تا 3:00 سہ پہر) دستیاب ہوتے ہیں۔ برائے مہربانی ہفتے کا دن منتخب کریں۔'
          : 'Dr. Muhammad Arshad is available exclusively on Saturdays (9:00 AM – 3:00 PM). Please select a Saturday.');
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
      setErrorMessage(isUrdu ? 'برائے مہربانی مریض کا مکمل نام درج کریں۔' : 'Please enter patient full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage(isUrdu ? 'برائے مہربانی فون نمبر درج کریں۔' : 'Please enter patient phone number.');
      return;
    }
    // Validate email only if provided
    if (email.trim() && !email.includes('@')) {
      setErrorMessage(isUrdu ? 'برائے مہربانی درست ای میل پتہ درج کریں۔' : 'Please enter a valid email address if provided.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setErrorMessage(isUrdu ? 'برائے مہربانی درست عمر درج کریں (1 تا 120 سال)۔' : 'Please enter a valid patient age (1 - 120).');
      return;
    }
    if (!selectedTime) {
      setErrorMessage(isUrdu ? 'برائے مہربانی مشاورت کا وقت منتخب کریں۔' : 'Please select a consultation time slot.');
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
          notes,
          whatsapp_consent: whatsAppConsent
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        setErrorMessage(data.error || (isUrdu ? 'اپوائنٹمنٹ درج کرنے میں مسئلہ پیش آیا۔' : 'Failed to submit appointment.'));
        return;
      }

      // Redirect to confirmation page
      router.push(`/appointments/confirmation/${data.appointment.appointment_id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || (isUrdu ? 'نیٹ ورک کا مسئلہ پیش آیا۔' : 'Network error occurred.'));
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
                {isUrdu ? 'کلینک اپوائنٹمنٹ بکنگ پورٹل' : 'Clinic Appointment Booking'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {t('hospital_full_name')}
              </h2>
            </div>
            <div className="text-xs text-slate-300 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/80 self-start sm:self-auto">
              {isUrdu ? `مرحلہ ${currentStep} از 4: ` : `Step ${currentStep} of 4: `}
              {
                currentStep === 1 ? t('step_doctor') :
                currentStep === 2 ? t('step_datetime') :
                currentStep === 3 ? (isUrdu ? 'وقت کا انتخاب' : 'Select Time Slot') : t('step_patient')
              }
            </div>
          </div>

          {/* Stepper Steps — clickable for navigation */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-xs font-semibold">
            {[
              { num: 1, title: isUrdu ? 'ڈاکٹر' : 'Doctor' },
              { num: 2, title: isUrdu ? 'تاریخ' : 'Date' },
              { num: 3, title: isUrdu ? 'وقت' : 'Time Slot' },
              { num: 4, title: isUrdu ? 'تفصیلات' : 'Patient Info' }
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
                  className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all text-left rtl:text-right ${
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

        {/* STEP 1: SELECT DOCTOR */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-0.5">
                {isUrdu ? 'کنسلٹنٹ ڈاکٹر منتخب کریں' : 'Select Consultant Doctor'}
              </h3>
              <p className="text-sm text-slate-500">
                {isUrdu ? 'تاریخ کے انتخاب کے لیے نیچے دیے گئے کسی بھی معالج پر کلک کریں۔' : 'Click on any doctor below to proceed to date selection.'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {doctors.map(doctor => {
                const isSelected = selectedDoctorId === doctor.id;
                const dName = getDoctorName(doctor);
                const dSpecialty = getDoctorSpecialty(doctor);

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
                    className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 text-left rtl:text-right group cursor-pointer ${
                      isSelected
                        ? 'border-[#1E90FF] bg-blue-50/80 shadow-md ring-2 ring-blue-200'
                        : 'border-slate-200/90 bg-white hover:border-[#1E90FF] hover:bg-blue-50/40 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-base transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#1E90FF] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-[#1E90FF] group-hover:text-white'
                      }`}>
                        {doctor.avatar_url ? (
                          <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover" />
                        ) : (
                          <Stethoscope className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-900 group-hover:text-[#1E90FF] transition-colors leading-snug">
                          {dName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                          <span className="text-[#1E90FF] font-bold">{dSpecialty}</span>
                          {doctor.qualification && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 technical-value">{doctor.qualification}</span>
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
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
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
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {isUrdu ? 'مرحلہ 2: مشاورت کی تاریخ منتخب کریں' : 'Step 2: Select Consultation Date'}
              </h3>
              <p className="text-sm text-slate-500">
                {isUrdu 
                  ? `${getDoctorName(selectedDoctor)} کے لیے دستیاب تاریخ کا انتخاب کریں۔`
                  : `Choose an available date for ${selectedDoctor?.name}.`}
              </p>
            </div>

            {/* Doctor info banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider block">
                  {getDoctorSpecialty(selectedDoctor)}
                </span>
                <div className="text-base font-bold text-slate-900 leading-snug">
                  {getDoctorName(selectedDoctor)}
                </div>
                {selectedDoctor?.qualification && (
                  <div className="text-xs text-slate-600 font-medium technical-value">
                    {selectedDoctor.qualification}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-[#1E90FF] hover:underline cursor-pointer"
              >
                {isUrdu ? 'ڈاکٹر تبدیل کریں' : 'Change Doctor'}
              </button>
            </div>

            {selectedDoctorId === 'doc-arshad' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  {isUrdu 
                    ? 'نوٹ: ڈاکٹر محمد ارشد صرف ہر ہفتہ (9:00 صبح تا 3:00 سہ پہر) دستیاب ہوتے ہیں۔ برائے مہربانی کلینڈر سے ہفتے کا دن منتخب کریں۔'
                    : 'Notice: Dr. Muhammad Arshad is available exclusively on Saturdays (9:00 AM – 3:00 PM). Please select a Saturday on the calendar.'}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                {isUrdu ? 'مشاورت کی تاریخ کا انتخاب کریں (اتوار چھٹی)' : 'Select Consultation Date (Sunday is Off)'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all bg-white technical-value"
                />
              </div>
              <p className="text-xs text-slate-400">
                {isUrdu ? 'کلینک میں پیر تا ہفتہ او پی ڈی ہوتی ہے۔ اتوار کو چھٹی ہوتی ہے۔' : 'Clinic consultations operate Monday to Saturday. Sunday is an off-day.'}
              </p>
            </div>

            <p className="text-xs text-slate-400 italic">
              {isUrdu ? 'تاریخ منتخب کرنے پر آپ خودکار طور پر اگلے مرحلے پر چلے جائیں گے۔' : "Pick a valid date above and you'll be taken to time slot selection automatically."}
            </p>
          </div>
        )}

        {/* STEP 3: SELECT AVAILABLE TIME */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {isUrdu ? 'مرحلہ 3: دستیاب وقت منتخب کریں' : 'Step 3: Select Available Time Slot'}
              </h3>
              <p className="text-sm text-slate-500">
                {isUrdu ? (
                  <>
                    <strong className="text-slate-900 technical-value">{selectedDate}</strong> کے لیے{' '}
                    <strong className="text-slate-900">{getDoctorName(selectedDoctor)}</strong> کے دستیاب اوقات۔
                  </>
                ) : (
                  <>
                    Showing available consultation slots on <strong className="text-slate-900">{selectedDate}</strong> ({slotsData?.dayName}) for <strong className="text-slate-900">{selectedDoctor?.name}</strong>.
                  </>
                )}
              </p>
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
                <span className="text-sm font-semibold">
                  {isUrdu ? 'دستیاب اوقات لوڈ ہو رہے ہیں...' : 'Generating consultation time slots...'}
                </span>
              </div>
            ) : slotsData?.isOffDay ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="font-bold text-amber-900 mb-1">
                  {isUrdu ? 'کوئی شیڈول دستیاب نہیں' : 'No Schedule Available'}
                </h4>
                <p className="text-xs text-amber-700">
                  {isUrdu 
                    ? `${getDoctorName(selectedDoctor)} اس دن دستیاب نہیں ہوتے۔ برائے مہربانی کوئی اور تاریخ منتخب کریں۔`
                    : `${selectedDoctor?.name} does not hold consultations on ${slotsData.dayName}s. Please pick another date.`}
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white cursor-pointer"
                >
                  {isUrdu ? 'تاریخ تبدیل کریں' : 'Change Date'}
                </button>
              </div>
            ) : slotsData && slotsData.slots.length > 0 ? (
              <div className="space-y-6">
                {/* Morning Slots */}
                {slotsData.slots.some(s => s.period === 'morning') && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#1E90FF]" />
                      {isUrdu ? 'صبح کے اوقات' : 'Morning Shift Slots'}
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
                            className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1E90FF] border-[#1E90FF] text-white shadow-md scale-102 ring-2 ring-blue-300'
                                : slot.isAvailable
                                ? 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            }`}
                          >
                            <div className="technical-value font-mono">{slot.time}</div>
                            <div className={`text-[10px] mt-0.5 font-semibold ${
                              isSelected
                                ? 'text-blue-100'
                                : slot.isAvailable
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}>
                              {slot.isAvailable ? (isUrdu ? 'دستیاب' : 'Available') : (isUrdu ? 'بک شدہ' : 'Booked')}
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
                      {isUrdu ? 'شام کے اوقات' : 'Evening Shift Slots'}
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
                            className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1E90FF] border-[#1E90FF] text-white shadow-md scale-102 ring-2 ring-blue-300'
                                : slot.isAvailable
                                ? 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            }`}
                          >
                            <div className="technical-value font-mono">{slot.time}</div>
                            <div className={`text-[10px] mt-0.5 font-semibold ${
                              isSelected
                                ? 'text-blue-100'
                                : slot.isAvailable
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}>
                              {slot.isAvailable ? (isUrdu ? 'دستیاب' : 'Available') : (isUrdu ? 'بک شدہ' : 'Booked')}
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
                {isUrdu ? 'اس تاریخ کے لیے کوئی اوقات ترتیب نہیں دیے گئے ہیں۔' : 'No slots configured for this date.'}
              </div>
            )}

            <p className="text-xs text-slate-400 italic">
              {isUrdu ? 'وقت منتخب کرنے پر آپ خودکار طور پر اگلے مرحلے پر چلے جائیں گے۔' : 'Select a time slot above to continue to patient details automatically.'}
            </p>
          </div>
        )}

        {/* STEP 4: ENTER PATIENT INFORMATION */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {isUrdu ? 'مرحلہ 4: مریض کی تفصیلات اور تصدیق' : 'Step 4: Patient Information & Confirmation'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {isUrdu 
                  ? 'برائے مہربانی درست رابطہ نمبر درج کریں تاکہ آپ کی اپوائنٹمنٹ کی تصدیق اور واٹس ایپ نوٹیفکیشن فوری جاری کیا جا سکے۔'
                  : 'Please provide accurate contact details so we can issue your appointment ID and send automated SMS / WhatsApp confirmation.'}
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">{t('slip_doctor')}:</span>
                <span className="text-slate-900 font-bold text-sm leading-snug">{getDoctorName(selectedDoctor)}</span>
                <span className="text-[#1E90FF] block font-semibold">{getDoctorSpecialty(selectedDoctor)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">{t('slip_datetime')}:</span>
                <span className="text-slate-900 font-bold text-sm technical-value">{selectedDate}</span>
                <span className="text-emerald-700 font-bold block technical-value">{selectedTime}</span>
              </div>
            </div>

            {/* Patient Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {t('form_full_name')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder={isUrdu ? 'مثلاً محمد علی' : 'e.g. Muhammad Ali'}
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {t('form_phone')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="03001234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all font-mono phone-number"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    {t('form_whatsapp')} <span className="text-slate-400 font-normal">{t('optional')}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#1E90FF] cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={e => setSameAsPhone(e.target.checked)}
                      className="rounded text-[#1E90FF] focus:ring-blue-400"
                    />
                    {t('form_same_as_phone')}
                  </label>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-3.5" />
                  <input
                    type="tel"
                    disabled={sameAsPhone}
                    placeholder={isUrdu ? '(اختیاری) 03001234567' : '03001234567 (optional)'}
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all font-mono phone-number disabled:bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {isUrdu
                    ? 'اگر خالی چھوڑیں تو فون نمبر پر نوٹیفکیشن بھیجی جائے گی۔'
                    : 'If left blank, notifications will be sent to your phone number instead.'}
                </p>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {t('form_email')} <span className="text-slate-400 font-normal">{t('optional')}</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-3.5" />
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all technical-value"
                  />
                </div>
              </div>

              {/* Age and Gender */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    {t('form_age')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="25"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all font-mono technical-value"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    {t('form_gender')} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all bg-white"
                  >
                    <option value="Male">{t('gender_male')}</option>
                    <option value="Female">{t('gender_female')}</option>
                    <option value="Other">{t('gender_other')}</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {t('form_notes')}
                </label>
                <textarea
                  rows={3}
                  placeholder={isUrdu ? 'مریض کی علامات یا معائنے کا سبب یہاں لکھیں...' : 'Optional brief notes for the consultant...'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all"
                ></textarea>
              </div>

              {/* WhatsApp Notification Consent */}
              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/60 cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={whatsAppConsent}
                    onChange={e => setWhatsAppConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-400 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {isUrdu
                        ? '✅ واٹس ایپ اپوائنٹمنٹ نوٹیفکیشن کی اجازت دیں'
                        : '✅ I consent to receive WhatsApp appointment notifications'}
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed mt-0.5 block">
                      {isUrdu
                        ? 'میں اس بات سے متفق ہوں کہ زبیر میڈیکل کمپلیکس جہلم میری اپوائنٹمنٹ کی تصدیق اور اپڈیٹس میرے واٹس ایپ نمبر پر خودکار طریقے سے بھیجے۔'
                        : 'I agree that Zubair Medical Complex Jhelum may send me automatic appointment confirmation and status updates on my WhatsApp number.'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 flex items-center justify-end border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] via-[#FFDF33] to-[#FFD700] hover:brightness-105 shadow-lg shadow-amber-400/25 active:scale-95 transition-all border border-amber-300 disabled:opacity-50 min-w-[200px] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{isUrdu ? 'اپوائنٹمنٹ درج ہو رہی ہے...' : 'Confirming Booking...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>{t('btn_confirm_submit')}</span>
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
