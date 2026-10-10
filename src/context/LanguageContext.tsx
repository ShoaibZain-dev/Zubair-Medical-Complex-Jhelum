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
  hospital_tagline: {
    en: 'Your Health, our Expertise',
    ur: 'آپ کی صحت، ہماری مہارت',
  },
  hospital_address: {
    en: 'Kala Gujran, Jhelum, Punjab, Pakistan',
    ur: 'کالا گجراں، جہلم، پنجاب، پاکستان',
  },
  hospital_desc: {
    en: 'Professional healthcare and specialist consultation in Jhelum. Dedicated to providing patient-centered clinical care and trusted outpatient appointments.',
    ur: 'جہلم میں پیشہ ورانہ صحت کی دیکھ بھال اور ماہر ڈاکٹرز کے مشورے۔ مریضوں کی معیاری طبی نگہداشت کے لیے پرعزم۔',
  },

  // Navbar
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
  label_whatsapp: {
    en: 'WhatsApp',
    ur: 'واٹس ایپ',
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
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('zmc_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
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
