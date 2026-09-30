import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import { Container } from "@/components/layout/Layout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { HomeSearchForm } from "@/app/HomeSearchForm";
import { DeadlineAlertsSignup } from "@/app/DeadlineAlertsSignup";

import JsonLd from "@/components/seo/JsonLd";

import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

import {
  getPublicCountryOptions,
  getPublicCountryTiles,
  getPublicFields,
  getPublicScholarships,
  getPublicStats,
} from "@/lib/data/public";

/**
 * ============================================================
 * HOMEPAGE SEO
 * ============================================================
 *
 * This page targets natural search intent around:
 *
 * - scholarships
 * - fully funded scholarships
 * - international scholarships
 * - scholarships for international students
 * - study abroad scholarships
 * - master's scholarships
 * - PhD scholarships
 * - undergraduate scholarships
 *
 * Avoid putting misleading claims or outdated numbers into the
 * metadata because search engines can cache snippets.
 */
export const metadata = pageMetadata({
  title:
    "Fully Funded Scholarships Worldwide for International Students",

  description:
    "Find fully funded scholarships, grants and fellowships for international students. Search scholarships by country, university, field of study and degree level.",

  path: "/",

  keywords: [
    "scholarships",
    "fully funded scholarships",
    "fully funded scholarships worldwide",
    "international scholarships",
    "scholarships for international students",
    "study abroad scholarships",
    "scholarships for international students 2026",
    "masters scholarships",
    "master's scholarships",
    "PhD scholarships",
    "doctoral scholarships",
    "undergraduate scholarships",
    "bachelor scholarships",
    "university scholarships",
    "government scholarships",
    "scholarship grants",
    "international student grants",
    "fellowships",
    "fully funded masters scholarships",
    "fully funded PhD scholarships",
    "fully funded undergraduate scholarships",
    "study abroad funding",
    "financial aid for international students",
  ],
});

