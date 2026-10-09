'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Calendar, Clock, User, Stethoscope, Activity, 
  AlertCircle, ArrowRight, Phone, ShieldCheck, CheckCircle2, XCircle, Loader2 
} from 'lucide-react';

interface SearchResult {
  id: string;
  appointment_id: string;
  patient_name: string;
  phone: string;
  whatsapp: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  created_at: string;
}

function StatusSearchComponent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [query, setQuery] = useState(initialId);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = (searchVal: string) => {
    if (!searchVal.trim()) {
      setError('Please enter your Appointment ID or registered Phone/WhatsApp number.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    fetch(`/api/appointments/search?q=${encodeURIComponent(searchVal.trim())}`)
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      })
      .catch(() => {
        setLoading(false);
        setError('An error occurred while querying appointment status.');
      });
  };

  useEffect(() => {
    if (initialId) {
      performSearch(initialId);
    }
  }, [initialId]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#1E90FF] border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-10">
      {/* Search Input Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            <input
              type="text"
              placeholder="Search by Appointment ID (e.g. ZMC-84291) or Phone (e.g. 0318...)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-12 pr-32 py-3.5 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF] transition-all font-medium"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-6 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] to-[#FFDF33] hover:brightness-105 border border-amber-300 shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Status'}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      {/* Results Section */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
            <span>Search Results: {results?.length || 0} appointment(s) found</span>
          </div>

          {results && results.length > 0 ? (
            <div className="space-y-4">
              {results.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-black text-[#1E90FF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {item.appointment_id}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {item.patient_name}
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">
                          {item.phone}
                        </span>
                      </div>
                    </div>

                    <div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold">Doctor & Specialty</span>
                      <strong className="text-slate-900 block text-sm">{item.doctor_name}</strong>
                      <span className="text-[#1E90FF] font-medium">{item.specialty}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Appointment Date</span>
                      <strong className="text-slate-900 block text-sm">{item.appointment_date}</strong>
                      <span className="text-slate-500">Scheduled Outpatient</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Appointment Time</span>
                      <strong className="text-emerald-700 block text-sm">{item.appointment_time}</strong>
                      <span className="text-slate-500">Please arrive 15 min early</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/appointments/confirmation/${item.appointment_id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E90FF] hover:underline"
                    >
                      <span>View Printable Slip</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">No Appointments Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                No appointment matches your search query. Please confirm your Appointment ID (e.g. ZMC-84291) or phone number, or contact the clinic reception.
              </p>
              <div className="pt-2">
                <Link
                  href="/appointments/book"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#FFD700] shadow-sm hover:brightness-105"
                >
                  Book New Appointment
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckAppointmentStatusPage() {
  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Check Appointment Status
        </h1>
        <p className="text-sm text-slate-500">
          Enter your <strong className="text-slate-800">Appointment ID</strong> (e.g. ZMC-84291) or your <strong className="text-slate-800">Phone / WhatsApp Number</strong> to view your latest consultation status.
        </p>
      </div>

      <Suspense fallback={
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1E90FF] mx-auto mb-2" />
          <span className="text-xs text-slate-500 font-semibold">Loading search portal...</span>
        </div>
      }>
        <StatusSearchComponent />
      </Suspense>
    </div>
  );
}
