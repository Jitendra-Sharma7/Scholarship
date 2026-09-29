"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Target, TrendingUp, Calendar, Award, Settings, LogOut, Search, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { useStore } from "@/lib/store/useStore";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { fetchPublicScholarshipsByIds } from "@/app/actions/public-actions";
import type { PublicScholarship } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import { useNow, daysUntilFrom } from "@/lib/useNow";

/**
 * The student's dashboard. The recommended shortlist is supplied by the server
 * page; only the saved list, whose ids live in this browser's storage, needs a
 * round trip, and it goes through a server action rather than the public API.
 */
export function DashboardClient({
  recommendedScholarships
}: {
  recommendedScholarships: PublicScholarship[];
}) {
  const router = useRouter();
  const { isAuthenticated, user, savedScholarshipIds, applications, logout } = useStore();
  const [savedScholarships, setSavedScholarships] = useState<PublicScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const now = useNow();

  useEffect(() => {
    // Simple client-side auth check
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        if (savedScholarshipIds.length === 0) {
          if (active) setSavedScholarships([]);
          return;
        }
        const saved = await fetchPublicScholarshipsByIds(savedScholarshipIds);
        if (active) setSavedScholarships(saved);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => {
      active = false;
    };
  }, [isAuthenticated, savedScholarshipIds, router]);

  if (!isAuthenticated || !user) {
    return (
      <Container className="py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
      </Container>
    );
  }

  const profileCompleteness = (() => {
    let score = 0;
    if (user.degreeLevel) score += 20;
    if (user.field) score += 20;
    if (user.targetCountries.length > 0) score += 20;
    if (user.gpa) score += 20;
    if (user.citizenship) score += 20;
    return score;
  })();

  const upcomingDeadlines = applications
    .filter((app) => {
      if (!app.scholarship.deadline) return false;
      // No stable "now" until mounted; treat every tracked deadline as upcoming
      // rather than rendering a count that differs from the server pass.
      if (now === null) return true;
      const daysLeft = daysUntilFrom(now, app.scholarship.deadline);
      return daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
    })
    .sort((a, b) => {
      const aTime = new Date(a.scholarship.deadline!).getTime();
      const bTime = new Date(b.scholarship.deadline!).getTime();
      return aTime - bTime;
    })
    .slice(0, 5);

  return (
    <div className="bg-gray-50/50 min-h-screen py-8">
      <Container>
        {/* Header Section */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-950">
                Welcome back, {user.name || "Student"}!
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your scholarship applications, save opportunities, and discover new matches.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>

          {/* Profile Completion Progress */}
          {profileCompleteness < 100 && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900">
                    Complete Your Profile ({profileCompleteness}%)
                  </h3>
                  <p className="text-xs text-amber-800 mt-1">
                    A complete profile helps us show you the most relevant scholarship matches.
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-amber-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-600 transition-all rounded-full"
                      style={{ width: `${profileCompleteness}%` }}
                    />
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Complete Profile Now →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                <Bookmark className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{savedScholarshipIds.length}</p>
                <p className="text-xs text-gray-500 font-medium">Saved</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{applications.length}</p>
                <p className="text-xs text-gray-500 font-medium">Tracking</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{upcomingDeadlines.length}</p>
                <p className="text-xs text-gray-500 font-medium">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {applications.filter((a) => a.status === "Accepted").length}
                </p>
                <p className="text-xs text-gray-500 font-medium">Accepted</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommended For You */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Recommended For You
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Based on your profile and preferences
                  </p>
                </div>
                <Link
                  href="/finder"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Find More →
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : recommendedScholarships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recommendedScholarships.slice(0, 2).map((sch) => (
                    <ScholarshipCard key={sch.id} scholarship={sch} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <p className="text-sm text-gray-500">
                    Complete your profile to see personalized recommendations
                  </p>
                </div>
              )}
            </div>

            {/* Saved Scholarships */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary-600" />
                  Saved Scholarships ({savedScholarshipIds.length})
                </h2>
                <Link
                  href="/scholarships"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Browse All →
                </Link>
              </div>

              {savedScholarships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {savedScholarships.slice(0, 4).map((sch) => (
                    <ScholarshipCard key={sch.id} scholarship={sch} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <Bookmark className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">You haven&apos;t saved any scholarships yet</p>
                  <Link
                    href="/scholarships"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600"
                  >
                    Start Browsing →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                Upcoming Deadlines
              </h3>
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map((app) => {
                    const daysLeft = now === null ? null : daysUntilFrom(now, app.scholarship.deadline);
                    return (
                      <div key={app.id} className="border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                        <Link
                          href={`/scholarships/${app.scholarship.slug}`}
                          className="font-semibold text-xs text-gray-900 hover:text-primary-600 line-clamp-2"
                        >
                          {app.scholarship.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(app.scholarship.deadline)}
                          {daysLeft !== null && (
                            <>
                              {" \u2022 "}
                              <span
                                className={
                                  daysLeft <= 7 ? "text-red-600 font-bold" : "text-amber-600"
                                }
                              >
                                {daysLeft} days left
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                  No upcoming deadlines tracked
                </p>
              )}
              <Link
                href="/tracker"
                className="mt-4 block text-center text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                View All in Tracker →
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/finder"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Search className="h-4 w-4 text-amber-500" />
                  Find My Matches
                </Link>
                <Link
                  href="/compare"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Compare Scholarships
                </Link>
                <Link
                  href="/deadlines"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Calendar className="h-4 w-4 text-purple-500" />
                  View Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
