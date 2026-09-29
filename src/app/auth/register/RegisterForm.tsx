"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/Forms";
import { Button } from "@/components/ui/Button";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { useStore } from "@/lib/store/useStore";
import { signUp } from "@/app/actions/auth-actions";
import type { OAuthProviderId } from "@/lib/oauth/config";

/**
 * Public registration.
 *
 * The account is created on the server, with the email format and password
 * length checked there and the password hashed with bcrypt. This form used to
 * set a local flag and report a new account without a database row ever being
 * written.
 *
 * The local store flag is only set once the server has confirmed the account.
 *
 * `providers` lists the social providers that are fully configured on the
 * server. A button is only offered for a provider that is actually usable, so
 * there is no way to reach a consent screen that cannot complete.
 */
export default function RegisterForm({
  providers,
}: {
  providers: OAuthProviderId[];
}) {
  const router = useRouter();
  const { login } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    startTransition(async () => {
      let state;
      try {
        state = await signUp({ name, email, password });
      } catch {
        state = { error: "We could not reach the server. No account was created." };
      }

      if (!state.ok) {
        setErrors(state.fieldErrors ?? {});
        setFormError(state.error ?? "Check the highlighted fields and try again.");
        return;
      }

      login(state.email ?? email, state.name || name);
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gradient-to-b from-primary-50/60 via-gray-50 to-white px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand + heading */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            aria-label="Global Scholarship Hub, home"
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm"
          >
            <BookOpen className="h-6 w-6" />
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
            Sign up below to unlock the full potential of Global Scholarship Hub.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {formError && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </p>
          )}

          {/* Social sign-in. Only a provider the server reports as fully
              configured is rendered, so these are never dead controls. */}
          <SocialAuthButtons providers={providers} />
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input
              id="name"
              name="name"
              type="text"
              label="Full Name"
              required
              autoComplete="name"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              error={errors.name}
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              required
              autoComplete="email"
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
            />

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={200}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : "password-hint"}
                  className={`w-full rounded-lg border py-2.5 pl-3 pr-11 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p id="password-hint" className="mt-1.5 text-xs text-gray-500">
                At least 8 characters.
              </p>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" loading={pending}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="/privacy" className="font-medium text-primary-600 hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Your account stores saved scholarships and an application tracker.
        </p>
      </div>
    </div>
  );
}
