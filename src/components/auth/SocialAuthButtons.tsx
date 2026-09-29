"use client";

import React from "react";
import Link from "next/link";
import type { OAuthProviderId } from "@/lib/oauth/config";

/**
 * The social sign-in controls plus the rule that separates them from the email
 * form, shared by the sign-in and registration pages.
 *
 * Renders nothing at all when no provider is configured, so the email form is
 * not left under a divider that leads nowhere.
 *
 * Only a provider the server reports as fully configured is rendered. That list
 * arrives as a prop from a server component, so the browser never sees whether
 * a credential exists, and there is no variant of this control that looks usable
 * and does nothing. Adding a button without credentials is not possible from
 * here.
 */

const PROVIDERS: {
  id: OAuthProviderId;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "google",
    label: "Continue with Google",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Continue with Apple",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-gray-900">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
  },
];

export function SocialAuthButtons({ providers }: { providers: OAuthProviderId[] }) {
  if (providers.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        {PROVIDERS.filter((provider) => providers.includes(provider.id)).map((provider) => (
          <Link
            key={provider.id}
            href={`/api/auth/${provider.id}`}
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            {provider.icon}
            <span>{provider.label}</span>
          </Link>
        ))}
      </div>

      {/* The "or" rule between the social buttons and the email form. */}
      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    </>
  );
}
