"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock, Bell, Calendar, AlertCircle, CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { PublicScholarship } from "@/lib/data/public";
import { formatDate, getDeadlineLabel, getDeadlineUrgency } from "@/lib/utils";
import { useNow, daysUntilFrom } from "@/lib/useNow";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/Layout";
import { DeadlineAlertsSignup } from "./DeadlineAlertsSignup";

const deadlineCategories = [
  { id: "closing-soon", label: "Closing Soon", icon: AlertCircle, color: "bg-error-100 text-error-600", iconColor: "text-error-600" },
  { id: "upcoming", label: "Upcoming Deadlines", icon: Calendar, color: "bg-primary-100 text-primary-600", iconColor: "text-primary-600" },
  { id: "recently-updated", label: "Recently Updated", icon: Clock, color: "bg-success-100 text-success-600", iconColor: "text-success-600" },
];

interface DeadlineAlertsProps {
  closingSoon: PublicScholarship[];
  upcoming: PublicScholarship[];
  recentlyUpdated: PublicScholarship[];
}

export function DeadlineAlerts({ closingSoon, upcoming, recentlyUpdated }: DeadlineAlertsProps) {
  const [activeTab, setActiveTab] = useState("closing-soon");
  const now = useNow();

  const scholarshipsMap = {
    "closing-soon": closingSoon,
    "upcoming": upcoming,
    "recently-updated": recentlyUpdated,
  };

  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return { label: "No deadline", urgency: "unknown" };
    const daysLeft = now === null ? null : daysUntilFrom(now, deadline);
    const urgency = daysLeft === null ? "unknown" : daysLeft < 0 ? "closed" : daysLeft <= 7 ? "urgent" : daysLeft <= 15 ? "soon" : daysLeft <= 30 ? "warning" : "safe";
    return { label: getDeadlineLabel(urgency), urgency };
  };

  const activeCategory = deadlineCategories.find(c => c.id === activeTab);
  const activeScholarships = scholarshipsMap[activeTab as keyof typeof scholarshipsMap] || [];

  return (
    <section className="bg-secondary-900 py-16 sm:py-24 text-white" aria-labelledby="deadline-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-900/80 px-3 py-1 text-xs font-semibold text-primary-200 mb-4">
            <Bell className="h-3.5 w-3.5" />
            Deadline Alerts
          </div>
          <h2 id="deadline-heading" className="text-3xl sm:text-4xl font-extrabold">
            Never Miss a Scholarship Deadline
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-secondary-400">
            Track closing soon, upcoming, and recently updated scholarships. Set up personalized alerts from your dashboard.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Deadline categories">
          {deadlineCategories.map((category) => (
            <button
              key={category.id}
              role="tab"
              aria-selected={activeTab === category.id}
              aria-controls={`panel-${category.id}`}
              id={`deadline-tab-${category.id}`}
              onClick={() => setActiveTab(category.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === category.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-secondary-800 text-secondary-300 hover:bg-secondary-700 hover:text-white"
              }`}
            >
              <category.icon className="h-4 w-4" style={{ color: category.iconColor.replace("text-", "") }} />
              {category.label}
            </button>
          ))}
        </div>

        <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`deadline-tab-${activeTab}`}>
          {activeScholarships.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-secondary-700 bg-secondary-800/50 p-12 text-center text-sm text-secondary-400">
              No scholarships found for this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeScholarships.map((sch) => {
                const { label, urgency } = getDeadlineStatus(sch.deadline);
                return (
                  <Link
                    key={sch.id}
                    href={`/scholarships/${sch.slug}`}
                    className="group rounded-2xl border border-secondary-700 bg-secondary-800 p-4 shadow-card transition-all hover:border-primary-800 hover:bg-secondary-750"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-xs uppercase tracking-wider",
                            sch.fundingType === "fully-funded" && "bg-success-500/20 text-success-400 border-success-500/30",
                            sch.fundingType === "fully-tuition" && "bg-primary-500/20 text-primary-400 border-primary-500/30",
                            sch.fundingType === "partial-tuition" && "bg-warning-500/20 text-warning-400 border-warning-500/30",
                            "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          )}>
                            {sch.fundingType.replace("-", " ")}
                          </span>
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                            urgency === "urgent" && "bg-error-500/20 text-error-400",
                            urgency === "soon" && "bg-warning-500/20 text-warning-400",
                            urgency === "warning" && "bg-primary-500/20 text-primary-400",
                            urgency === "safe" && "bg-success-500/20 text-success-400",
                            "bg-secondary-700 text-secondary-400"
                          )}>
                            {label}
                          </span>
                        </div>
                        <h3 className="font-bold text-white group-hover:text-primary-300 transition-colors line-clamp-1">{sch.title}</h3>
                        <p className="mt-1 text-xs text-secondary-400 flex items-center gap-1">
                          {sch.providerName || "Official Organization"}
                          {sch.universityName && ` • ${sch.universityName}`}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-secondary-500">
                          <CountryFlag code={sch.countryCode} name={sch.countryName ?? undefined} size="xs" />
                          <span>{sch.countryName || "Global"}</span>
                          <span>•</span>
                          <span>{sch.degreeLevels.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-secondary-700 flex items-center justify-between">
                      <span className="text-xs text-secondary-400">Deadline: {formatDate(sch.deadline)}</span>
                      <span className="text-xs font-medium text-primary-400 group-hover:text-primary-300">View Details →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          <DeadlineAlertsSignup />
        </div>

        <div className="mt-10 rounded-2xl border border-secondary-700 bg-secondary-800/50 p-6 sm:p-8">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-400" />
            Get Personalized Deadline Reminders
          </h3>
          <p className="text-sm text-secondary-400 mb-4">
            Create a free account to receive automated email reminders at 30, 15, 7, and 1 day before scholarship deadlines.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm text-secondary-300">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-400 shrink-0" /><span>30-day advance notice</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-400 shrink-0" /><span>15-day reminder</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-400 shrink-0" /><span>7-day urgent alert</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-400 shrink-0" /><span>1-day final reminder</span></div>
          </div>
          <div className="mt-6 text-center">
            <a href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-primary-700">
              <Bell className="h-5 w-5" />
              Set Up Deadline Alerts
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}