import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Lock, ShieldCheck } from "lucide-react";

import { getCurrentUser, isStaff } from "@/lib/auth";

import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

/**
 * Staff sign-in.
 *
 * Deliberately outside the `/admin` layout: that layout requires a session, so
 * a protected layout here would redirect the login page to itself forever.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next } = await searchParams;

  // Already signed in as staff? Go straight to the panel.
  const user = await getCurrentUser();
  if (user && isStaff(user.role)) {
    redirect(next && next.startsWith("/admin") ? next : "/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            Global Scholarship Hub
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Admin sign in
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Staff access only. Content changes are recorded in the audit log.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <LoginForm next={next} />

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p>
              Sessions are server-side and expire automatically. Signing in here grants only
              the permissions assigned to your role.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-slate-700">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Back to the public site
          </Link>
        </p>
      </div>
    </main>
  );
}
