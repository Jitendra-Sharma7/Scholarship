"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Calendar } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/Layout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { PublicScholarship } from "@/lib/data/public";
import { useNow, daysUntilFrom } from "@/lib/useNow";
import { formatDate } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ scholarships }: { scholarships: PublicScholarship[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const now = useNow();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

  const scholarshipsByDate = useMemo(() => {
    const map = new Map<string, PublicScholarship[]>();
    scholarships.forEach((s) => {
      if (!s.deadline) return;
      const date = new Date(s.deadline);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [scholarships]);

  const getScholarshipsForDate = (date: Date) => {
    const key = date.toISOString().split("T")[0];
    return scholarshipsByDate.get(key) || [];
  };

  const isToday = (date: Date) => {
    return date.getTime() === today.getTime();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.getTime() === selectedDate.getTime();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  const hasDeadlines = (date: Date) => {
    return getScholarshipsForDate(date).length > 0;
  };

  const getUrgencyForDate = (date: Date) => {
    const schs = getScholarshipsForDate(date);
    if (schs.length === 0) return "none";
    const days = now === null ? null : daysUntilFrom(now, date);
    if (days === null) return "none";
    if (days < 0) return "past";
    if (days <= 7) return "urgent";
    if (days <= 15) return "soon";
    if (days <= 30) return "warning";
    return "safe";
  };

  const renderDay = (day: number, isCurrent: boolean, date: Date) => {
    const schs = getScholarshipsForDate(date);
    const urgency = getUrgencyForDate(date);
    const isTodayDate = isToday(date);
    const isSelectedDate = isSelected(date);

    let bgClass = "bg-white";
    let borderClass = "border-secondary-200";
    let textClass = "text-secondary-900";

    if (isSelectedDate) {
      bgClass = "bg-primary-50";
      borderClass = "border-primary-300";
      textClass = "text-primary-900";
    } else if (isTodayDate) {
      bgClass = "bg-primary-50";
      borderClass = "border-primary-300";
      textClass = "text-primary-900";
    } else if (!isCurrent) {
      textClass = "text-secondary-400";
      bgClass = "bg-secondary-50";
    }

    if (urgency === "urgent") {
      borderClass = "border-red-300";
      if (!isSelectedDate && !isTodayDate) bgClass = "bg-red-50";
    } else if (urgency === "soon") {
      borderClass = "border-amber-300";
      if (!isSelectedDate && !isTodayDate) bgClass = "bg-amber-50";
    } else if (urgency === "warning") {
      borderClass = "border-warning-300";
      if (!isSelectedDate && !isTodayDate) bgClass = "bg-warning-50";
    } else if (urgency === "past") {
      textClass = "text-secondary-400 line-through";
      if (!isSelectedDate && !isTodayDate) bgClass = "bg-secondary-50";
    }

    return (
      <button
        key={day}
        onClick={() => {
          setSelectedDate(date);
          setShowDetails(schs.length > 0 ? date.toISOString().split("T")[0] : null);
        }}
        className={`relative aspect-square flex flex-col items-center justify-start p-1 rounded-lg border transition-all ${
          isCurrent ? "" : "opacity-60"
        } ${bgClass} ${borderClass} ${textClass} ${
          schs.length > 0 ? "cursor-pointer hover:shadow-md" : "cursor-default"
        }`}
        aria-label={`${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}${schs.length > 0 ? `, ${schs.length} deadline${schs.length > 1 ? "s" : ""}` : ""}`}
      >
        <span className="font-medium text-sm">{day}</span>
        {schs.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-0.5 justify-center">
            {schs.slice(0, 3).map((s) => (
              <span
                key={s.id}
                className={`h-1.5 w-1.5 rounded-full ${
                  urgency === "urgent" ? "bg-red-500" :
                  urgency === "soon" ? "bg-amber-500" :
                  urgency === "warning" ? "bg-warning-500" :
                  urgency === "past" ? "bg-secondary-400" : "bg-emerald-500"
                }`}
                title={s.title}
              />
            ))}
            {schs.length > 3 && (
              <span className="text-[10px] text-secondary-500">+{schs.length - 3}</span>
            )}
          </div>
        )}
        {isTodayDate && !isSelectedDate && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-600" />
        )}
      </button>
    );
  };

  const days = useMemo(() => {
    const result: (React.ReactNode | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const day = prevMonthLastDay - startingDayOfWeek + i + 1;
      const date = new Date(currentYear, currentMonth - 1, day);
      result.push(renderDay(day, false, date));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      result.push(renderDay(day, true, date));
    }

    const totalCells = result.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      result.push(renderDay(i, false, date));
    }

    return result;
  }, [currentYear, currentMonth, startingDayOfWeek, daysInMonth, prevMonthLastDay, scholarshipsByDate, now]);

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const selectedScholarships = selectedDate ? getScholarshipsForDate(selectedDate) : [];

  return (
    <div className="bg-secondary-50/50 min-h-screen py-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 mb-3">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Scholarship Timeline</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary-950">
                Scholarship Deadline Calendar
              </h1>
              <p className="mt-2 text-base text-secondary-600 max-w-2xl">
                Visualize application deadlines across the year. Never miss an intake.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-300 bg-white px-4 py-2 text-sm font-semibold text-secondary-700 hover:bg-secondary-50 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Today
              </button>
              <div className="flex gap-1 bg-white rounded-xl border border-secondary-200 p-1">
                <button
                  onClick={() => setViewMode("month")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "month" ? "bg-primary-600 text-white" : "text-secondary-700 hover:bg-secondary-100"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "week" ? "bg-primary-600 text-white" : "text-secondary-700 hover:bg-secondary-100"
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-xl border border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-secondary-900 text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-xl border border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mb-8 rounded-2xl border border-secondary-200 bg-white shadow-card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-secondary-200 bg-secondary-50">
            {DAY_NAMES.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0 p-1">
            {days.map((day, index) => (
              <div key={index} className="min-h-[100px]">{day}</div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-8 flex flex-wrap items-center gap-4 text-xs text-secondary-600">
          <span className="font-semibold text-secondary-900">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-warning-500" />
            <span>This Month</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>1-2 Weeks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Closing Soon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-secondary-400" />
            <span>Past</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-6 h-6 rounded-lg border-2 border-primary-300 bg-primary-50" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg border-2 border-primary-500 bg-primary-50" />
            <span>Selected</span>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="rounded-2xl border border-secondary-200 bg-white shadow-card p-6 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-secondary-900">
                Deadlines for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </h2>
              <button
                onClick={() => setShowDetails(null)}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Close
              </button>
            </div>

            {selectedScholarships.length === 0 ? (
              <p className="text-secondary-600 text-center py-8">
                No scholarship deadlines on this date.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedScholarships.map((s) => {
                  const days = now === null ? null : daysUntilFrom(now, s.deadline);
                  const isUrgent = days !== null && days > 0 && days <= 15;
                  const isClosed = days !== null && days <= 0;

                  return (
                    <Link
                      key={s.id}
                      href={`/scholarships/${s.slug}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-xs hover:shadow-sm hover:border-primary-200 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex flex-col items-center justify-center rounded-xl p-3 min-w-[70px] text-center ${
                          isClosed ? 'bg-secondary-100 text-secondary-500' :
                          isUrgent ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-primary-50 text-primary-700'
                        }`}>
                          <span className="text-xs font-bold uppercase">
                            {new Date(s.deadline).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span className="text-lg font-extrabold">
                            {new Date(s.deadline).getDate()}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-sm text-secondary-900 hover:text-primary-600 line-clamp-1">
                            {s.title}
                          </p>
                          <p className="text-xs text-secondary-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5">
                              <CountryFlag code={s.countryCode} name={s.countryName ?? undefined} size="xs" />
                              {s.countryName ?? "Global / multiple"}
                            </span>
                            <span>• {s.fundingType.replace('-', ' ').toUpperCase()} • {s.degreeLevels.join(', ')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isClosed ? 'bg-secondary-100 text-secondary-600' :
                          isUrgent ? 'bg-red-100 text-red-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isClosed ? 'Closed' : `${days} days remaining`}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}