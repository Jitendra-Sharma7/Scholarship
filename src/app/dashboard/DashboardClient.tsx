"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Settings,
  LogOut,
  Search,
  AlertCircle,
  Bell,
  Edit2,
  Trash2,
  Check,
  Clock,
  X,
  MessageSquare,
} from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { useStore } from "@/lib/store/useStore";
import type { ApplicationTrackerItem } from "@/lib/store/useStore";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { fetchPublicScholarshipsByIds } from "@/app/actions/public-actions";
import type { PublicScholarship } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import { useNow, daysUntilFrom } from "@/lib/useNow";
import { MatchVisualization } from "@/components/dashboard/MatchVisualization";
import toast from "react-hot-toast";

const APPLICATION_STATUSES: ApplicationTrackerItem['status'][] = [
  'Saved',
  'Planning to Apply',
  'Application in Progress',
  'Submitted',
  'Under Review',
  'Awarded',
  'Rejected'
];

const STATUS_COLORS: Record<ApplicationTrackerItem['status'], string> = {
  'Saved': 'bg-gray-100 text-gray-700 border-gray-200',
  'Planning to Apply': 'bg-blue-100 text-blue-700 border-blue-200',
  'Application in Progress': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Submitted': 'bg-purple-100 text-purple-700 border-purple-200',
  'Under Review': 'bg-amber-100 text-amber-700 border-amber-200',
  'Awarded': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-red-100 text-red-700 border-red-200'
};

/**
 * The student dashboard. The recommended shortlist is supplied by the server
 * page; saved, recently viewed and tracked lists live in this browser's
 * storage and resolve through server actions or local state.
 */
