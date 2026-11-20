"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Award, BookOpen, Filter } from "lucide-react";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { Button } from "@/components/ui/Button";
import type { PublicScholarship } from "@/lib/data/public";
import { Container } from "@/components/layout/Layout";

const categories = [
  { id: "all", label: "All", icon: GraduationCap },
  { id: "fully-funded", label: "Fully Funded", icon: Award },
  { id: "undergraduate", label: "Undergraduate", icon: BookOpen },
  { id: "masters", label: "Master's", icon: GraduationCap },
  { id: "phd", label: "PhD", icon: Award },
];

interface FeaturedScholarshipsTabsProps {
  initialScholarships: PublicScholarship[];
  featuredFullyFunded: PublicScholarship[];
  featuredUndergraduate: PublicScholarship[];
  featuredMasters: PublicScholarship[];
  featuredPhd: PublicScholarship[];
}

export function FeaturedScholarshipsTabs({
  initialScholarships,
  featuredFullyFunded,
  featuredUndergraduate,
  featuredMasters,
  featuredPhd,
}: FeaturedScholarshipsTabsProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const scholarshipsMap = {
    "all": initialScholarships,
    "fully-funded": featuredFullyFunded,
    "undergraduate": featuredUndergraduate,
    "masters": featuredMasters,
    "phd": featuredPhd,
  };

  const scholarships = scholarshipsMap[activeCategory as keyof typeof scholarshipsMap] || [];

  return (
    <section className="bg-white py-16 sm:py-24" aria-labelledby="featured-heading">
      <Container>
        <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
              Featured Programs
            </div>
            <h2 id="featured-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">
              Featured Scholarship Opportunities
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary-500">
              Explore hand-picked scholarship opportunities from governments, universities, foundations, and other institutions.
            </p>
          </div>
          <Link
            href="/scholarships"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View all scholarships
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Scholarship categories">
          {categories.map((category) => (
            <button
              key={category.id}
              role="tab"
              aria-selected={activeCategory === category.id}
              aria-controls={`panel-${category.id}`}
              id={`tab-${category.id}`}
              onClick={() => setActiveCategory(category.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-secondary-600 border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              }`}
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </button>
          ))}
        </div>

        <div id={`panel-${activeCategory}`} role="tabpanel" aria-labelledby={`tab-${activeCategory}`}>
          {scholarships.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-secondary-300 bg-secondary-50/50 p-12 text-center text-sm text-secondary-500">
              No scholarships found for this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {scholarships.map((sch) => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}