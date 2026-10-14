'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

interface Translations {
  [key: string]: {
    en: string;
    ur: string;
  };
}

export const translations: Translations = {
  // Brand
  hospital_name: {
    en: 'Zubair Medical Complex',
    ur: 'زبیر میڈیکل کمپلیکس',
  },
  hospital_city: {
    en: 'Jhelum',
    ur: 'جہلم',
  },
  hospital_full_name: {
    en: 'Zubair Medical Complex Jhelum',
    ur: 'زبیر میڈیکل کمپلیکس جہلم',
  },
  hospital_tagline: {
    en: 'Your Health, our Expertise',
    ur: 'آپ کی صحت، ہماری مہارت',
  },
  hospital_address: {
    en: 'Kala Gujran, Jhelum, Punjab, Pakistan',
    ur: 'کالا گجراں، جہلم، پنجاب، پاکستان',
  },
  hospital_address_badge: {
    en: 'Kala Gujran, Jhelum, Punjab, Pakistan • Official Clinical Complex',
    ur: 'کالا گجراں، جہلم، پنجاب، پاکستان • آفیشل کلینیکل کمپلیکس',
  },
  hospital_desc: {
    en: 'Professional healthcare and specialist consultation in Jhelum. Dedicated to providing patient-centered clinical care and trusted outpatient appointments.',
    ur: 'جہلم میں پیشہ ورانہ صحت کی دیکھ بھال اور ماہر ڈاکٹرز کے مشورے۔ مریضوں کی معیاری طبی نگہداشت کے لیے پرعزم۔',
  },
  hero_desc: {
    en: 'Schedule your clinical consultation with our certified medical specialists, gynecologist, rheumatologist, and laparoscopic surgeon with scheduled outpatient appointments.',
    ur: 'ہمارے سند یافتہ سپیشلسٹ فزیشنز، ماہر امراض نسواں، ریوماٹالوجسٹ اور لیپروسکوپک سرجن کے ساتھ اپنی کلینیکل مشاورت کی اپوائنٹمنٹ باآسانی بک کریں۔',
  },

  // Navbar & Header
  nav_home: {
    en: 'Home',
    ur: 'صفحہ اول',
  },
  nav_doctors: {
    en: 'Doctors',
    ur: 'ڈاکٹرز',
  },
  nav_appointments: {
    en: 'Appointments',
    ur: 'اپوائنٹمنٹس',
  },
  nav_about: {
    en: 'About',
    ur: 'ہمارے متعلق',
  },
  nav_contact: {
    en: 'Contact',
    ur: 'رابطہ',
  },
  nav_check_status: {
    en: 'Check Appointment',
    ur: 'اسٹیٹس چیک کریں',
  },
  btn_book_appointment: {
    en: 'Book Appointment',
    ur: 'اپوائنٹمنٹ بک کریں',
  },
  btn_view_doctors: {
    en: 'View Doctors',
    ur: 'ڈاکٹرز دیکھیں',
  },
  btn_check_status: {
    en: 'Check Status',
    ur: 'اسٹیٹس دیکھیں',
  },
  btn_staff_login: {
    en: 'Staff Login',
    ur: 'اسٹاف لاگ ان',
  },
  label_hospital: {
    en: 'Hospital',
    ur: 'ہسپتال',
  },
  label_doctors: {
    en: 'Doctors',
    ur: 'ڈاکٹرز',
  },
  label_doctor_desks: {
    en: 'Doctor Desks',
    ur: 'ڈاکٹر ڈیسک',
  },
  label_whatsapp: {
    en: 'WhatsApp',
    ur: 'واٹس ایپ',
  },

  // Section Headers
  section_consultant_specialists: {
    en: 'Consultant Specialists',
    ur: 'کنسلٹنٹ سپیشلسٹس',
  },
  section_medical_advisory: {
    en: 'Medical Advisory',
    ur: 'طبی خدمات',
  },
  section_how_to_book: {
    en: 'How to Book Your Appointment',
    ur: 'اپوائنٹمنٹ بک کرنے کا آسان طریقہ',
  },
  section_how_to_book_desc: {
    en: 'Follow our simple 4-step process to secure consultation with our medical consultants.',
    ur: 'ہمارے سپیشلسٹ ڈاکٹرز سے معائنے کا وقت حاصل کرنے کے لیے یہ 4 آسان مراحل طے کریں۔',
  },
  section_track_status_title: {
    en: 'Track Your Appointment Status Online',
    ur: 'اپنی اپوائنٹمنٹ کی صورتحال آن لائن چیک کریں',
  },
  section_track_status_desc: {
    en: 'Already booked an appointment? Check the status of your reservation with your Phone / WhatsApp number or Appointment ID.',
    ur: 'کیا آپ پہلے سے اپوائنٹمنٹ درج کر چکے ہیں؟ اپنے فون / واٹس ایپ نمبر یا اپوائنٹمنٹ آئی ڈی سے تازہ ترین صورتحال معلوم کریں۔',
  },
  btn_check_status_now: {
    en: 'Check Appointment Status',
    ur: 'اپوائنٹمنٹ اسٹیٹس چیک کریں',
  },

  // Highlights / Features
  feature_patient_support_title: {
    en: 'Patient Support',
    ur: 'مریضوں کی رہنمائی',
  },
  feature_patient_support_desc: {
    en: 'Prompt outpatient assistance and scheduling desk for all patients.',
    ur: 'تمام مریضوں کے لیے بروقت رہنمائی اور کلینیکل ڈیسک سروس۔',
  },
  feature_prof_doctors_title: {
    en: 'Professional Doctors',
    ur: 'ماہر و تجربہ کار ڈاکٹرز',
  },
  feature_prof_doctors_desc: {
    en: 'Consult certified medical specialists, surgeons, and gynecologists.',
    ur: 'سند یافتہ میڈیکل سپیشلسٹس، سرجنز اور ماہر امراض نسواں سے مشاورت۔',
  },
  feature_easy_booking_title: {
    en: 'Appointment Booking',
    ur: 'آسان اپوائنٹمنٹ بکنگ',
  },
  feature_easy_booking_desc: {
    en: 'Quick 4-step reservation with instant appointment slip generation.',
    ur: '4 آسان مراحل میں بکنگ اور فوری اپوائنٹمنٹ سلپ کا حصول۔',
  },
  feature_specialists_title: {
    en: 'Specialist Doctors',
    ur: 'مستند سپیشلسٹ معالجین',
  },
  feature_specialists_desc: {
    en: 'Dedicated outpatient care with qualified and experienced consultants.',
    ur: 'اہل اور وسیع تجربہ کار ڈاکٹرز کی زیر نگرانی معیاری علاج۔',
  },

  // Booking Steps
  step_1_title: {
    en: 'Select Doctor',
    ur: 'ڈاکٹر کا انتخاب',
  },
  step_1_desc: {
    en: 'Choose your required medical specialist from our clinical roster.',
    ur: 'ہمارے معالجین کی فہرست سے متعلقہ شعبے کے ڈاکٹر منتخب کریں۔',
  },
  step_2_title: {
    en: 'Select Date',
    ur: 'تاریخ کا انتخاب',
  },
  step_2_desc: {
    en: 'Choose an available outpatient consultation day (Monday to Saturday).',
    ur: 'او پی ڈی کے لیے دستیاب تاریخ منتخب کریں (پیر تا ہفتہ)۔',
  },
  step_3_title: {
    en: 'Submit Details',
    ur: 'تفصیلات درج کریں',
  },
  step_3_desc: {
    en: 'Enter patient information, age, gender, and contact telephone/WhatsApp.',
    ur: 'مریض کا نام، عمر، جنس اور رابطہ فون یا واٹس ایپ نمبر درج کریں۔',
  },
  step_4_title: {
    en: 'Receive Confirmation',
    ur: 'تصدیق اور واٹس ایپ سلپ',
  },
  step_4_desc: {
    en: 'Receive your unique Appointment ID, printable slip, and WhatsApp notification.',
    ur: 'اپنی مخصوص اپوائنٹمنٹ آئی ڈی، پرنٹ ایبل سلپ اور واٹس ایپ نوٹیفکیشن حاصل کریں۔',
  },
  btn_start_booking_now: {
    en: 'Start Booking Process',
    ur: 'بکنگ کا آغاز کریں',
  },

  // Doctor Card & Doctor Profiles
  doc_zubair_name: {
    en: 'Dr. Syed Zubair Younis',
    ur: 'ڈاکٹر سید زبیر یونس',
  },
  doc_zubair_specialty: {
    en: 'Medical Specialist',
    ur: 'میڈیکل سپیشلسٹ',
  },
  doc_fozia_name: {
    en: 'Dr. Fozia Choudhary',
    ur: 'ڈاکٹر فوزیہ چوہدری',
  },
  doc_fozia_specialty: {
    en: 'Gynecologist / Consultant',
    ur: 'ماہر امراض نسواں (گائناکالوجسٹ)',
  },
  doc_arshad_name: {
    en: 'Dr. Muhammad Arshad',
    ur: 'ڈاکٹر محمد ارشد',
  },
  doc_arshad_specialty: {
    en: 'Rheumatologist',
    ur: 'ماہر امراض جوڑ و ہڈی (ریوماٹالوجسٹ)',
  },
  doc_umar_name: {
    en: 'Dr. Umar Farooq',
    ur: 'ڈاکٹر عمر فاروق',
  },
  doc_umar_specialty: {
    en: 'Laparoscopic Surgeon',
    ur: 'لیپروسکوپک سرجن',
  },
  badge_dual_shift: {
    en: 'Dual Shift',
    ur: 'صبح و شام',
  },
  badge_morning_consultant: {
    en: 'Morning Consultant',
    ur: 'صبح کے اوقات',
  },
  badge_saturday_specialist: {
    en: 'Saturday Specialist',
    ur: 'ہفتہ وار سپیشلسٹ',
  },
  badge_evening_consultant: {
    en: 'Evening Consultant',
    ur: 'شام کے اوقات',
  },
  badge_consultant: {
    en: 'Consultant',
    ur: 'کنسلٹنٹ',
  },
  days_mon_sat: {
    en: 'Monday – Saturday (Sunday Off)',
    ur: 'پیر تا ہفتہ (اتوار چھٹی)',
  },
  days_sat_only: {
    en: 'Every Saturday Only',
    ur: 'صرف ہر ہفتہ',
  },
  timing_zubair: {
    en: 'Morning: 9:00 AM – 2:00 PM | Evening: 5:00 PM – 8:00 PM',
    ur: 'صبح: 9:00 تا 2:00 دوپہر | شام: 5:00 تا 8:00 شام',
  },
  timing_fozia: {
    en: 'Morning: 9:00 AM – 2:00 PM',
    ur: 'صبح: 9:00 تا 2:00 دوپہر',
  },
  timing_arshad: {
    en: 'Saturday: 9:00 AM – 3:00 PM',
    ur: 'ہفتہ: 9:00 صبح تا 3:00 سہ پہر',
  },
  timing_umar: {
    en: 'Evening: 5:00 PM – 8:00 PM',
    ur: 'شام: 5:00 تا 8:00 شام',
  },
  label_available_days: {
    en: 'Available Days:',
    ur: 'دستیاب دن:',
  },
  label_consultation_timing: {
    en: 'Consultation Timing:',
    ur: 'مشاورت کا وقت:',
  },
  label_appointment_contact: {
    en: 'Appointment Contact:',
    ur: 'اپوائنٹمنٹ رابطہ:',
  },
  label_qualification: {
    en: 'Qualification:',
    ur: 'قابلیت:',
  },
  btn_view_profile: {
    en: 'View Profile',
    ur: 'پروفائل دیکھیں',
  },
  btn_book_doctor: {
    en: 'Book Appointment',
    ur: 'اپوائنٹمنٹ بک کریں',
  },

  // WhatsApp Notification Card (Specific feature)
  whatsapp_card_heading: {
    en: 'WhatsApp Notification',
    ur: 'واٹس ایپ نوٹیفکیشن',
  },
  whatsapp_status_ready: {
    en: 'Ready to Open',
    ur: 'کھولنے کے لیے تیار',
  },
  whatsapp_status_opened: {
    en: 'Opened',
    ur: 'کھول دیا گیا',
  },
  whatsapp_card_message: {
    en: "Your appointment confirmation message is ready. If WhatsApp Web didn't open automatically, click below:",
    ur: 'آپ کی اپوائنٹمنٹ کی تصدیقی تفصیلات کا پیغام تیار ہے۔ اگر واٹس ایپ ویب خودکار طور پر نہ کھلے تو نیچے کلک کریں:',
  },
  whatsapp_btn_open: {
    en: 'Open WhatsApp Web',
    ur: 'اوپن واٹس ایپ ویب',
  },

  // Appointment Confirmation Page
  confirmation_heading: {
    en: 'Appointment Submitted Successfully',
    ur: 'اپوائنٹمنٹ کامیابی سے درج ہو گئی',
  },
  confirmation_subtext: {
    en: 'Your appointment request has been recorded. Our reception will review and confirm your slot. An automatic notification has been queued.',
    ur: 'آپ کی اپوائنٹمنٹ کی درخواست موصول ہو گئی ہے۔ ہمارا عملہ جائزہ لے کر وقت کی تصدیق کرے گا۔',
  },
  slip_official_title: {
    en: 'Official Appointment Slip',
    ur: 'سرکاری اپوائنٹمنٹ سلپ',
  },
  slip_appointment_id: {
    en: 'Appointment ID',
    ur: 'اپوائنٹمنٹ آئی ڈی',
  },
  slip_patient_name: {
    en: 'Patient Name',
    ur: 'مریض کا نام',
  },
  slip_age_gender: {
    en: 'Age & Gender',
    ur: 'عمر اور جنس',
  },
  slip_status: {
    en: 'Appointment Status',
    ur: 'اپوائنٹمنٹ اسٹیٹس',
  },
  slip_doctor: {
    en: 'Consultant Doctor',
    ur: 'کنسلٹنٹ ڈاکٹر',
  },
  slip_datetime: {
    en: 'Appointment Date & Time',
    ur: 'تاریخ اور وقت',
  },
  slip_contact_info: {
    en: 'Contact Information',
    ur: 'رابطے کی معلومات',
  },
  slip_instructions_title: {
    en: 'Clinic Instructions:',
    ur: 'کلینک کی ہدایات:',
  },
  slip_instruction_1: {
    en: 'Please arrive 10-15 minutes prior to your allocated time slot.',
    ur: 'برائے مہربانی اپنے مقررہ وقت سے 10 تا 15 منٹ قبل تشریف لائیں۔',
  },
  slip_instruction_2: {
    en: 'Bring your previous medical prescriptions or diagnostic reports if applicable.',
    ur: 'اگر پرانے طبی نسخے یا ٹیسٹ رپورٹس موجود ہوں تو ساتھ لائیں۔',
  },
  slip_instruction_3: {
    en: 'For inquiries or rescheduling, contact hospital reception: +92 315 6621341.',
    ur: 'کسی بھی سوال یا وقت کی تبدیلی کے لیے ہسپتال استقبالیہ پر رابطہ کریں: 923156621341+',
  },
  btn_print_appointment: {
    en: 'Print Appointment',
    ur: 'اپوائنٹمنٹ پرنٹ کریں',
  },
  btn_save_details: {
    en: 'Save Details',
    ur: 'تفصیلات محفوظ کریں',
  },
  btn_check_appointment_status: {
    en: 'Check Appointment Status',
    ur: 'اپوائنٹمنٹ اسٹیٹس چیک کریں',
  },

  // Wizard Steps
  step_doctor: {
    en: 'Select Doctor',
    ur: 'ڈاکٹر منتخب کریں',
  },
  step_datetime: {
    en: 'Date & Time',
    ur: 'تاریخ اور وقت',
  },
  step_patient: {
    en: 'Patient Info',
    ur: 'مریض کی تفصیل',
  },
  step_confirm: {
    en: 'Confirmation',
    ur: 'تصدیق',
  },

  // Form Fields & Labels
  form_full_name: {
    en: 'Full Name',
    ur: 'مکمل نام',
  },
  form_phone: {
    en: 'Phone Number',
    ur: 'فون نمبر',
  },
  form_whatsapp: {
    en: 'WhatsApp Number',
    ur: 'واٹس ایپ نمبر',
  },
  form_same_as_phone: {
    en: 'Same as phone number',
    ur: 'فون نمبر ہی واٹس ایپ ہے',
  },
  form_email: {
    en: 'Email Address',
    ur: 'ای میل ایڈریس',
  },
  form_age: {
    en: 'Age (Years)',
    ur: 'عمر (سال)',
  },
  form_gender: {
    en: 'Gender',
    ur: 'جنس',
  },
  gender_male: {
    en: 'Male',
    ur: 'مرد',
  },
  gender_female: {
    en: 'Female',
    ur: 'خاتون',
  },
  gender_other: {
    en: 'Other',
    ur: 'دیگر',
  },
  form_notes: {
    en: 'Reason for Consultation / Symptoms (Optional)',
    ur: 'طبی علامات یا وجہ معائنہ (اختیاری)',
  },
  btn_confirm_submit: {
    en: 'Confirm & Submit Appointment',
    ur: 'اپوائنٹمنٹ کی تصدیق و اندراج کریں',
  },
  btn_select_slot: {
    en: 'Select Available Time Slot',
    ur: 'دستیاب وقت منتخب کریں',
  },
  msg_select_date_first: {
    en: 'Please choose a consultation date to view available time slots.',
    ur: 'دستیاب اوقات دیکھنے کے لیے پہلے تاریخ کا انتخاب کریں۔',
  },
  msg_sunday_off: {
    en: 'Sunday is an official off-day for consultations. Please choose Monday to Saturday.',
    ur: 'اتوار کو کلینک میں چھٹی ہوتی ہے۔ برائے مہربانی پیر تا ہفتہ میں سے انتخاب کریں۔',
  },

  // Footer
  quick_navigation: {
    en: 'Quick Navigation',
    ur: 'اہم لنکس',
  },
  official_contacts: {
    en: 'Official Contacts',
    ur: 'سرکاری رابطے',
  },
  clinical_access: {
    en: 'Clinical Access',
    ur: 'کلینیکل رسائی',
  },
  diagnostic_partner: {
    en: 'Diagnostic Partner',
    ur: 'تشخیصی پارٹنر',
  },
  partner_lab_name: {
    en: 'Partner Lab: Lab With Ali',
    ur: 'پارٹنر لیب: لیب ود علی',
  },
  diagnostic_desc: {
    en: 'Diagnostic lab testing services provided in partnership with Lab With Ali:',
    ur: 'لیب ود علی کے اشتراک سے تشخیصی لیبارٹری ٹیسٹ کی سہولت دستیاب ہے:',
  },
  clinical_access_desc: {
    en: 'Authorized clinical staff and receptionists can access the administrative booking portal below:',
    ur: 'مجاز عملہ اور استقبالیہ حضرات انتظامی بکنگ پورٹل تک نیچے دیے گئے لنک سے رسائی حاصل کر سکتے ہیں:',
  },
  contacts_desc: {
    en: 'For consultation schedules and appointment reservations, call our desk directly:',
    ur: 'مشورے کے اوقات اور اپوائنٹمنٹ کے لیے براہ راست ہمارے ڈیسک پر کال کریں:',
  },
  copyright: {
    en: '© Zubair Medical Complex Jhelum. All rights reserved.',
    ur: '© زبیر میڈیکل کمپلیکس جہلم۔ تمام جملہ حقوق محفوظ ہیں۔',
  },
  footer_subtext: {
    en: 'Professional Healthcare & Specialist Consultation',
    ur: 'پیشہ ورانہ صحت کی دیکھ بھال اور ماہرانہ مشاورت',
  },

  // Common UI
  back: {
    en: 'Back',
    ur: 'پیچھے',
  },
  next: {
    en: 'Next',
    ur: 'اگلا',
  },
  optional: {
    en: '(Optional)',
    ur: '(اختیاری)',
  },
  required: {
    en: 'Required',
    ur: 'لازمی',
  },
  status_booked: {
    en: 'Booked',
    ur: 'بک ہو گئی',
  },
  status_checked: {
    en: 'Checked',
    ur: 'چیک ہو چکا',
  },
  status_pending: {
    en: 'Pending',
    ur: 'زیر التواء',
  },
  status_cancelled: {
    en: 'Cancelled',
    ur: 'منسوخ',
  },
  status_confirmed: {
    en: 'Confirmed',
    ur: 'تصدیق شدہ',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
  isUrdu: false,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('zmc_language');
    if (saved === 'ur' || saved === 'en') {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ur' ? 'rtl' : 'ltr';
    } else {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('zmc_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.body.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.body.style.fontFamily = lang === 'ur' ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', Tahoma, Arial, sans-serif" : "";
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ur' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key].en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isUrdu: language === 'ur',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
