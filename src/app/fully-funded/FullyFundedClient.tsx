"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { Pagination } from "@/components/ui/Pagination";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";
import type { PublicScholarship } from "@/lib/data/public";

/**
 * Client half of /fully-funded.
 *
 * The list is fetched on the server and handed in as a prop, so the page shows
 * real records on first paint and honours whatever the admin has published. The
 * cards are then paged in the browser, like the country, university and field
 * directories, so the page stays server-rendered rather than hiding its records
 * behind a client fetch.
 */
export default function FullyFundedClient({
  scholarships,
}: {
  scholarships: PublicScholarship[];
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(scholarships.length / SCHOLARSHIP_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * SCHOLARSHIP_PAGE_SIZE;
  const visible = scholarships.slice(start, start + SCHOLARSHIP_PAGE_SIZE);

  return (
    <div className="bg-gray-50/50 min-h-screen py-10">
      <Container>
        {/* Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 sm:p-12 text-white mb-10 shadow-lg">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
              100% Coverage (Tuition + Stipend + Travel + Housing)
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Fully Funded Scholarships Worldwide
            </h1>
            <p className="mt-4 text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              Study abroad without financial burden. Discover verified government and institutional programs covering 100% of your tuition fees, monthly living expenses, return airfare, and health insurance.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-emerald-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> DAAD, Fulbright, Chevening &amp; Commonwealth
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Official Application Links
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Updated for 2026/2027
              </span>
            </div>
          </div>
        </div>

        {/* List of Fully Funded Opportunities */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            {scholarships.length} Fully Funded Program{scholarships.length === 1 ? "" : "s"} Available
          </h2>
          <p className="text-sm text-gray-600" role="status">
            {scholarships.length > 0 && (
              <>
                Showing {start + 1}&ndash;{Math.min(start + SCHOLARSHIP_PAGE_SIZE, scholarships.length)}{" "}
                of {scholarships.length}
              </>
            )}
          </p>
        </div>

        <div className="mb-6">
          <Link
            href="/finder"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Check your eligibility with the Matcher &rarr;
          </Link>
        </div>

        {scholarships.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <h3 className="text-base font-semibold text-gray-900">
              No fully funded scholarships are published yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Fully funded programs appear here automatically once an administrator marks a
              scholarship as fully funded and publishes it.
            </p>
            <Link
              href="/scholarships"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Browse all scholarships
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((sch) => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              label="Fully funded program pages"
            />
          </>
        )}
      </Container>
    </div>
  );
}
