"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Clock, ExternalLink, FileText, Database, Globe, Award } from "lucide-react";
import { Container } from "@/components/layout/Layout";

const verificationItems = [
  {
    icon: ShieldCheck,
    title: "Official Information Sources",
    description: "Every scholarship listing includes direct links to the official provider website and original source URLs.",
    details: ["Source URL on every listing", "Official application portal links", "Provider contact information"],
  },
  {
    icon: CheckCircle2,
    title: "Scholarship Eligibility Verification",
    description: "We verify eligibility criteria against official documentation. Unclear requirements are marked as 'not stated' rather than assumed.",
    details: ["Academic requirements verified", "Nationality restrictions confirmed", "Language requirements validated"],
  },
  {
    icon: Clock,
    title: "Deadline Verification",
    description: "Application deadlines are cross-referenced with official sources. Status indicators (Open, Closing Soon, Expired) are calculated automatically from actual dates.",
    details: ["Real-time status calculation", "Opening dates tracked", "Admin override transparency"],
  },
  {
    icon: FileText,
    title: "Funding Information Validation",
    description: "Funding amounts, coverage types, and benefits are verified against official announcements. Partial information is clearly indicated.",
    details: ["Tuition coverage confirmed", "Stipend amounts verified", "Additional benefits listed"],
  },
  {
    icon: Database,
    title: "Regular Scholarship Updates",
    description: "Our editorial team reviews and updates listings regularly. Last verified dates are displayed on every scholarship page.",
    details: ["Monthly verification cycles", "Last verified date shown", "Community correction system"],
  },
];

const trustBadges = [
  { icon: Globe, label: "100+ Countries Covered" },
  { icon: Award, label: "500+ Universities Listed" },
  { icon: ShieldCheck, label: "Source URLs on All Listings" },
  { icon: CheckCircle2, label: "Last Verified Dates Shown" },
  { icon: ExternalLink, label: "Direct Official Links" },
  { icon: Database, label: "Regular Data Updates" },
];

export function VerificationTransparency() {
  return (
    <section className="border-t border-secondary-200 bg-white py-16 sm:py-24" aria-labelledby="verification-heading">
      <Container>
        <div className="rounded-3xl border border-primary-100 bg-primary-50/70 p-8 sm:p-12">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-800">
              <ShieldCheck className="h-4 w-4" />
              How We Handle Listings
            </div>
            <h2 id="verification-heading" className="text-2xl sm:text-3xl font-bold text-secondary-900">
              Scholarship Information with Source Transparency
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary-700">
              Each scholarship listing includes its available source information and the date it was last checked. Where a provider has not stated a funding amount, deadline, or eligibility requirement, the listing indicates that information is not stated rather than presenting an unsupported value.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {verificationItems.map((item, index) => (
                <div key={index} className="rounded-2xl bg-white p-5 border border-secondary-100">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-secondary-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-secondary-600">{item.description}</p>
                  <ul className="mt-3 space-y-1.5">
                    {item.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-secondary-600">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-600" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {trustBadges.map((badge, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-secondary-700 border border-secondary-200 shadow-sm">
                  <badge.icon className="h-3.5 w-3.5 text-primary-600" />
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-bold text-secondary-900 text-center mb-6">What You Can Verify on Every Listing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-secondary-200 bg-white p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
                <ExternalLink className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-secondary-900">Original Source URL</h4>
              <p className="mt-1 text-sm text-secondary-600">Direct link to the official scholarship announcement</p>
            </div>
            <div className="rounded-2xl border border-secondary-200 bg-white p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
                <ExternalLink className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-secondary-900">Official Application URL</h4>
              <p className="mt-1 text-sm text-secondary-600">Direct link to the provider&apos;s application portal</p>
            </div>
            <div className="rounded-2xl border border-secondary-200 bg-white p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-secondary-900">Last Verified Date</h4>
              <p className="mt-1 text-sm text-secondary-600">When our team last confirmed the information</p>
            </div>
            <div className="rounded-2xl border border-secondary-200 bg-white p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-secondary-900">Verification Status</h4>
              <p className="mt-1 text-sm text-secondary-600">Verified Recently / Verification Needed / Potentially Expired</p>
            </div>
            <div className="rounded-2xl border border-secondary-200 bg-white p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
                <Database className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-secondary-900">Information Update Date</h4>
              <p className="mt-1 text-sm text-secondary-600">When the scholarship details were last updated</p>
            </div>
            <div className="rounded-2xl border border-secondary-200 bg-white p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-secondary-900">Deadline Status</h4>
              <p className="mt-1 text-sm text-secondary-600">Open / Closing Soon / Upcoming / Closed / Expired</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}