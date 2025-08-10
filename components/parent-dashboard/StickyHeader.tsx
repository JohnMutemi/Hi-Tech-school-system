"use client";

import React, { useState, useEffect } from "react";

// Date/Time Widget Component with hydration fix
function DateTimeWidget() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [mounted]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Prevent hydration mismatch by not rendering time until mounted
  if (!mounted || !currentTime) {
    return (
      <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 shadow-lg">
        <div className="text-right">
          <div className="text-white text-sm font-semibold">
            Loading...
          </div>
          <div className="text-indigo-200 text-lg font-bold">
            --:--:--
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 shadow-lg">
      <div className="text-right">
        <div className="text-white text-sm font-semibold">
          {formatDate(currentTime)}
        </div>
        <div className="text-indigo-200 text-lg font-bold">
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  );
}

interface StickyHeaderProps {
  parent?: any;
}

export default function StickyHeader({ parent }: StickyHeaderProps) {
  return (
    <header className="w-full px-8 lg:px-12 pt-6 pb-4 backdrop-blur-md bg-white/15 border-b border-white/30 sticky top-0 z-50 shadow-xl shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-full">
        <div className="flex-1 flex justify-center sm:justify-start">
          <h1 className="text-white text-xl lg:text-2xl xl:text-3xl font-bold tracking-normal drop-shadow-lg bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent text-center sm:text-left leading-relaxed">
            Welcome, {parent?.schoolName || parent?.school?.name || 'Malioni Primary'}!
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <DateTimeWidget />
        </div>
      </div>
    </header>
  );
}

