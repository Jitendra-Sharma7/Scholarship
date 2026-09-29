"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, CheckCircle2, Circle, Save, ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { useStore } from "@/lib/store/useStore";
import type { PublicCountryOption, PublicField } from "@/lib/data/public";
import { CountryFlag } from "@/components/ui/CountryFlag";

const DEGREE_LEVELS = [
  "High School",
  "Undergraduate",
  "Master's",
  "PhD",
  "Postdoctoral",
  "Diploma",
  "Certificate",
];

const EMPTY_FORM: ProfileForm = {
  name: "",
  email: "",
  citizenship: "",
  degreeLevel: "",
  field: "",
  gpa: "",
  needFullFunding: false,
};

interface ProfileForm {
  name: string;
  email: string;
  citizenship: string;
  degreeLevel: string;
  field: string;
  gpa: string;
  needFullFunding: boolean;
}

/**
 * Profile editor. The country and field options are read by the server page and
 * passed in, so the form cannot offer a value that no longer exists on the site
 * and the browser never fetches them.
 */
export function ProfileForm({
  countries,
  fields
}: {
  countries: PublicCountryOption[];
  fields: PublicField[];
}) {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const updateProfile = useStore((s) => s.updateProfile);

  const toForm = (u: NonNullable<typeof user>): ProfileForm => ({
    name: u.name ?? "",
    email: u.email ?? "",
    citizenship: u.citizenship ?? "",
    degreeLevel: u.degreeLevel ?? "",
    field: u.field ?? "",
    gpa: u.gpa?.toString() ?? "",
    needFullFunding: u.needFullFunding ?? false,
  });

  const [form, setForm] = useState<ProfileForm>(() =>
    user ? toForm(user) : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Adopt the store's profile when it changes (e.g. after rehydration or an
  // update elsewhere). Adjusting during render is React's documented pattern
  // and avoids a setState inside an effect.
  const [syncedUser, setSyncedUser] = useState(user);
  if (syncedUser !== user) {
    setSyncedUser(user);
    if (user) setForm(toForm(user));
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50/50 py-12">
        <Container size="sm">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <User className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sign in to edit your profile</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              Your profile powers scholarship matching. Sign in to add your academic details,
              citizenship, and funding preferences.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Create Account
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Enter your name so saved lists can be labelled.";
    } else if (form.name.trim().length > 120) {
      nextErrors.name = "Name must be 120 characters or fewer.";
    }

    const trimmedGpa = form.gpa.trim();
    if (trimmedGpa !== "") {
      const gpaValue = Number(trimmedGpa);
      if (!Number.isFinite(gpaValue)) {
        nextErrors.gpa = "GPA must be a number, for example 3.7.";
      } else if (gpaValue < 0 || gpaValue > 4) {
        nextErrors.gpa = "GPA must be between 0 and 4.0.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Check the highlighted fields.");
      return;
    }

    const gpaValue = trimmedGpa === "" ? null : Number(trimmedGpa);

    updateProfile({
      name: form.name.trim(),
      citizenship: form.citizenship,
      degreeLevel: form.degreeLevel,
      field: form.field,
      gpa: gpaValue,
      needFullFunding: form.needFullFunding,
    });
    toast.success("Profile saved");
    router.push("/dashboard");
  };

  const selectedCountries = countries.filter((c) =>
    user.targetCountries.includes(c.id)
  );

  // Completion reflects the fields the matcher actually uses.
  const checks = [
    { label: "Name", done: Boolean(form.name.trim()) },
    { label: "Country of citizenship", done: Boolean(form.citizenship) },
    { label: "Academic level", done: Boolean(form.degreeLevel) },
    { label: "Field of study", done: Boolean(form.field) },
    { label: "GPA", done: form.gpa.trim() !== "" },
  ];
  const completed = checks.filter((c) => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);

  return (
    <div className="bg-gray-50/50 min-h-screen py-10">
      <Container size="md">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">Your Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            The details below are used to match you against scholarship eligibility criteria.
          </p>
        </div>

        {/* Completion */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Profile completion</span>
            <span className="text-sm font-bold text-primary-600">{pct}%</span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion"
          >
            <div
              className="h-full rounded-full bg-primary-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                {c.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-gray-300" />
                )}
                {c.label}
              </li>
            ))}
          </ul>
          {pct < 100 && (
            <p className="mt-3 text-xs text-gray-500">
              Complete your profile to improve the accuracy of your scholarship matches.
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-gray-900">Personal Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="p-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "p-name-error" : undefined}
                  className={`w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-1 ${
                    errors.name
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-primary-500"
                  }`}
                />
                {errors.name && (
                  <p id="p-name-error" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="p-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="p-email"
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">Used to sign in. Contact us to change it.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="mb-1 text-base font-bold text-gray-900">Academic Information</h2>
            <p className="mb-4 text-xs text-gray-500">
              These fields drive degree-level and field matching.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="p-degree"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Academic level
                </label>
                <select
                  id="p-degree"
                  value={form.degreeLevel}
                  onChange={(e) => setForm({ ...form, degreeLevel: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1"
                >
                  <option value="">Select a level</option>
                  {DEGREE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="p-field" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Field of study
                </label>
                <select
                  id="p-field"
                  value={form.field}
                  onChange={(e) => setForm({ ...form, field: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1"
                >
                  <option value="">Select a field</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="p-gpa" className="mb-1.5 block text-sm font-medium text-gray-700">
                  GPA (0&ndash;4.0)
                </label>
                <input
                  id="p-gpa"
                  type="number"
                  min={0}
                  max={4}
                  step={0.01}
                  value={form.gpa}
                  onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                  aria-invalid={Boolean(errors.gpa)}
                  aria-describedby={errors.gpa ? "p-gpa-error" : "p-gpa-hint"}
                  className={`w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-1 ${
                    errors.gpa
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-primary-500"
                  }`}
                />
                {errors.gpa ? (
                  <p id="p-gpa-error" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.gpa}
                  </p>
                ) : (
                  <p id="p-gpa-hint" className="mt-1 text-xs text-gray-500">
                    Optional. Used to check minimum GPA requirements.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="p-citizenship"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Country of citizenship
                </label>
                <select
                  id="p-citizenship"
                  value={form.citizenship}
                  onChange={(e) => setForm({ ...form, citizenship: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1"
                >
                  <option value="">Select a country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Many programmes restrict eligibility by nationality.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="mb-1 text-base font-bold text-gray-900">Funding Preferences</h2>
            <p className="mb-4 text-xs text-gray-500">
              Prioritise opportunities that match how you intend to fund your studies.
            </p>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.needFullFunding}
                onChange={(e) => setForm({ ...form, needFullFunding: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  I need full funding
                </span>
                <span className="block text-xs text-gray-600">
                  Prioritise scholarships covering tuition and living costs.
                </span>
              </span>
            </label>

            {selectedCountries.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">Target destinations</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCountries.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1.5 pr-3 text-xs font-medium text-gray-700"
                    >
                      {/* The legacy `flag` field is always null now that flags
                          render as images, so it is not passed. */}
                      <CountryFlag code={c.code} name={c.name} size="xs" />
                      {c.name}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Set these in the{" "}
                  <Link href="/finder" className="text-primary-600 underline">
                    Scholarship Finder
                  </Link>
                  .
                </p>
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Save className="h-4 w-4" />
              Save Profile
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Container>
    </div>
  );
}
