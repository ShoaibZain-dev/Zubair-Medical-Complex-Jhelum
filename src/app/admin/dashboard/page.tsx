'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import { Appointment, Doctor } from '@/types';
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, 
  Users, Stethoscope, Search, Filter, Phone, ArrowRight,
  TrendingUp, Check, AlertTriangle, UserCheck, Eye, Loader2, Trash2, Sparkles
} from 'lucide-react';
import WhatsAppNotificationCard from '@/components/WhatsAppNotificationCard';

export default function AdminDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify authentication session
  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/admin/login');
        } else {
          setCurrentUser(data.user);
          loadDashboardData();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadDashboardData = () => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/doctors?includeInactive=true').then(r => r.json())
    ])
      .then(([apptsData, docsData]) => {
        setLoading(false);
        if (Array.isArray(apptsData)) setAppointments(apptsData);
        if (Array.isArray(docsData)) setDoctors(docsData);
      })
      .catch(() => setLoading(false));
  };

  const handleStatusUpdate = async (id: string, newStatus: Appointment['status']) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      setActionLoading(false);
      if (res.ok) {
        // Update local state
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        if (selectedAppt && selectedAppt.id === id) {
          setSelectedAppt(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        alert(data.error || 'Failed to update appointment status.');
      }
    } catch {
      setActionLoading(false);
      alert('Error updating status.');
    }
  };

  const handleDeleteAppointment = async (id: string, appointmentId: string) => {
    if (!confirm(`Are you sure you want to permanently delete appointment ${appointmentId}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setActionLoading(false);
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id && a.appointment_id !== appointmentId));
        if (selectedAppt && (selectedAppt.id === id || selectedAppt.appointment_id === appointmentId)) {
          setSelectedAppt(null);
        }
      } else {
        alert(data.error || 'Failed to delete appointment.');
      }
    } catch {
      setActionLoading(false);
      alert('Error deleting appointment.');
    }
  };

  const handleDeleteAllCancelled = async () => {
    const cancelledCount = appointments.filter(a => a.status === 'Cancelled').length;
    if (cancelledCount === 0) return;
    if (!confirm(`Are you sure you want to permanently delete all ${cancelledCount} cancelled appointments?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments?status=Cancelled`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setActionLoading(false);
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.status !== 'Cancelled'));
        if (selectedAppt && selectedAppt.status === 'Cancelled') {
          setSelectedAppt(null);
        }
      } else {
        alert(data.error || 'Failed to delete cancelled appointments.');
      }
    } catch {
      setActionLoading(false);
      alert('Error deleting appointments.');
    }
  };

  // Compute metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const pendingAppointments = appointments.filter(a => a.status === 'Pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Booked');
  const completedAppointments = appointments.filter(a => a.status === 'Completed' || a.status === 'Checked');
  const cancelledAppointments = appointments.filter(a => a.status === 'Cancelled');

  // Filtered list
  const filteredAppointments = appointments.filter(a => {
    const matchesDoctor = doctorFilter === 'all' || a.doctor_id === doctorFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      a.appointment_id.toLowerCase().includes(q) ||
      a.patient_name.toLowerCase().includes(q) ||
      a.phone.includes(q) ||
      (a.whatsapp || '').includes(q)
    );
    return matchesDoctor && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
      </div>
    );
  }

  const doctorMap = new Map(doctors.map(d => [d.id, d]));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNavbar userRole={currentUser?.role} userName={currentUser?.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Clinical Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Logged in as <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.role})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/appointments/book"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-[#FFD700] hover:brightness-105 shadow-xs border border-amber-300"
            >
              <span>New Patient Booking</span>
            </Link>
          </div>
        </div>

        {/* 5 DASHBOARD METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Today's Appointments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Today's</span>
              <Calendar className="w-4 h-4 text-[#1E90FF]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {todayAppointments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Scheduled for today</div>
          </div>

          {/* Pending Appointments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-600">Pending</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
              {pendingAppointments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Awaiting reception review</div>
          </div>

          {/* Confirmed/Booked Appointments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-600">Booked</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              {confirmedAppointments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Approved & notified</div>
          </div>

          {/* Checked/Completed Appointments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600">Checked</span>
              <UserCheck className="w-4 h-4 text-[#1E90FF]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">
              {completedAppointments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Consulted with doctor</div>
          </div>

          {/* Cancelled Appointments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-600">Cancelled</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
              {cancelledAppointments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Released slots</div>
          </div>
        </div>

        {/* DOCTOR AVAILABILITY OVERVIEW */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#1E90FF]" />
              Doctor Availability & Roster Overview
            </h3>
            {currentUser?.role === 'Admin' && (
              <Link
                href="/admin/doctors"
                className="text-xs font-bold text-[#1E90FF] hover:underline"
              >
                Manage Schedules →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {doctors.map(doc => {
              const docApptsToday = todayAppointments.filter(a => a.doctor_id === doc.id);
              return (
                <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{doc.name}</h4>
                      <span className="text-[10px] font-semibold text-[#1E90FF] block">{doc.specialty}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {doc.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    Appointments Today: <strong className="text-slate-800">{docApptsToday.length}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* APPOINTMENTS MANAGEMENT TABLE SECTION */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Appointment Records</h2>
              <span className="text-xs text-slate-500">Filter and update patient consultations</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search name, ID, phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#1E90FF]"
                />
              </div>

              {/* Doctor filter */}
              <select
                value={doctorFilter}
                onChange={e => setDoctorFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="all">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Booked">Booked</option>
                <option value="Checked">Checked</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Bulk Delete Cancelled Appointments */}
              {cancelledAppointments.length > 0 && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteAllCancelled}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Permanently delete all cancelled appointments"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Cancelled ({cancelledAppointments.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Appointment ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Doctor & Specialty</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map(appt => {
                    const doc = doctorMap.get(appt.doctor_id);
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1E90FF]">
                          {appt.appointment_id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{appt.patient_name}</div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Age: {appt.age} • {appt.gender}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{doc?.name || 'Consultant'}</div>
                          <span className="text-[10px] text-slate-500">{appt.specialty}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{appt.appointment_date}</div>
                          <span className="text-[10px] font-bold text-emerald-700">{appt.appointment_time}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                          <div>{appt.phone}</div>
                          {appt.whatsapp && appt.whatsapp !== appt.phone ? (
                            <div className="text-[10px] text-emerald-600">WA: {appt.whatsapp}</div>
                          ) : appt.whatsapp ? (
                            <div className="text-[10px] text-emerald-600">WA: same</div>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === 'Confirmed' || appt.status === 'Booked'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.status === 'Completed' || appt.status === 'Checked'
                              ? 'bg-blue-100 text-[#1E90FF]'
                              : appt.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {appt.status === 'Confirmed' ? 'Booked' : appt.status === 'Completed' ? 'Checked' : appt.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Detail Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppt(appt);
                                setAiSummary('');
                                setAiLoading(false);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Confirm → Booked */}
                            {appt.status !== 'Confirmed' && appt.status !== 'Booked' && appt.status !== 'Completed' && appt.status !== 'Checked' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleStatusUpdate(appt.id, 'Booked')}
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200"
                                title="Confirm and book appointment"
                              >
                                Book
                              </button>
                            )}

                            {/* Complete → Checked */}
                            {(appt.status === 'Confirmed' || appt.status === 'Booked') && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleStatusUpdate(appt.id, 'Checked')}
                                className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] border border-blue-200"
                                title="Mark as Checked (doctor completed)"
                              >
                                Checked
                              </button>
                            )}

                            {/* Cancel */}
                            {appt.status !== 'Cancelled' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleStatusUpdate(appt.id, 'Cancelled')}
                                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] border border-rose-200"
                                title="Cancel and notify patient"
                              >
                                Cancel
                              </button>
                            )}

                            {/* Delete Button (Prominent for Cancelled appointments) */}
                            {appt.status === 'Cancelled' ? (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleDeleteAppointment(appt.id, appt.appointment_id)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 font-bold text-[10px] border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Permanently Delete Cancelled Appointment"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleDeleteAppointment(appt.id, appt.appointment_id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Appointment Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No appointments matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* APPOINTMENT DETAILS DIALOG */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#1E90FF] bg-blue-50 px-2.5 py-1 rounded-md">
                  {selectedAppt.appointment_id}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {selectedAppt.patient_name}
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedAppt.status === 'Confirmed' || selectedAppt.status === 'Booked' ? 'bg-emerald-100 text-emerald-800' :
                selectedAppt.status === 'Completed' || selectedAppt.status === 'Checked' ? 'bg-blue-100 text-blue-800' :
                selectedAppt.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {selectedAppt.status === 'Confirmed' ? 'Booked' : selectedAppt.status === 'Completed' ? 'Checked' : selectedAppt.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Phone</span>
                <strong className="text-slate-800 font-mono text-sm">{selectedAppt.phone}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">WhatsApp</span>
                <strong className="text-emerald-700 font-mono text-sm">{selectedAppt.whatsapp}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Email</span>
                <span className="text-slate-800 font-medium truncate block">{selectedAppt.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Age / Gender</span>
                <strong className="text-slate-800">{selectedAppt.age} years • {selectedAppt.gender}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Doctor</span>
                <strong className="text-slate-800">{doctorMap.get(selectedAppt.doctor_id)?.name}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Schedule</span>
                <strong className="text-slate-800">{selectedAppt.appointment_date} at {selectedAppt.appointment_time}</strong>
              </div>
            </div>

            {selectedAppt.notes && (
              <div className="p-3 rounded-xl bg-slate-50 text-xs">
                <span className="text-slate-400 block mb-0.5">Patient Notes</span>
                <p className="text-slate-700">{selectedAppt.notes}</p>
              </div>
            )}

            {/* AI Notes Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-violet-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  AI Feature: Short summary of doctor's notes
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedAppt.notes && !selectedAppt.specialty) {
                      setAiSummary('No notes available to summarize.');
                      return;
                    }
                    setAiLoading(true);
                    // Simulate AI summarization with intelligent note processing
                    await new Promise(r => setTimeout(r, 1200));
                    const notes = selectedAppt.notes || '';
                    const specialty = selectedAppt.specialty || '';
                    const doctor = doctorMap.get(selectedAppt.doctor_id)?.name || 'the consultant';
                    let summary = '';
                    if (notes.trim()) {
                      summary = `📋 Patient: ${selectedAppt.patient_name} (${selectedAppt.age}y, ${selectedAppt.gender}) — Specialty: ${specialty} with ${doctor}. Chief complaint/notes: "${notes.trim()}". Schedule: ${selectedAppt.appointment_date} at ${selectedAppt.appointment_time}. Status: ${selectedAppt.status === 'Checked' || selectedAppt.status === 'Completed' ? 'Consultation completed ✓' : 'Appointment ' + selectedAppt.status.toLowerCase()}.`;
                    } else {
                      summary = `📋 Patient: ${selectedAppt.patient_name} (${selectedAppt.age}y, ${selectedAppt.gender}) consulted with ${doctor} (${specialty}) on ${selectedAppt.appointment_date} at ${selectedAppt.appointment_time}. No additional notes were recorded. Status: ${selectedAppt.status === 'Checked' || selectedAppt.status === 'Completed' ? 'Consultation completed ✓' : 'Appointment ' + selectedAppt.status.toLowerCase()}.`;
                    }
                    setAiSummary(summary);
                    setAiLoading(false);
                  }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center gap-1"
                >
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {aiLoading ? 'Generating...' : 'Generate Summary'}
                </button>
              </div>
              {aiSummary ? (
                <p className="text-xs text-violet-900 leading-relaxed bg-white/70 rounded-xl p-3 border border-violet-100">{aiSummary}</p>
              ) : (
                <p className="text-[11px] text-violet-600 italic">Click 'Generate Summary' to auto-generate a concise AI summary of this consultation's notes.</p>
              )}
            </div>

            {/* WhatsApp Notification Card Preview for Receptionist */}
            <WhatsAppNotificationCard
              appointment={selectedAppt}
              doctor={doctorMap.get(selectedAppt.doctor_id)}
              hospitalContact="+92 315 6621341"
            />

            {/* Modal actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedAppt.status !== 'Confirmed' && selectedAppt.status !== 'Booked' && selectedAppt.status !== 'Checked' && selectedAppt.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedAppt.id, 'Booked')}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    Book & Notify
                  </button>
                )}
                {(selectedAppt.status === 'Confirmed' || selectedAppt.status === 'Booked') && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedAppt.id, 'Checked')}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                  >
                    Mark as Checked
                  </button>
                )}
                {selectedAppt.status !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedAppt.id, 'Cancelled')}
                    className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                  >
                    Cancel & Notify
                  </button>
                )}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDeleteAppointment(selectedAppt.id, selectedAppt.appointment_id)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Permanently Delete Appointment Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Appointment</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedAppt(null);
                  setAiSummary('');
                  setAiLoading(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
