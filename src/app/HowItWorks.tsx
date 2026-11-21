"use client";

import React from "react";
import Link from "next/link";
import { Search, ShieldCheck, Target, ExternalLink, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Layout";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Explore Scholarships",
    description: "Search thousands of international scholarship opportunities from governments, universities, and foundations worldwide.",
    color: "bg-primary-100 text-primary-600",
    iconColor: "text-primary-600",
  },
  {
    number: 2,
    icon: ShieldCheck,
    title: "Check Eligibility",
    description: "Review academic, nationality, language, and course requirements. Compare criteria across multiple scholarships.",
    color: "bg-blue-100 text-blue-600",
    iconColor: "text-blue-600",
  },
  {
    number: 3,
    icon: Target,
    title: "Find Your Match",
    description: "Discover scholarships based on your academic profile, preferences, and funding needs with our smart matching engine.",
    color: "bg-purple-100 text-purple-600",
    iconColor: "text-purple-600",
  },
  {
    number: 4,
    icon: ExternalLink,
    title: "Apply with Confidence",
    description: "Visit official application portals, track important deadlines, and manage your applications in one place.",
    color: "bg-success-100 text-success-600",
    iconColor: "text-success-600",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-secondary-200 bg-secondary-50 py-16 sm:py-24" aria-labelledby="how-it-works-heading">
      <Container>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600 mb-4">
            How It Works
          </div>
          <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">
            How Global Scholarship Hub Works
          </h2>
          <p className="mt-2 text-sm text-secondary-500">
            Discover scholarship opportunities, compare them, and continue to the official application source.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group rounded-2xl border border-secondary-200 bg-white p-6 sm:p-8 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1"
            >
              <div className="relative">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: step.color.replace("bg-", "") + "20" }}>
                  <step.icon className="h-7 w-7" style={{ color: step.iconColor.replace("text-", "") }} />
                </div>
                <div className="absolute -top-2 -right-2 text-5xl font-extrabold text-secondary-100/50 group-hover:text-secondary-200/50 transition-colors">
                  {step.number}
                </div>
              </div>

              <h3 className="text-lg font-bold text-secondary-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary-600">{step.description}</p>

              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary-600 group-hover:gap-3 transition-all">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-secondary-500 mb-4">Ready to start your scholarship journey?</p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/finder" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-primary-700">
                <Search className="h-5 w-5" />
                Start Scholarship Finder
              </Link>
              <Link href="/scholarships" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-600 bg-transparent px-6 py-3 text-base font-semibold text-primary-600 transition-all hover:bg-primary-600 hover:text-white">
                Browse All Scholarships
              </Link>
            </div>
        </div>
      </Container>
    </section>
  );
}