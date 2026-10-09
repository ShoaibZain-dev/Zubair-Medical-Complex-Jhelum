'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { Doctor, DoctorSchedule } from '@/types';
import { 
  Stethoscope, Calendar, Clock, Edit2, CheckCircle2, 
  XCircle, AlertCircle, Save, Loader2, Award, Phone 
} from 'lucide-react';

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-zubair');
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/admin/login');
        } else if (data.user.role !== 'Admin') {
          // Receptionists cannot manage doctors/schedules
          router.push('/admin/dashboard');
        } else {
          setCurrentUser(data.user);
          loadData();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadData = () => {
    Promise.all([
      fetch('/api/doctors?includeInactive=true').then(r => r.json()),
      fetch('/api/schedules').then(r => r.json())
    ]).then(([docs, schs]) => {
      setLoading(false);
      if (Array.isArray(docs)) setDoctors(docs);
      if (Array.isArray(schs)) {
        setSchedules(schs);
        const match = schs.find(s => s.doctor_id === 'doc-zubair');
        if (match) setSlotDuration(match.slot_duration);
      }
    }).catch(() => setLoading(false));
  };

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
      }
    } catch {
      alert('Failed to update doctor status');
    }
  };

  const handleUpdateSlotDuration = async () => {
    setSavingSchedule(true);
    setSaveSuccess(false);

    try {
      // Update all schedules for selected doctor with new slot duration
      const docSchedules = schedules.filter(s => s.doctor_id === selectedDoctorId);
      for (const sch of docSchedules) {
        await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sch.id,
            updates: { slot_duration: slotDuration }
          })
        });
      }

      setSavingSchedule(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadData();
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Doctor & Schedule Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure consultation timings, slot durations, and active statuses for consulting specialists.
          </p>
        </div>

        {/* Doctor List Cards */}
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
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#1E90FF] bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-[#1E90FF] bg-blue-100/70 px-2 py-0.5 rounded">
                    {doc.specialty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDoctorStatus(doc);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {doc.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">{doc.name}</h3>
                {doc.qualification && (
                  <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                )}
                <div className="text-[11px] text-slate-600 mt-2 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {doc.contact}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Doctor Schedule & Slot Configuration */}
        {selectedDoctor && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider block">
                  Configuring Schedules
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedDoctor.name} ({selectedDoctor.specialty})
                </h2>
              </div>

              {/* Slot Duration Configurator */}
              <div className="flex items-center gap-3">
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-xs flex items-center gap-1.5"
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
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Active Consultation Shifts</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Day of Week</th>
                      <th className="py-3 px-4">Shift Period</th>
                      <th className="py-3 px-4">Consultation Hours</th>
                      <th className="py-3 px-4">Slot Interval</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDoctorSchedules.map(sch => (
                      <tr key={sch.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{sch.day_of_week}</td>
                        <td className="py-3 px-4 capitalize font-semibold text-slate-700">{sch.period}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {sch.start_time} – {sch.end_time}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {sch.slot_duration} mins per patient
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
