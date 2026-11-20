"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Globe, Target, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Layout";

const matchingFactors = [
  { icon: GraduationCap, label: "Academic Background & GPA" },
  { icon: Globe, label: "Nationality & Citizenship" },
  { icon: Target, label: "Study Level & Field of Study" },
  { icon: Sparkles, label: "Preferred Destination & Intake" },
  { icon: CheckCircle2, label: "English Language Scores" },
  { icon: ArrowRight, label: "Funding Requirements" },
];

export function ScholarshipMatchingCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-16 sm:py-24 text-white" aria-labelledby="matching-heading">
      <div className="absolute right-0 top-0 -mr-12 -mt-12 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
      <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"} />

      <Container>
        <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-800/80 px-3 py-1 text-xs font-semibold text-primary-200">
              <Sparkles className="h-3.5 w-3.5" />
              Personalized Eligibility Questionnaire
            </span>
            <h2 id="matching-heading" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              Find Scholarships
              <br />
              <span className="text-primary-200">Matched to You</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-primary-100">
              Answer a few simple questions and get personalised scholarship recommendations based on your profile, academics, and preferences.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              {matchingFactors.map((factor, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm border border-white/10">
                  <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-700/50 text-primary-200">
                    <factor.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-white">{factor.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/finder">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start Scholarship Finder
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-xs text-primary-200">Takes about 2 minutes • No account required to start</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">How It Works</span>
                <span className="rounded-full bg-primary-600/20 px-2 py-0.5 text-xs font-medium text-primary-300">4 Steps</span>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg">1</div>
                  <div>
                    <h4 className="font-bold text-white">Build Your Profile</h4>
                    <p className="mt-1 text-sm text-primary-200">Enter your citizenship, academic background, GPA, language scores, and study preferences</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg">2</div>
                  <div>
                    <h4 className="font-bold text-white">Smart Matching</h4>
                    <p className="mt-1 text-sm text-primary-200">Our algorithm evaluates your profile against thousands of verified scholarship criteria</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg">3</div>
                  <div>
                    <h4 className="font-bold text-white">Personalized Results</h4>
                    <p className="mt-1 text-sm text-primary-200">Get a ranked list of scholarships with match scores and detailed eligibility explanations</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-success-500 text-white font-bold text-lg">4</div>
                  <div>
                    <h4 className="font-bold text-white">Apply with Confidence</h4>
                    <p className="mt-1 text-sm text-primary-200">Access official application portals, track deadlines, and manage your applications</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm text-primary-200">
                  <ShieldCheck className="h-5 w-5 text-success-400 shrink-0" />
                  <div>
                    <p className="font-medium text-white">Transparent & Trustworthy</p>
                    <p className="text-xs">No guaranteed eligibility promises. Results based on actual scholarship criteria.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}