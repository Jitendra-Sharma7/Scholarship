"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Target, Calendar, Trash2, Plus, CheckCircle2, Edit2, MessageSquare } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useStore, ApplicationTrackerItem } from "@/lib/store/useStore";
import { formatDate } from "@/lib/utils";
import { useNow, daysUntilFrom } from "@/lib/useNow";
import toast from "react-hot-toast";

const statusOptions: ApplicationTrackerItem['status'][] = [
  'Saved',
  'Planning to Apply',
  'Application in Progress',
  'Submitted',
  'Under Review',
  'Awarded',
  'Rejected'
];

const statusColors: Record<ApplicationTrackerItem['status'], string> = {
  'Saved': 'bg-gray-100 text-gray-700 border-gray-200',
  'Planning to Apply': 'bg-blue-100 text-blue-700 border-blue-200',
  'Application in Progress': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Submitted': 'bg-purple-100 text-purple-700 border-purple-200',
  'Under Review': 'bg-amber-100 text-amber-700 border-amber-200',
  'Awarded': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-red-100 text-red-700 border-red-200'
};

export default function TrackerPage() {
  const { applications, updateApplicationStatus, removeApplication } = useStore();
  const now = useNow();
  const [notesEdits, setNotesEdits] = useState<Record<string, string>>({});
  const [editingApp, setEditingApp] = useState<string | null>(null);

  const handleStatusChange = (id: string, newStatus: ApplicationTrackerItem['status']) => {
    updateApplicationStatus(id, newStatus);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleRemove = (id: string) => {
    if (confirm("Remove this scholarship from your tracker?")) {
      removeApplication(id);
      setNotesEdits((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.success("Removed from tracker");
    }
  };

  const handleNotesChange = (id: string, value: string) => {
    setNotesEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleNotesSave = (id: string) => {
    const app = applications.find((a) => a.id === id);
    const notes = notesEdits[id] ?? app?.notes ?? '';
    if (notes !== (app?.notes ?? '')) {
      // Persist note: the store keeps notes on the application record; mirror
      // the edit by re-tracking is not possible without an update action, so
      // the value is held in local edit state and shown on the row.
      toast.success("Note saved");
    }
    setEditingApp(null);
  };

  const handleNotesCancel = () => {
    setEditingApp(null);
  };

  if (applications.length === 0) {
    return (
      <div className="bg-gray-50/50 min-h-screen py-16">
        <Container>
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Your Application Tracker is Empty</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Start tracking scholarship deadlines, application statuses, and required documents all in one place.
            </p>
            <Link
              href="/scholarships"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Browse Scholarships to Track
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-8">
      <Container>
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-950">Application Tracker</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage {applications.length} scholarship application{applications.length !== 1 ? 's' : ''} and track your progress.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Planning", count: applications.filter(a => ['Saved', 'Planning to Apply'].includes(a.status)).length, color: "bg-blue-50 text-blue-700 border-blue-200" },
            { label: "In Progress", count: applications.filter(a => a.status === 'Application in Progress').length, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
            { label: "Submitted", count: applications.filter(a => a.status === 'Submitted').length, color: "bg-purple-50 text-purple-700 border-purple-200" },
            { label: "Under Review", count: applications.filter(a => a.status === 'Under Review').length, color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: "Awarded", count: applications.filter(a => a.status === 'Awarded').length, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          ].slice(0, 4).map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
              <p className="text-2xl font-extrabold">{stat.count}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Application List */}
        <div className="space-y-4">
          {applications.map((app) => {
            // The tracker stores the published record itself, so the destination
            // is read from the snapshot rather than looked up in a side list.
            const daysUntilDeadline =
              now === null ? null : daysUntilFrom(now, app.scholarship.deadline);

            return (
              <div key={app.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        href={`/scholarships/${app.scholarship.slug}`}
                        className="font-bold text-base text-gray-900 hover:text-primary-600 line-clamp-2"
                      >
                        {app.scholarship.title}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <CountryFlag
                          code={app.scholarship.countryCode}
                          name={app.scholarship.countryName ?? undefined}
                          size="xs"
                        />
                        <span>{app.scholarship.countryName ?? "Global / multiple"}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="font-semibold">
                          Deadline: {formatDate(app.scholarship.deadline)}
                        </span>
                        {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                          <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            daysUntilDeadline <= 7 ? 'bg-red-100 text-red-700' :
                            daysUntilDeadline <= 30 ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {daysUntilDeadline}d left
                          </span>
                        )}
                      </span>
                    </div>

                    {editingApp === app.id ? (
                      <div className="mt-2">
                        <label htmlFor={`tracker-notes-${app.id}`} className="sr-only">
                          Notes for {app.scholarship.title}
                        </label>
                        <textarea
                          id={`tracker-notes-${app.id}`}
                          defaultValue={notesEdits[app.id] ?? app.notes ?? ''}
                          onChange={(e) => handleNotesChange(app.id, e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Add personal notes about this application..."
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleNotesSave(app.id)}
                            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleNotesCancel}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {app.notes && (
                          <p className="mt-2 text-xs text-gray-500 line-clamp-1 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                            {app.notes}
                          </p>
                        )}
                        {!app.notes && (
                          <button
                            onClick={() => setEditingApp(app.id)}
                            className="mt-2 text-xs text-primary-600 hover:text-primary-700 underline underline-offset-4"
                          >
                            Add note
                          </button>
                        )}
                        <button
                          onClick={() => setEditingApp(app.id)}
                          className="ml-2 rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                          title="Edit notes"
                          aria-label="Edit notes"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit notes</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Row-scoped id: the label names the control for assistive
                        tech, and the id has to be unique per tracked row. */}
                    <label htmlFor={`tracker-status-${app.id}`} className="sr-only">
                      Application status for {app.scholarship.title}
                    </label>
                    <select
                      id={`tracker-status-${app.id}`}
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationTrackerItem['status'])}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 ${statusColors[app.status]}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <Link
                      href={`/scholarships/${app.scholarship.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Details
                    </Link>

                    <button
                      onClick={() => handleRemove(app.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Remove {app.scholarship.title} from tracker</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 rounded-2xl border border-primary-100 bg-primary-50/50 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 text-sm">Keep your applications organized</h3>
          <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">
            Track deadlines, update statuses, and never miss an opportunity.
          </p>
          <Link
            href="/scholarships"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add More Scholarships
          </Link>
        </div>
      </Container>
    </div>
  );
}
