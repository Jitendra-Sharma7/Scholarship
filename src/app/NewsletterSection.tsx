"use client";

import React, { useState } from "react";
import { Mail, ShieldCheck, ArrowRight, Sparkles, Globe, GraduationCap, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Layout";

const newsletterBenefits = [
  { icon: Sparkles, title: "New Scholarship Alerts", description: "Get notified when new opportunities matching your interests are published" },
  { icon: Bell, title: "Deadline Reminders", description: "Weekly digest of scholarships closing soon so you never miss an application" },
  { icon: Globe, title: "Country-Specific Updates", description: "Targeted updates for your preferred study destinations" },
  { icon: GraduationCap, title: "Application Tips & Guides", description: "Expert advice on essays, recommendations, and interview preparation" },
];

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing! Check your inbox for confirmation.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <section className="bg-primary-50 py-16 sm:py-24" aria-labelledby="newsletter-heading">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Stay Updated
              </div>
              <h2 id="newsletter-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-secondary-900">
                Stay Updated with Latest Scholarships
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-secondary-600">
                Get the newest scholarship opportunities, deadline reminders, and application tips delivered to your inbox. Join 50,000+ students worldwide.
              </p>

              <div className="mt-6 space-y-3">
                {newsletterBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm text-secondary-600">
                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                      <benefit.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{benefit.title}</p>
                      <p className="text-xs">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 text-xs text-secondary-500">
                <ShieldCheck className="h-4 w-4 text-success-600 shrink-0" />
                <span>We respect your privacy. Unsubscribe anytime. No spam.</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200/50 rounded-3xl blur-xl opacity-50" />
              <div className="relative rounded-3xl border border-primary-100 bg-white p-6 sm:p-8 shadow-card-elevated">
                <div className="mb-6 text-center sm:text-left">
                  <Mail className="mx-auto sm:mx-0 h-12 w-12 text-primary-600 mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold text-secondary-900">Subscribe to Our Newsletter</h3>
                  <p className="mt-1 text-sm text-secondary-600">Enter your email to receive weekly scholarship updates</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      className="w-full rounded-xl border border-secondary-200 bg-white px-4 py-3.5 text-base text-secondary-900 placeholder:text-secondary-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:bg-secondary-50"
                      disabled={status === "loading" || status === "success"}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full" disabled={status === "loading" || status === "success"}>
                    {status === "loading" ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {status === "success" && (
                    <div className="rounded-xl bg-success-50 border border-success-200 p-4 text-center">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-success-600 mb-2">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-success-800">{message}</p>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="rounded-xl bg-error-50 border border-error-200 p-4 text-center">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-error-100 text-error-600 mb-2">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-error-800">{message}</p>
                    </div>
                  )}

                  <p className="text-xs text-center text-secondary-500">
                    By subscribing, you agree to our{" "}
                    <a href="/privacy" className="font-medium text-primary-600 hover:underline">Privacy Policy</a>
                    {" and " }
                    <a href="/terms" className="font-medium text-primary-600 hover:underline">Terms of Service</a>
                    .
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}