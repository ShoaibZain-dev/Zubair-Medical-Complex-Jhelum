'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MapPin, Navigation, ExternalLink, Compass } from 'lucide-react';

export default function LocationSection() {
  const pathname = usePathname();

  // Show only on the public website, not within the internal admin management portal
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const googleMapsUrl = 'https://maps.app.goo.gl/nK3fJt1X6o5zNmK87';

  return (
    <section className="bg-slate-900 border-t border-slate-800 py-12 sm:py-16 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-[#1E90FF]/30 text-[#00BFFF] text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Hospital Location</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Find Us on the Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Visit Zubair Medical Complex for outpatient specialist consultations and clinical healthcare services.
          </p>
        </div>

        {/* Clean, Professional Location Card */}
        <div className="max-w-3xl mx-auto bg-slate-800/90 rounded-3xl border border-slate-700/80 p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 rounded-full bg-[#1E90FF]/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-[#FFD700]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
            {/* Hospital Identity & Address */}
            <div className="space-y-4 text-center md:text-left flex-1">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E90FF]/20 to-[#00BFFF]/10 border border-[#1E90FF]/30 text-[#1E90FF] mx-auto md:mx-0 shadow-inner">
                <MapPin className="w-7 h-7 text-[#FFD700]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Zubair Medical Complex
                </h3>
                <p className="text-sm sm:text-base font-semibold text-slate-300 flex items-center justify-center md:justify-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Kala Gujran, Jhelum, Punjab, Pakistan
                </p>
              </div>

              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Easily accessible medical complex in Kala Gujran, Jhelum. Dedicated clinical facilities for specialist consultations and patient care.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto shrink-0">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#FFD700] via-[#FFDF33] to-[#FFD700] hover:brightness-105 active:scale-95 transition-all duration-150 shadow-md shadow-amber-400/20 border border-amber-300"
              >
                <Navigation className="w-4 h-4 text-slate-950 fill-current" />
                <span>Get Directions</span>
              </a>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-slate-700/80 hover:bg-slate-700 hover:text-white border border-slate-600/80 active:scale-95 transition-all duration-150 shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-[#00BFFF]" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
