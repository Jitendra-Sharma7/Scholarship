"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Globe, GraduationCap } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { PublicCountryTile } from "@/lib/data/public";
import { Container } from "@/components/layout/Layout";

interface CountriesExplorerProps {
  initialCountries: PublicCountryTile[];
  totalCountries: number;
}

export function CountriesExplorer({ initialCountries, totalCountries }: CountriesExplorerProps) {
  return (
    <section className="bg-secondary-50/50 py-16 sm:py-24" aria-labelledby="countries-heading">
      <Container>
        <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
              <Globe className="h-3.5 w-3.5" />
              Study Destinations
            </div>
            <h2 id="countries-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">
              Explore Scholarships by Country
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary-500">
              Discover scholarships and study opportunities by destination country. Each country offers unique programs and benefits.
            </p>
          </div>
          <Link href="/countries" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            {totalCountries} countries
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {initialCountries.map((c) => (
            <Link
              key={c.id}
              href={`/scholarships?country=${c.id}`}
              className="group rounded-2xl border border-secondary-200 bg-white p-4 shadow-card transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card-hover text-center"
            >
              <div className="mb-3">
                <CountryFlag code={c.code} name={c.name} size="lg" className="mx-auto shadow-sm group-hover:scale-105 transition-transform" />
              </div>
              <h3 className="line-clamp-1 text-sm font-bold leading-tight text-secondary-900 group-hover:text-primary-600 transition-colors">{c.name}</h3>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-secondary-500">
                <GraduationCap className="h-3 w-3" />
                {c.scholarshipCount} scholarships
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/countries" className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-600 bg-transparent px-6 py-3 text-base font-semibold text-primary-600 transition-all hover:bg-primary-600 hover:text-white">
            <Globe className="h-5 w-5" />
            View All {totalCountries} Countries
          </Link>
        </div>
      </Container>
    </section>
  );
}