export function DashboardClient({
  recommendedScholarships
}: {
  recommendedScholarships: PublicScholarship[];
}) {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    savedScholarshipIds,
    applications,
    recentlyViewed,
    notifications,
    logout,
    updateApplicationStatus,
    removeApplication,
    markNotificationRead,
    removeNotification,
    addNotification,
    clearRecentlyViewed
  } = useStore();
  const [savedScholarships, setSavedScholarships] = useState<PublicScholarship[]>([]);
  const [recentScholarships, setRecentScholarships] = useState<PublicScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesEdits, setNotesEdits] = useState<Record<string, string>>({});
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const now = useNow();

  useEffect(() => {
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
        } else {
          const saved = await fetchPublicScholarshipsByIds(savedScholarshipIds);
          if (active) setSavedScholarships(saved);
        }

        if (recentlyViewed.length === 0) {
          if (active) setRecentScholarships([]);
        } else {
          const recent = await fetchPublicScholarshipsByIds(recentlyViewed);
          if (active) setRecentScholarships(recent);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => {
      active = false;
    };
  }, [isAuthenticated, savedScholarshipIds, recentlyViewed, router]);

  const handleStatusChange = useCallback((id: string, newStatus: ApplicationTrackerItem['status']) => {
    updateApplicationStatus(id, newStatus);
    toast.success(`Status updated to ${newStatus}`);
  }, [updateApplicationStatus]);

  const handleRemove = useCallback((id: string) => {
    if (confirm("Remove this scholarship from your applications?")) {
      removeApplication(id);
      setNotesEdits((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.success("Removed from applications");
    }
  }, [removeApplication]);

  const handleNotesChange = (id: string, value: string) => {
    setNotesEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleNotesSave = (id: string) => {
    const app = applications.find((a) => a.id === id);
    const notes = notesEdits[id] ?? app?.notes ?? '';
    if (notes !== (app?.notes ?? '')) {
      toast.success("Note saved");
    }
    setEditingApp(null);
  };

  const handleNotesCancel = () => {
    setEditingApp(null);
  };

  const handleMarkRead = (id: string) => markNotificationRead(id);
  const handleRemoveNotification = (id: string) => removeNotification(id);

  const seedWelcomeNotification = useCallback(() => {
    if (notifications.length === 0) {
      addNotification({
        title: "Welcome to your student dashboard",
        message: "Track applications, save scholarships, and never miss a deadline.",
        link: "/dashboard",
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }, [notifications.length, addNotification]);

  useEffect(() => {
    void seedWelcomeNotification();
  }, [seedWelcomeNotification]);

  if (!isAuthenticated || !user) {
    return (
      <Container className="py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
      </Container>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingApp(null);
                }}
                className={`relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 ${unreadCount > 0 ? 'text-red-600' : ''}`}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
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
                  {applications.filter((a) => a.status === "Awarded").length}
                </p>
                <p className="text-xs text-gray-500 font-medium">Awarded</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            {/* Smart Match Visualization */}
            <div>
              <MatchVisualization
                scholarships={recommendedScholarships}
                maxItems={5}
              />
            </div>

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

            {/* Application Progress */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-bold text-gray-900">Application Progress</h2>
                </div>
                <Link
                  href="/tracker"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Manage All →
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    You haven&apos;t started tracking any applications yet
                  </p>
                  <Link
                    href="/scholarships"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600"
                  >
                    Start Tracking →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const daysUntilDeadline =
                      now === null ? null : daysUntilFrom(now, app.scholarship.deadline);
                    const isEditing = editingApp === app.id;
                    const noteValue = notesEdits[app.id] ?? app.notes;
                    return (
                      <div
                        key={app.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1.5">
                              <Link
                                href={`/scholarships/${app.scholarship.slug}`}
                                className="font-semibold text-base text-gray-900 hover:text-primary-600 line-clamp-1"
                                title={app.scholarship.title}
                              >
                                {app.scholarship.title}
                              </Link>
                              <span
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[app.status]}`}
                              >
                                {app.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {app.scholarship.providerName || "Official Organization"}
                              {app.scholarship.universityName && ` • ${app.scholarship.universityName}`}
                            </p>
                            {app.scholarship.deadline && (
                              <p className="text-xs text-gray-500 mt-1">
                                <Clock className="h-3.5 w-3.5 inline mr-1.5" />
                                {formatDate(app.scholarship.deadline)}
                                {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    daysUntilDeadline <= 7 ? 'bg-red-100 text-red-700' :
                                    daysUntilDeadline <= 30 ? 'bg-amber-100 text-amber-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {daysUntilDeadline}d left
                                  </span>
                                )}
                              </p>
                            )}
                            {app.notes && (
                              <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">
                                <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
                                {app.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-end gap-2">
                            {!isEditing ? (
                              <>
                                <button
                                  onClick={() => setEditingApp(app.id)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                  title="Add or edit notes"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  <span className="sr-only">Edit notes for {app.scholarship.title}</span>
                                </button>
                                <select
                                  onChange={(e) =>
                                    handleStatusChange(app.id, e.target.value as ApplicationTrackerItem['status'])}
                                  value={app.status}
                                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 ${STATUS_COLORS[app.status]}`}
                                >
                                  {APPLICATION_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                                <Link
                                  href={`/scholarships/${app.scholarship.slug}`}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                  title="Details"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="sr-only">Details for {app.scholarship.title}</span>
                                </Link>
                                <button
                                  onClick={() => handleRemove(app.id)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  title="Remove"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  <span className="sr-only">Remove {app.scholarship.title}</span>
                                </button>
                              </>
                            ) : (
                              <div className="flex items-end gap-2">
                                <button
                                  onClick={() => handleNotesSave(app.id)}
                                  className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleNotesCancel}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-3">
                            <textarea
                              id={`edit-notes-${app.id}`}
                              defaultValue={noteValue}
                              onChange={(e) => handleNotesChange(app.id, e.target.value)}
                              rows={3}
                              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Add personal notes about this application..."
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Press Enter to save, or click Cancel.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

            {/* Recently Viewed */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-600" />
                  Recently Viewed
                </h3>
                <button
                  onClick={() => {
                    clearRecentlyViewed();
                    setRecentScholarships([]);
                    toast("Recently viewed cleared");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {loading && recentlyViewed.length > 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : recentScholarships.length > 0 ? (
                <div className="space-y-3">
                  {recentScholarships.map((sch) => (
                    <div
                      key={sch.id}
                      className="flex items-start gap-3 border-b border-gray-50 pb-2.5 last:border-0 last:pb-0 last:mb-0"
                    >
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-100" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/scholarships/${sch.slug}`}
                          className="text-xs font-semibold text-gray-900 hover:text-primary-600 line-clamp-1"
                          title={sch.title}
                        >
                          {sch.title}
                        </Link>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {sch.countryName || "Global"} • {formatDate(sch.deadline)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                  Browse scholarships to see them here.
                </p>
              )}
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary-600" />
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-blue-600">{unreadCount} unread</span>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  No notifications yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          n.read ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Bell className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              handleMarkRead(n.id);
                              if (n.link) router.push(n.link);
                            }}
                            className="block"
                          >
                            <div className="text-sm font-semibold text-gray-900">
                              {n.title}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              {n.message}
                            </p>
                            <span className="mt-0.5 block text-[10px] text-gray-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </Link>
                        ) : (
                          <>
                            <div className="text-sm font-semibold text-gray-900">
                              {n.title}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              {n.message}
                            </p>
                            <span className="mt-0.5 block text-[10px] text-gray-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => handleRemoveNotification(n.id)}
                              className="mt-1.5 text-[10px] text-gray-400 hover:text-red-600 underline"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="ml-2 shrink-0 rounded-lg p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                        title={n.read ? "Mark as unread" : "Mark as read"}
                        aria-label={n.read ? "Mark as unread" : "Mark as read"}
                      >
                        {n.read ? (
                          <Bell className="h-3 w-3 text-gray-400" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                  {notifications.length > 6 && (
                    <p className="text-[11px] text-gray-400 text-center mt-1">
                      +{notifications.length - 6} more
                    </p>
                  )}
                </div>
              )}
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
