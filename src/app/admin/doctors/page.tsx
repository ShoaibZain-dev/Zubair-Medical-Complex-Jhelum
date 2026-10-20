'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { Doctor, DoctorSchedule, DayOfWeek, isHospitalAdminOrAbove } from '@/types';
import { 
  Stethoscope, Calendar, Clock, Edit2, CheckCircle2, 
  XCircle, AlertCircle, Save, Loader2, Award, Phone,
  Plus, Trash2, Upload, Camera, X, Check, ArrowRight, UserCheck
} from 'lucide-react';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Doctor Modals
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [submittingDoctor, setSubmittingDoctor] = useState(false);

  // Doctor Form State
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docQualification, setDocQualification] = useState('');
  const [docContact, setDocContact] = useState('');
  const [docSocialMedia, setDocSocialMedia] = useState('');
  const [docActive, setDocActive] = useState(true);
  const [docAvatarUrl, setDocAvatarUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schedule Shift Modals
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<DoctorSchedule | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<DoctorSchedule | null>(null);
  const [submittingShift, setSubmittingShift] = useState(false);

  // Shift Form State
  const [shiftDay, setShiftDay] = useState<DayOfWeek>('Monday');
  const [shiftPeriod, setShiftPeriod] = useState<'morning' | 'evening' | 'general'>('morning');
  const [shiftStartTime, setShiftStartTime] = useState('09:00');
  const [shiftEndTime, setShiftEndTime] = useState('14:00');
  const [shiftSlotDuration, setShiftSlotDuration] = useState(30);
  const [shiftActive, setShiftActive] = useState(true);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/admin/login');
        } else if (!isHospitalAdminOrAbove(data.user.role)) {
          router.push('/admin/dashboard');
        } else {
          setCurrentUser(data.user);
          loadData();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = () => {
    Promise.all([
      fetch('/api/doctors?includeInactive=true').then(r => r.json()),
      fetch('/api/schedules').then(r => r.json())
    ]).then(([docs, schs]) => {
      setLoading(false);
      if (Array.isArray(docs)) {
        setDoctors(docs);
        if (docs.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docs[0].id);
        }
      }
      if (Array.isArray(schs)) {
        setSchedules(schs);
        const match = schs.find(s => s.doctor_id === (selectedDoctorId || docs[0]?.id));
        if (match) setSlotDuration(match.slot_duration);
      }
    }).catch(() => setLoading(false));
  };

  // Helper to compress image in the browser before upload to prevent payload limit issues
  const compressImage = async (file: File, maxDim = 800, quality = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type)) {
      alert('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (rawFile.size > 8 * 1024 * 1024) {
      alert('Photo file size must not exceed 8MB.');
      return;
    }

    setUploadingPhoto(true);

    try {
      const file = await compressImage(rawFile, 800, 0.85);
      const formData = new FormData();
      formData.append('file', file);
      if (docAvatarUrl) {
        formData.append('previousPhotoUrl', docAvatarUrl);
      }

      const res = await fetch('/api/doctors/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadingPhoto(false);

      if (!res.ok) {
        alert(data.error || 'Failed to upload doctor photo.');
        return;
      }

      setDocAvatarUrl(data.url);
      showNotification('success', 'Profile photo uploaded successfully.');
    } catch {
      setUploadingPhoto(false);
      alert('Network error while uploading photo.');
    }
  };

  // Open Add Doctor Modal
  const openAddDoctor = () => {
    setDocName('');
    setDocSpecialty('');
    setDocQualification('');
    setDocContact('0318-3621341');
    setDocSocialMedia('');
    setDocActive(true);
    setDocAvatarUrl('');
    setShowAddDoctorModal(true);
  };

  // Open Edit Doctor Modal
  const openEditDoctor = (doc: Doctor) => {
    setDoctorToEdit(doc);
    setDocName(doc.name);
    setDocSpecialty(doc.specialty);
    setDocQualification(doc.qualification || '');
    setDocContact(doc.contact);
    setDocSocialMedia(doc.social_media || '');
    setDocActive(doc.active);
    setDocAvatarUrl(doc.avatar_url || '');
    setShowEditDoctorModal(true);
  };

  // Submit Add Doctor
  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docSpecialty.trim() || !docContact.trim()) {
      alert('Name, specialty, and contact number are required.');
      return;
    }

    setSubmittingDoctor(true);
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName.trim(),
          specialty: docSpecialty.trim(),
          qualification: docQualification.trim() || undefined,
          contact: docContact.trim(),
          social_media: docSocialMedia.trim() || undefined,
          avatar_url: docAvatarUrl || undefined,
          active: docActive
        })
      });

      const data = await res.json();
      setSubmittingDoctor(false);

      if (!res.ok) {
        alert(data.error || 'Failed to add doctor.');
        return;
      }

      setShowAddDoctorModal(false);
      setSelectedDoctorId(data.id);
      showNotification('success', `Dr. ${data.name} added successfully!`);
      loadData();
    } catch {
      setSubmittingDoctor(false);
      alert('Connection error while adding doctor.');
    }
  };

  // Submit Edit Doctor
  const handleEditDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorToEdit) return;

    setSubmittingDoctor(true);
    try {
      const res = await fetch(`/api/doctors/${doctorToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName.trim(),
          specialty: docSpecialty.trim(),
          qualification: docQualification.trim() || undefined,
          contact: docContact.trim(),
          social_media: docSocialMedia.trim() || undefined,
          avatar_url: docAvatarUrl || undefined,
          active: docActive
        })
      });

      const data = await res.json();
      setSubmittingDoctor(false);

      if (!res.ok) {
        alert(data.error || 'Failed to update doctor.');
        return;
      }

      setShowEditDoctorModal(false);
      setDoctorToEdit(null);
      showNotification('success', `Doctor ${data.name} updated successfully.`);
      loadData();
    } catch {
      setSubmittingDoctor(false);
      alert('Connection error while updating doctor.');
    }
  };

  // Toggle Doctor Active Status
  const handleToggleDoctorStatus = async (doctor: Doctor) => {
    const newStatus = !doctor.active;
    try {
      const res = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus })
      });
      if (res.ok) {
        setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, active: newStatus } : d));
        showNotification('success', `${doctor.name} is now ${newStatus ? 'Active' : 'Inactive'}.`);
      } else {
        alert('Failed to update doctor status');
      }
    } catch {
      alert('Failed to update doctor status');
    }
  };

  // Safe Remove Doctor
  const handleConfirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    try {
      const res = await fetch(`/api/doctors/${doctorToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();

      setDoctorToDelete(null);

      if (!res.ok) {
        alert(data.error || 'Failed to remove doctor.');
        return;
      }

      if (data.deactivated) {
        showNotification('success', data.message);
      } else {
        showNotification('success', data.message || 'Doctor removed successfully.');
      }
      loadData();
    } catch {
      alert('Network error while removing doctor.');
    }
  };

  // Open Add Shift Modal
  const openAddShift = () => {
    setShiftToEdit(null);
    setShiftDay('Monday');
    setShiftPeriod('morning');
    setShiftStartTime('09:00');
    setShiftEndTime('14:00');
    setShiftSlotDuration(slotDuration || 30);
    setShiftActive(true);
    setShowShiftModal(true);
  };

  // Open Edit Shift Modal
  const openEditShift = (sch: DoctorSchedule) => {
    setShiftToEdit(sch);
    setShiftDay(sch.day_of_week);
    setShiftPeriod(sch.period || 'morning');
    setShiftStartTime(sch.start_time.slice(0, 5));
    setShiftEndTime(sch.end_time.slice(0, 5));
    setShiftSlotDuration(sch.slot_duration);
    setShiftActive(sch.active);
    setShowShiftModal(true);
  };

  // Submit Add or Edit Shift
  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return;

    setSubmittingShift(true);
    try {
      if (shiftToEdit) {
        // Update
        const res = await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: shiftToEdit.id,
            updates: {
              day_of_week: shiftDay,
              period: shiftPeriod,
              start_time: shiftStartTime,
              end_time: shiftEndTime,
              slot_duration: shiftSlotDuration,
              active: shiftActive
            }
          })
        });

        const data = await res.json();
        setSubmittingShift(false);

        if (!res.ok) {
          alert(data.error || 'Failed to update shift.');
          return;
        }

        setShowShiftModal(false);
        showNotification('success', 'Consultation shift updated successfully.');
        loadData();
      } else {
        // Create
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_id: selectedDoctorId,
            day_of_week: shiftDay,
            period: shiftPeriod,
            start_time: shiftStartTime,
            end_time: shiftEndTime,
            slot_duration: shiftSlotDuration,
            active: shiftActive
          })
        });

        const data = await res.json();
        setSubmittingShift(false);

        if (!res.ok) {
          alert(data.error || 'Failed to create shift.');
          return;
        }

        setShowShiftModal(false);
        showNotification('success', 'New consultation shift added successfully.');
        loadData();
      }
    } catch {
      setSubmittingShift(false);
      alert('Network error while saving shift.');
    }
  };

  // Toggle Shift Status
  const handleToggleShiftStatus = async (sch: DoctorSchedule) => {
    const newStatus = !sch.active;
    try {
      const res = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sch.id,
          updates: { active: newStatus }
        })
      });
      if (res.ok) {
        setSchedules(prev => prev.map(s => s.id === sch.id ? { ...s, active: newStatus } : s));
        showNotification('success', `Shift on ${sch.day_of_week} is now ${newStatus ? 'Active' : 'Inactive'}.`);
      }
    } catch {
      alert('Failed to update shift status.');
    }
  };

  // Delete Shift
  const handleConfirmDeleteShift = async () => {
    if (!shiftToDelete) return;
    try {
      const res = await fetch(`/api/schedules?id=${shiftToDelete.id}`, { method: 'DELETE' });
      setShiftToDelete(null);
      if (res.ok) {
        showNotification('success', 'Consultation shift removed safely.');
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete shift.');
      }
    } catch {
      alert('Network error while deleting shift.');
    }
  };

  // Batch Update Slot Duration
  const handleUpdateSlotDuration = async () => {
    setSavingSchedule(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          slot_duration: slotDuration
        })
      });

      setSavingSchedule(false);
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        loadData();
      } else {
        alert('Failed to save slot duration');
      }
    } catch {
      setSavingSchedule(false);
      alert('Failed to save slot duration');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
      </div>
    );
  }

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const selectedDoctorSchedules = schedules.filter(s => s.doctor_id === selectedDoctorId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNavbar userRole={currentUser?.role} userName={currentUser?.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Doctor & Schedule Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Configure specialist profiles, photos, consultation timings, and booking slot durations.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddDoctor}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Specialist Doctor</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border animate-in fade-in ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Doctor List Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Consulting Specialists ({doctors.length})
            </h2>
            <span className="text-[11px] text-slate-400">Click a doctor to manage their weekly schedule</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {doctors.map(doc => {
              const isSelected = selectedDoctorId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctorId(doc.id);
                    const firstSch = schedules.find(s => s.doctor_id === doc.id);
                    if (firstSch) setSlotDuration(firstSch.slot_duration);
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1E90FF] bg-blue-50/40 shadow-sm ring-1 ring-[#1E90FF]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Header: Specialty & Active Toggle */}
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className="text-[10px] font-bold text-[#1E90FF] bg-blue-100/70 px-2 py-0.5 rounded truncate">
                        {doc.specialty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDoctorStatus(doc);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 cursor-pointer transition-colors ${
                          doc.active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Click to toggle Active status"
                      >
                        {doc.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* Doctor Info & Photo */}
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                        {doc.avatar_url ? (
                          <img 
                            src={doc.avatar_url} 
                            alt={doc.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <UserCheck className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug truncate">
                          {doc.name}
                        </h3>
                        {doc.qualification ? (
                          <p className="text-[11px] text-slate-500 truncate">{doc.qualification}</p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Specialist</p>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 mt-2 font-mono flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{doc.contact}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDoctor(doc);
                      }}
                      className="inline-flex items-center gap-1 text-[#1E90FF] hover:text-blue-700 font-bold text-[11px] cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDoctorToDelete(doc);
                      }}
                      className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                      title="Safe Remove / Deactivate"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Doctor Schedule & Slot Configuration */}
        {selectedDoctor && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                  {selectedDoctor.avatar_url ? (
                    <img 
                      src={selectedDoctor.avatar_url} 
                      alt={selectedDoctor.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Stethoscope className="w-7 h-7 text-[#1E90FF]" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider block">
                    Configuring Schedules
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedDoctor.name} ({selectedDoctor.specialty})
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedDoctorSchedules.length} shifts configured • {selectedDoctor.active ? 'Active Specialist' : 'Inactive Specialist'}
                  </p>
                </div>
              </div>

              {/* Slot Duration Configurator */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <label className="block text-xs font-bold text-slate-700">Slot Duration</label>
                  <span className="text-[10px] text-slate-400">Affects time slots instantly</span>
                </div>
                <select
                  value={slotDuration}
                  onChange={e => setSlotDuration(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>

                <button
                  type="button"
                  disabled={savingSchedule}
                  onClick={handleUpdateSlotDuration}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {savingSchedule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Slot Duration</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Slot duration updated successfully and immediately reflected on the public booking portal!</span>
              </div>
            )}

            {/* Schedule Shifts Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Weekly Consultation Shifts</h3>
                  <p className="text-xs text-slate-500">Scheduled days and patient consultation hours</p>
                </div>

                <button
                  type="button"
                  onClick={openAddShift}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E90FF] hover:bg-blue-600 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Consultation Shift</span>
                </button>
              </div>

              {selectedDoctorSchedules.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-medium">No consultation shifts configured for {selectedDoctor.name}.</p>
                  <button
                    type="button"
                    onClick={openAddShift}
                    className="text-xs font-bold text-[#1E90FF] hover:underline"
                  >
                    + Add first shift now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3 px-4">Day of Week</th>
                        <th className="py-3 px-4">Shift Period</th>
                        <th className="py-3 px-4">Consultation Hours</th>
                        <th className="py-3 px-4">Slot Interval</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDoctorSchedules.map(sch => (
                        <tr key={sch.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{sch.day_of_week}</td>
                          <td className="py-3.5 px-4 capitalize font-semibold text-slate-700">{sch.period || 'General'}</td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                            {sch.start_time.slice(0, 5)} – {sch.end_time.slice(0, 5)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {sch.slot_duration} mins
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleShiftStatus(sch)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                sch.active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Toggle shift active status"
                            >
                              {sch.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditShift(sch)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-[#1E90FF] hover:bg-blue-50 cursor-pointer"
                                title="Edit Shift"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setShiftToDelete(sch)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Delete Shift"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD DOCTOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#1E90FF]" />
                Add Specialist Doctor
              </h2>
              <button 
                type="button" 
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
              {/* Profile Photo Upload Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Doctor Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-[#1E90FF] animate-spin" />
                    ) : docAvatarUrl ? (
                      <img src={docAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      accept="image/jpeg,image/png,image/webp" 
                      className="hidden" 
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{docAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>

                      {docAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setDocAvatarUrl('')}
                          className="px-2 py-1.5 text-xs text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      JPG, PNG, or WebP (max 4 MB). Publicly displayed on website.
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Syed Zubair Younis"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Specialty & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Specialty *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medical Specialist"
                    value={docSpecialty}
                    onChange={e => setDocSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, FCPS"
                    value={docQualification}
                    onChange={e => setDocQualification(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Contact & Social Media */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Contact / Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="0318-3621341"
                    value={docContact}
                    onChange={e => setDocContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Social Profile / Username</label>
                  <input
                    type="text"
                    placeholder="e.g. zubairmedicalcomplex"
                    value={docSocialMedia}
                    onChange={e => setDocSocialMedia(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="add-doc-active"
                  checked={docActive}
                  onChange={e => setDocActive(e.target.checked)}
                  className="rounded text-[#1E90FF] w-4 h-4"
                />
                <label htmlFor="add-doc-active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Doctor is actively taking consultations
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoctor}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFDF33] border border-amber-300 text-slate-950 text-xs font-bold hover:brightness-105 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {submittingDoctor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Doctor Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: EDIT DOCTOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showEditDoctorModal && doctorToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#1E90FF]" />
                Edit Doctor Profile
              </h2>
              <button 
                type="button" 
                onClick={() => { setShowEditDoctorModal(false); setDoctorToEdit(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDoctorSubmit} className="space-y-4">
              {/* Profile Photo Upload Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Doctor Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-[#1E90FF] animate-spin" />
                    ) : docAvatarUrl ? (
                      <img src={docAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      accept="image/jpeg,image/png,image/webp" 
                      className="hidden" 
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{docAvatarUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                      </button>

                      {docAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setDocAvatarUrl('')}
                          className="px-2 py-1.5 text-xs text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      JPG, PNG, or WebP (max 4 MB). Stored in Supabase Storage.
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Full Name *</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Specialty & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Specialty *</label>
                  <input
                    type="text"
                    required
                    value={docSpecialty}
                    onChange={e => setDocSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Qualifications</label>
                  <input
                    type="text"
                    value={docQualification}
                    onChange={e => setDocQualification(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Contact & Social Media */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Contact / Phone *</label>
                  <input
                    type="text"
                    required
                    value={docContact}
                    onChange={e => setDocContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Social Profile / Username</label>
                  <input
                    type="text"
                    value={docSocialMedia}
                    onChange={e => setDocSocialMedia(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-doc-active"
                  checked={docActive}
                  onChange={e => setDocActive(e.target.checked)}
                  className="rounded text-[#1E90FF] w-4 h-4"
                />
                <label htmlFor="edit-doc-active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Doctor is actively taking consultations
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowEditDoctorModal(false); setDoctorToEdit(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoctor}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFDF33] border border-amber-300 text-slate-950 text-xs font-bold hover:brightness-105 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {submittingDoctor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: CONFIRM DELETE / DEACTIVATE DOCTOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Remove {doctorToDelete.name}?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If this doctor has historical patient appointments, their record will be <strong>safely deactivated</strong> instead of deleted to protect the patient database and historical records.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoctor}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 4: ADD / EDIT CONSULTATION SHIFT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E90FF]" />
                {shiftToEdit ? 'Edit Consultation Shift' : 'Add Consultation Shift'}
              </h2>
              <button 
                type="button" 
                onClick={() => setShowShiftModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShiftSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Day of Week</label>
                <select
                  value={shiftDay}
                  onChange={e => setShiftDay(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Shift Period</label>
                <select
                  value={shiftPeriod}
                  onChange={e => setShiftPeriod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="morning">Morning Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="general">General Clinic Hours</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Start Time</label>
                  <input
                    type="time"
                    required
                    value={shiftStartTime}
                    onChange={e => setShiftStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">End Time</label>
                  <input
                    type="time"
                    required
                    value={shiftEndTime}
                    onChange={e => setShiftEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Slot Duration (Minutes)</label>
                <select
                  value={shiftSlotDuration}
                  onChange={e => setShiftSlotDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value={15}>15 Minutes (Outpatient Quick)</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes (Standard Consultation)</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (Comprehensive)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="shift-active"
                  checked={shiftActive}
                  onChange={e => setShiftActive(e.target.checked)}
                  className="rounded text-[#1E90FF] w-4 h-4"
                />
                <label htmlFor="shift-active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Shift is currently active for booking
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingShift}
                  className="px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingShift ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{shiftToEdit ? 'Save Shift Changes' : 'Add Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 5: CONFIRM DELETE SHIFT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {shiftToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900">
              Delete Consultation Shift?
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete the <strong>{shiftToDelete.day_of_week} ({shiftToDelete.start_time} - {shiftToDelete.end_time})</strong> shift? Existing booked appointments will not be affected.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShiftToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShift}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Delete Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