export default async function HomePage() {
  const [
    featured,
    fullyFunded,
    countryOptions,
    countryTiles,
    fields,
    stats,
  ] = await Promise.all([
    getPublicScholarships({ limit: 6 }),

    getPublicScholarships({
      funding: "fully-funded",
      limit: 3,
    }),

    getPublicCountryOptions(),

    getPublicCountryTiles(12),

    getPublicFields(),

    getPublicStats(),
  ]);

  const featuredScholarships = featured.data;
  const fullyFundedList = fullyFunded.data;

  /**
   * Popular searches
   *
   * These create additional internal links that help users and
   * search engines discover important scholarship categories.
   */
  const popularSearches = [
    {
      label: "Fully Funded Scholarships",
      href: "/scholarships?funding=fully-funded",
    },
    {
      label: "Master's in Germany",
      href: "/scholarships?country=de&degree=Master's",
    },
    {
      label: "Undergraduate in USA",
      href: "/scholarships?country=us&degree=Undergraduate",
    },
    {
      label: "Computer Science",
      href: "/scholarships?field=cs",
    },
    {
      label: "No Application Fee",
      href: "/scholarships",
    },
    {
      label: "Chevening & Commonwealth",
      href: "/scholarships?query=Chevening",
    },
    {
      label: "DAAD Scholarships",
      href: "/scholarships?query=DAAD",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ======================================================
          STRUCTURED DATA
          ====================================================== */}

      <JsonLd
        data={itemListSchema({
          name: "Featured scholarships",
          items: featuredScholarships.map((s) => ({
            name: s.title,
            path: `/scholarships/${s.slug}`,
            description:
              s.shortDescription ?? s.description,
          })),
        })}
      />

      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-white py-16 sm:py-24">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 transform blur-3xl opacity-30 pointer-events-none">
          <div className="h-[400px] w-[900px] bg-gradient-to-r from-primary-400 to-indigo-400 rounded-full" />
        </div>

        <Container>
          <div className="mx-auto max-w-4xl text-center">

            {/* MAIN SEO HEADING */}
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-950 sm:text-6xl sm:leading-tight">
              Find Fully Funded Scholarships.
              <br className="hidden sm:inline" />

              <span className="text-primary-600">
                {" "}Study Anywhere.
              </span>
            </h1>

            <p className="mt-5 mx-auto max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              Discover verified scholarships, grants, fellowships,
              and financial aid from top universities, governments,
              and foundations worldwide.
            </p>

            {/* CTA BUTTONS */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">

              <Link
                href="/finder"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-primary-500/20 transition-all hover:bg-primary-700 hover:shadow-lg"
              >
                Find My Scholarships (Matcher)
              </Link>

              <Link
                href="/scholarships"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50"
              >
                Browse All Opportunities

                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>
          </div>

          {/* ==================================================
              SEARCH
              ================================================== */}

          <div className="mx-auto mt-12 max-w-4xl">

            <HomeSearchForm
              countries={countryOptions}
              fields={fields}
            />

            {/* Popular searches */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">

              <span className="text-xs font-semibold text-gray-500">
                Popular:
              </span>

              {popularSearches.map((tag) => (
                <Link
                  key={tag.label}
                  href={tag.href}
                  className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  {tag.label}
                </Link>
              ))}

            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================
          STATISTICS
          ====================================================== */}

      <section className="border-y border-gray-100 bg-gray-50/60 py-8">
        <Container>

          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">

            <div>
              <p className="text-3xl font-extrabold text-primary-600">
                {stats.openScholarships.toLocaleString()}
              </p>

              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Open Scholarships
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-gray-900">
                {stats.countries}
              </p>

              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Destinations Worldwide
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-emerald-600">
                {stats.universities}
              </p>

              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Universities Listed
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-indigo-600">
                {`${stats.verifiedShare}%`}
              </p>

              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Verified Recently
              </p>
            </div>

          </div>

        </Container>
      </section>

      {/* ======================================================
          FEATURED SCHOLARSHIPS
          ====================================================== */}

      <section className="bg-white py-16">
        <Container>

          <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-end">

            <div>

              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Featured Programs
              </div>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Top Global Scholarship Opportunities
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Explore scholarship opportunities from governments,
                universities, foundations, and other institutions.
              </p>

            </div>

            <Link
              href="/scholarships"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0"
            >
              View all scholarships
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          {featuredScholarships.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
              No published scholarships yet.
            </div>

          ) : (

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

              {featuredScholarships.map((sch) => (
                <ScholarshipCard
                  key={sch.id}
                  scholarship={sch}
                />
              ))}

            </div>

          )}

        </Container>
      </section>

      {/* ======================================================
          SCHOLARSHIP FINDER
          ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-r from-primary-900 to-indigo-900 py-16 text-white">

        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />

        <Container>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">

            <div className="space-y-4 lg:col-span-7">

              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-800/80 px-3 py-1 text-xs font-semibold text-primary-200">
                Personalized Eligibility Questionnaire
              </span>

              <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                Not sure where to start?
                <br />
                Find scholarships that match you.
              </h2>

              <p className="max-w-xl text-base leading-relaxed text-primary-100">
                Tell us your citizenship, target degree, field
                of interest, and GPA. Our matching engine helps
                identify scholarships that match your profile.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">

                <Link
                  href="/finder"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-900 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-gray-100"
                >
                  Start Scholarship Finder

                  <ArrowRight className="h-4 w-4" />
                </Link>

                <span className="text-xs text-primary-200">
                  Takes about two minutes
                </span>

              </div>

            </div>

            {/* Match preview */}
            <div className="lg:col-span-5">

              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">

                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">

                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                    Example Match Breakdown
                  </span>

                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    Illustrative
                  </span>

                </div>

                <div className="space-y-3">

                  <div className="text-sm font-bold text-white">
                    Postgraduate study in Germany
                  </div>

                  <div className="space-y-1.5 text-xs text-primary-100">

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>
                        Degree level matches: Master&apos;s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>
                        Field of study matches: Computer Science
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>
                        Funding type matches: Fully funded
                      </span>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>

        </Container>
      </section>

      {/* ======================================================
          FULLY FUNDED SCHOLARSHIPS
          ====================================================== */}

      <section className="bg-white py-16">
        <Container>

          <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-end">

            <div>

              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Full Coverage
              </div>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Fully Funded Scholarships
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Explore scholarship opportunities where the awarding
                body provides substantial financial support. Check
                each listing for the exact coverage.
              </p>

            </div>

            <Link
              href="/fully-funded"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0"
            >
              See all fully funded
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          {fullyFundedList.length > 0 ? (

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

              {fullyFundedList.map((s) => (
                <ScholarshipCard
                  key={s.id}
                  scholarship={s}
                />
              ))}

            </div>

          ) : (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-10 text-center">

              <p className="text-sm text-gray-600">
                No fully funded opportunities are listed right now.{" "}

                <Link
                  href="/scholarships"
                  className="font-semibold text-primary-600 hover:underline"
                >
                  Browse all scholarships
                </Link>

              </p>

            </div>

          )}

        </Container>
      </section>

      {/* ======================================================
          SCHOLARSHIPS BY COUNTRY
          ====================================================== */}

      <section className="bg-gray-50/50 py-16">
        <Container>

          <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-end">

            <div>

              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Study Destinations
              </div>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Scholarships by Country
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Explore scholarships and study opportunities by
                destination country.
              </p>

            </div>

            <Link
              href="/countries"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0"
            >
              {stats.countries} countries
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

            {countryTiles.map((c) => (

              <Link
                key={c.id}
                href={`/scholarships?country=${c.id}`}
                className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-xs transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
              >

                <div className="mb-2">
                  <CountryFlag
                    code={c.code}
                    name={c.name}
                    size="lg"
                    className="shadow-sm"
                  />
                </div>

                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-gray-900 group-hover:text-primary-600">
                  {c.name}
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  {c.scholarshipCount} scholarships
                </p>

              </Link>

            ))}

          </div>

        </Container>
      </section>

      {/* ======================================================
          SCHOLARSHIPS BY FIELD
          ====================================================== */}

      <section className="bg-white py-16">
        <Container>

          <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-end">

            <div>

              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Academic Disciplines
              </div>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Scholarships by Field of Study
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Find scholarship opportunities for computer
                science, engineering, business, medicine, social
                sciences, arts, and more.
              </p>

            </div>

            <Link
              href="/fields"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0"
            >
              All fields
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {fields.slice(0, 8).map((f) => (

              <Link
                key={f.id}
                href={`/scholarships?field=${encodeURIComponent(f.id)}`}
                className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs transition-all hover:border-primary-400 hover:bg-primary-50/30"
              >

                <div className="min-w-0">

                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900 group-hover:text-primary-700">
                    {f.name}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {f.scholarshipCount} programs
                  </p>

                </div>

              </Link>

            ))}

          </div>

        </Container>
      </section>

      {/* ======================================================
          HOW IT WORKS
          ====================================================== */}

      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <Container>

          <div className="mx-auto mb-12 max-w-2xl text-center">

            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              How Global Scholarship Hub Works
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Discover scholarship opportunities, compare them,
              and continue to the official application source.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-lg font-bold text-primary-700">
                1
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Tell Us About Yourself
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Specify your citizenship, academic achievements,
                target study level, and funding preferences.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
                2
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Discover &amp; Compare
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Search scholarship listings and compare funding,
                coverage, deadlines, eligibility, and destinations.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-700">
                3
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Track &amp; Apply
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Save deadlines and continue your application
                through the official university, government,
                or scholarship provider website.
              </p>

            </div>

          </div>

        </Container>
      </section>

      {/* ======================================================
          TRUST / VERIFICATION
          ====================================================== */}

      <section className="border-t border-gray-100 bg-white py-16">
        <Container>

          <div className="rounded-3xl border border-primary-100 bg-primary-50/70 p-8 sm:p-12">

            <div className="max-w-3xl">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">

                <ShieldCheck className="h-4 w-4" />

                How we handle listings

              </div>

              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Scholarship information with source transparency
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Each scholarship listing includes its available
                source information and the date it was last checked.
                Where a provider has not stated a funding amount,
                deadline, or eligibility requirement, the listing
                should indicate that information is not stated rather
                than presenting an unsupported value.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-gray-700">

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Source URL on listings
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Last-checked information
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Browse without signing up
                </span>

              </div>

            </div>

          </div>

        </Container>
      </section>

      {/* ======================================================
          SEO CONTENT
          ====================================================== */}

      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <Container>

          <div className="mx-auto max-w-4xl">

            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Find Scholarships for International Students
            </h2>

            <div className="mt-6 space-y-5 text-base leading-8 text-gray-600">

              <p>
                Global Scholarship Hub helps students discover
                scholarships, grants, fellowships, and financial
                aid opportunities from universities, governments,
                and foundations around the world. Explore funding
                opportunities for undergraduate, master&apos;s,
                doctoral, and other degree programs.
              </p>

              <p>
                Search for fully funded scholarships and study
                abroad opportunities by country, university,
                field of study, degree level, and funding type.
                Whether you are looking for scholarships in the
                United States, United Kingdom, Germany, Canada,
                Australia, Europe, Asia, or other destinations,
                you can explore opportunities in one place.
              </p>

              <p>
                Global Scholarship Hub provides scholarship
                information including eligibility requirements,
                funding details, application deadlines, study
                destinations, degree levels, and official
                application sources. Always verify the latest
                requirements and deadlines on the official
                scholarship provider&apos;s website before applying.
              </p>

            </div>

            {/* SEO INTERNAL LINKS */}

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <Link
                href="/fully-funded"
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
              >

                <h3 className="font-bold text-gray-900 group-hover:text-primary-600">
                  Fully Funded Scholarships
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Explore scholarships offering substantial
                  financial support for international students.
                </p>

              </Link>

              <Link
                href="/scholarships"
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
              >

                <h3 className="font-bold text-gray-900 group-hover:text-primary-600">
                  International Scholarships
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Browse scholarship opportunities for students
                  from different countries.
                </p>

              </Link>

              <Link
                href="/countries"
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
              >

                <h3 className="font-bold text-gray-900 group-hover:text-primary-600">
                  Scholarships by Country
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Explore scholarships and study opportunities
                  by destination country.
                </p>

              </Link>

              <Link
                href="/fields"
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
              >

                <h3 className="font-bold text-gray-900 group-hover:text-primary-600">
                  Scholarships by Field
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Find funding opportunities for different
                  academic fields and disciplines.
                </p>

              </Link>

            </div>

          </div>

        </Container>
      </section>

      {/* ======================================================
          DEADLINE ALERTS
          ====================================================== */}

      <section className="bg-gray-900 py-16 text-white">
        <Container>

          <div className="mx-auto max-w-2xl text-center">

            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Never Miss a Scholarship Deadline
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Receive weekly curated alerts tailored to your
              citizenship, desired study level, and target
              destination.
            </p>

            <DeadlineAlertsSignup />

          </div>

        </Container>
      </section>

    </div>
  );
}
