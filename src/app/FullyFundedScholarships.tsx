"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Award, ShieldCheck, GraduationCap, MapPin, Calendar, DollarSign } from "lucide-react";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import type { PublicScholarship } from "@/lib/data/public";
import { Container } from "@/components/layout/Layout";

interface FullyFundedScholarshipsProps {
  initialScholarships: PublicScholarship[];
}

const fullyFundedBenefits = [
  { icon: Award, label: "Full Tuition Coverage", description: "100% tuition fees covered by the awarding body" },
  { icon: DollarSign, label: "Monthly Stipend", description: "Regular living allowance for accommodation and expenses" },
  { icon: ShieldCheck, label: "Health Insurance", description: "Comprehensive medical coverage during studies" },
  { icon: MapPin, label: "Travel Allowance", description: "Round-trip airfare to and from host country" },
  { icon: GraduationCap, label: "Research Funding", description: "Additional grants for research projects and conferences" },
  { icon: Calendar, label: "Visa Support", description: "Assistance with student visa application process" },
];

export function FullyFundedScholarships({ initialScholarships }: FullyFundedScholarshipsProps) {
  return (
    <section className="bg-secondary-50/50 py-16 sm:py-24" aria-labelledby="fully-funded-heading">
      <Container>
        <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-success-600">
              <Award className="h-3.5 w-3.5" />
              Full Coverage
            </div>
            <h2 id="fully-funded-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">
              Explore Fully Funded Scholarships
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary-500">
              Discover scholarship opportunities where the awarding body provides substantial financial support. Check each listing for the exact coverage.
            </p>
          </div>
          <Link href="/fully-funded" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            See all fully funded
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fullyFundedBenefits.map((benefit, index) => (
            <div key={index} className="group rounded-2xl border border-secondary-200 bg-white p-6 shadow-card transition-all hover:border-primary-300 hover:shadow-card-hover">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600 group-hover:bg-success-600 group-hover:text-white transition-colors">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">{benefit.label}</h3>
              <p className="mt-2 text-sm text-secondary-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        {initialScholarships.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {initialScholarships.map((s) => (
              <ScholarshipCard key={s.id} scholarship={s} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-secondary-300 bg-secondary-50/50 p-10 text-center">
            <Award className="mx-auto h-12 w-12 text-secondary-300 mb-4" />
            <p className="text-sm text-secondary-600">
              No fully funded opportunities are listed right now.{" "}
              <Link href="/scholarships" className="font-semibold text-primary-600 hover:underline">
                Browse all scholarships
              </Link>
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}