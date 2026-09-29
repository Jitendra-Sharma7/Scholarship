"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, LogIn } from "lucide-react";

import { Input } from "@/components/ui/Forms";
import { Button } from "@/components/ui/Button";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { useStore } from "@/lib/store/useStore";
import { signIn } from "@/app/actions/auth-actions";
import type { OAuthProviderId } from "@/lib/oauth/config";

/**
 * Public sign-in.
 *
 * Credentials are checked by the server against the hashed password in the
 * database. This form used to accept any email and password, wait 800ms, and
 * report success without contacting anything - which is why it is worth saying
 * plainly: there is no demo mode here any more.
 *
 * The local store flag is only set once the server has confirmed the account.
 *
 * `providers` lists the social providers the server has fully configured. An
 * interrupted or refused OAuth handshake returns here with `?error=`, which is
 * shown rather than swallowed, so a failure reads as a failure.
 */
export default function LoginForm({ providers }: { providers: OAuthProviderId[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  const next = searchParams.get("next") ?? "/dashboard";
  const justRegistered = searchParams.get("registered") === "1";
  const oauthError = searchParams.get("error");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    startTransition(async () => {
      let state;
      try {
        state = await signIn({ email, password, next });
      } catch {
        state = { error: "We could not reach the server. Nothing was signed in." };
      }

      if (!state.ok) {
        setErrors(state.fieldErrors ?? {});
        setFormError(state.error ?? "Check the highlighted fields and try again.");
        return;
      }

      login(state.email ?? email, state.name || email.split("@")[0]);
      router.push(next);
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
              <BookOpen className="h-7 w-7" />
            </div>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/auth/register" className="font-semibold text-primary-600 hover:text-primary-500">
              create a free account
            </Link>{" "}
            to start tracking scholarships
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {justRegistered && (
            <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Account created. Sign in to continue.
            </p>
          )}

          {oauthError && (
            <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {oauthError}
            </p>
          )}

          {formError && (
            <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <SocialAuthButtons providers={providers} />

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                error={errors.email}
                aria-invalid={Boolean(errors.email)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-primary-500"
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={pending}
              leftIcon={<LogIn className="h-5 w-5" />}
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
