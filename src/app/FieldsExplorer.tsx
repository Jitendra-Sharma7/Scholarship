"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, Code, FlaskConical, HeartPulse, Scale, TrendingUp, Palette, Leaf, Brain, Database, Users, Zap } from "lucide-react";
import type { PublicField } from "@/lib/data/public";
import { Container } from "@/components/layout/Layout";

function getFieldIcon(fieldId: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "business": Briefcase,
    "computer-science": Code,
    "engineering": FlaskConical,
    "medicine": HeartPulse,
    "law": Scale,
    "economics": TrendingUp,
    "social-sciences": Users,
    "arts": Palette,
    "agriculture": Leaf,
    "artificial-intelligence": Brain,
    "data-science": Database,
    "environmental": Zap,
  };
  return iconMap[fieldId] || BookOpen;
}

interface FieldsExplorerProps {
  initialFields: PublicField[];
}

export function FieldsExplorer({ initialFields }: FieldsExplorerProps) {
  return (
    <section className="bg-white py-16 sm:py-24" aria-labelledby="fields-heading">
      <Container>
        <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
              <BookOpen className="h-3.5 w-3.5" />
              Academic Disciplines
            </div>
            <h2 id="fields-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">
              Find Scholarships by Your Field of Study
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary-500">
              Find scholarship opportunities for computer science, engineering, business, medicine, social sciences, arts, and more.
            </p>
          </div>
          <Link href="/fields" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            All fields
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {initialFields.map((f) => {
            const Icon = getFieldIcon(f.id);
            return (
              <Link
                key={f.id}
                href={`/scholarships?field=${encodeURIComponent(f.id)}`}
                className="group flex items-center gap-4 rounded-2xl border border-secondary-200 bg-white p-4 shadow-card transition-all hover:border-primary-300 hover:shadow-card-hover hover:bg-primary-50/30"
              >
                <div className="flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-secondary-900 group-hover:text-primary-700 transition-colors">{f.name}</h3>
                  <p className="text-xs text-secondary-500">{f.scholarshipCount} programs</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/fields" className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-600 bg-transparent px-6 py-3 text-base font-semibold text-primary-600 transition-all hover:bg-primary-600 hover:text-white">
            <BookOpen className="h-5 w-5" />
            View All Fields of Study
          </Link>
        </div>
      </Container>
    </section>
  );
}