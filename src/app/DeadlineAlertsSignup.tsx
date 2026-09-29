"use client";

import React, { useState } from "react";
import Link from "next/link";

/**
 * Deadline alert signup.
 *
 * Alerts are stored against an account, not an anonymous email address, so
 * this cannot confirm a subscription and does not pretend to. It says what is
 * actually true: alerts need an account, and here is where to make one. The
 * previous version showed a success message for a subscription that was never
 * recorded anywhere.
 */
export function DeadlineAlertsSignup() {
  const [email, setEmail] = useState("");
  const [prompted, setPrompted] = useState(false);

  return (
    <div className="mt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPrompted(true);
        }}
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          aria-label="Email address"
          className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 shrink-0"
        >
          Subscribe
        </button>
      </form>

      {prompted ? (
        <p className="mx-auto mt-3 max-w-md text-center text-xs text-gray-300">
          Deadline alerts are tied to an account so they can be sent to you.{" "}
          <Link href="/auth/register" className="font-semibold text-primary-300 underline">
            Create a free account
          </Link>{" "}
          with <span className="text-gray-200">{email}</span> to set them up, or{" "}
          <Link href="/auth/login" className="font-semibold text-primary-300 underline">
            sign in
          </Link>{" "}
          if you already have one.
        </p>
      ) : (
        <p className="mx-auto mt-3 max-w-md text-center text-xs text-gray-400">
          Alerts are managed from your account. We never sell or share your address.
        </p>
      )}
    </div>
  );
}
