"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Clock, Send, ShieldQuestion } from "lucide-react";
import { Container } from "@/components/layout/Layout";

type Subject = "general" | "scholarship" | "verification" | "partnership" | "bug";

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: "general", label: "General enquiry" },
  { value: "scholarship", label: "Report or suggest a scholarship" },
  { value: "verification", label: "Question about a listing or verification" },
  { value: "partnership", label: "Partnership or advertising" },
  { value: "bug", label: "Report a problem with the site" },
];

/**
 * The contact form.
 *
 * Validation is client-side only, because there is no message inbox behind this
 * form: nothing is stored and nothing is sent. The confirmation says exactly
 * that and points at the real address, rather than reporting a delivery that
 * never happened.
 */
export function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "general" as Subject,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  /** Tracks the confirmation panel so focus can follow the form swap. */
  const submittedRef = useRef<HTMLDivElement | null>(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!form.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) {
      next.message = "Please enter a message.";
    } else if (form.message.trim().length < 10) {
      next.message = "Please add a little more detail (at least 10 characters).";
    }
    setErrors(next);

    // A failed submit otherwise leaves focus on the button, so nothing tells the
    // visitor that the form was refused.
    const first = Object.keys(next)[0];
    if (first) {
      requestAnimationFrame(() => document.getElementById(`contact-${first}`)?.focus());
    }

    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // No backend is wired up. The confirmation says so plainly rather than
    // pretending a message was delivered.
    setSubmitted(true);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <Container size="md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            <MessageSquare className="h-3.5 w-3.5" />
            Get in touch
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">Contact Us</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Questions about a listing, a scholarship you would like us to add, or a problem with
            the site. We respond within 24&ndash;48 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact details */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900">Email</h2>
              <p className="mt-2 text-sm text-gray-600">For general enquiries</p>
              <a
                href={`mailto:${contactEmail}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
              >
                <Mail className="h-4 w-4" />
                {contactEmail}
              </a>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900">Submit a scholarship</h2>
              <p className="mt-2 text-sm text-gray-600">
                Every submission enters an editorial review queue and is verified before listing.
              </p>
              <Link
                href="/submit-scholarship"
                className="mt-2 inline-block text-sm font-semibold text-primary-600 hover:underline"
              >
                Submit a scholarship &rarr;
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900">Response time</h2>
              <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                Most messages receive a reply within 24&ndash;48 hours on working days.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
                <ShieldQuestion className="h-4 w-4" />
                We cannot give eligibility decisions
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                We are an information platform, not a scholarship provider. We cannot tell you
                whether you qualify, nor accept an application on your behalf. For that, contact the
                awarding organisation directly.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8 lg:col-span-2">
            {submitted ? (
              <div
                role="status"
                tabIndex={-1}
                ref={(node) => {
                  if (node && submittedRef.current !== node) {
                    submittedRef.current = node;
                    node.focus();
                  }
                }}
                className="py-8 text-center focus:outline-none"
              >
                <h2 className="text-xl font-bold text-gray-900">This form is not connected yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                  Nothing was sent and nothing was stored. The site has no message inbox
                  behind this form, so a &quot;thank you&quot; here would be untrue.
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm text-gray-700">
                  Email us directly at{" "}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="font-semibold text-primary-700 underline"
                  >
                    {contactEmail}
                  </a>{" "}
                  and we will reply.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", subject: "general", message: "" });
                    setErrors({});
                  }}
                  className="mt-5 inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Back to the form
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Your name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={`w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-1 ${
                        errors.name
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary-500"
                      }`}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "contact-name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="contact-name-error" role="alert" className="mt-1 text-xs text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Email address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      maxLength={200}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={`w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-1 ${
                        errors.email
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary-500"
                      }`}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="contact-email-error" role="alert" className="mt-1 text-xs text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    What is this about?
                  </label>
                  <select
                    id="contact-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={6}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-1 ${
                      errors.message
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-primary-500"
                    }`}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "contact-message-error" : "contact-message-hint"
                    }
                  />
                  {errors.message ? (
                    <p id="contact-message-error" role="alert" className="mt-1 text-xs text-red-600">
                      {errors.message}
                    </p>
                  ) : (
                    // The 10-character rule is only discoverable after a failed
                    // submit otherwise, so it is stated up front.
                    <p id="contact-message-hint" className="mt-1 text-xs text-gray-500">
                      At least 10 characters. {form.message.length}/2000.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:w-auto"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
