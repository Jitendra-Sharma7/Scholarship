import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, CheckCircle2, Globe, BookOpen, Award, Bell, Users, Database, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { HomeSearchForm } from "@/app/HomeSearchForm";
import { DeadlineAlertsSignup } from "@/app/DeadlineAlertsSignup";
import { Button } from "@/components/ui/Button";

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
    "Find Scholarships That Move Your Future Forward | Global Scholarship Hub",

  description:
    "Discover verified international scholarships, grants, and fellowships. Search by country, university, field of study, and degree level. Compare funding, deadlines, and eligibility.",

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

const popularSearches = [
  { label: "Fully Funded Scholarships", href: "/scholarships?funding=fully-funded" },
  { label: "Master's in Germany", href: "/scholarships?country=de&degree=Master's" },
  { label: "Undergraduate in USA", href: "/scholarships?country=us&degree=Undergraduate" },
  { label: "Computer Science", href: "/scholarships?field=cs" },
  { label: "No Application Fee", href: "/scholarships" },
  { label: "Chevening & Commonwealth", href: "/scholarships?query=Chevening" },
  { label: "DAAD Scholarships", href: "/scholarships?query=DAAD" },
];

const platformBenefits = [
  {
    icon: ShieldCheck,
    title: "Verified Information",
    description: "Every scholarship includes source URLs and last-verified dates. We never fabricate amounts, deadlines, or eligibility.",
  },
  {
    icon: Bell,
    title: "Real-Time Updates",
    description: "Deadline statuses (Open, Closing Soon, Expired) are calculated automatically from actual application dates.",
  },
  {
    icon: Award,
    title: "Smart Matching",
    description: "Our questionnaire evaluates nationality, academics, GPA, language scores, and funding preferences for explainable matches.",
  },
  {
    icon: Database,
    title: "Deadline Tracking",
    description: "Save scholarships and receive automated reminders at 30, 15, 7, and 1 day before deadlines.",
  },
  {
    icon: Globe,
    title: "Transparent Sources",
    description: "Direct links to official provider portals. We charge no fees and never redirect through intermediaries.",
  },
  {
    icon: Users,
    title: "Global Coverage",
    description: "Scholarships from governments, universities, and foundations across 100+ countries and 500+ institutions.",
  },
];

const trustIndicators = [
  { icon: ShieldCheck, label: "Official Sources", description: "Direct links to provider portals" },
  { icon: CheckCircle2, label: "Transparent Eligibility", description: "Clear criteria, no hidden requirements" },
  { icon: Bell, label: "Updated Deadlines", description: "Real-time status from actual dates" },
];

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
    getPublicScholarships({ funding: "fully-funded", limit: 3 }),
    getPublicCountryOptions(),
    getPublicCountryTiles(12),
    getPublicFields(),
    getPublicStats(),
  ]);

  const featuredScholarships = featured.data;
  const fullyFundedList = fullyFunded.data;

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
            description: s.shortDescription ?? s.description,
          })),
        })}
      />

      {/* ======================================================
          HERO SECTION
          ====================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-white py-16 sm:py-24 lg:py-32">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 transform blur-3xl opacity-30 pointer-events-none">
          <div className="h-[400px] w-[900px] bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" />
        </div>

        <Container>
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                {/* Trust Indicators */}
                <div className="mb-6 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  {trustIndicators.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium text-secondary-600">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl font-extrabold tracking-tight text-secondary-900 sm:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                  Find Scholarships That Move Your Future Forward.
                </h1>

                <p className="mt-5 mx-auto max-w-2xl text-lg leading-relaxed text-secondary-600 sm:text-xl lg:mx-0">
                  Discover verified scholarships, grants, fellowships, and financial aid from top universities, governments, and foundations worldwide.
                </p>

                {/* Search Bar */}
                <div className="mt-8">
                  <HomeSearchForm countries={countryOptions} fields={fields} />
                </div>

                {/* Popular Searches */}
                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Popular searches:</span>
                  {popularSearches.map((tag) => (
                    <Link
                      key={tag.label}
                      href={tag.href}
                      className="rounded-full border border-secondary-200 bg-white/80 px-3 py-1 text-xs text-secondary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right: Hero Image */}
              <div className="relative hidden lg:block">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-card-elevated bg-secondary-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/20" />
                  <Image
                    src="/hero-university.jpg"
                    alt="Global university campus"
                    fill
                    className="object-cover opacity-10"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center relative z-10">
                    <div className="text-center p-8">
                      <Globe className="mx-auto h-24 w-24 text-primary-200" />
                      <h3 className="mt-4 text-2xl font-bold text-secondary-900">Global Opportunities</h3>
                      <p className="mt-2 text-secondary-600">100+ countries • 500+ universities • 1000+ scholarships</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================
          PLATFORM STATISTICS
          ====================================================== */}
      <section className="border-y border-secondary-200 bg-secondary-50/60 py-12">
        <Container>
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-600">
                {stats.openScholarships.toLocaleString()}+
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                Open Scholarships
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-secondary-900">
                {stats.countries}+
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                Countries Covered
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-success-600">
                {stats.universities}+
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                Universities Listed
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-600">
                {stats.verifiedShare}%
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                Verified Recently
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================
          FEATURED SCHOLARSHIPS
          ====================================================== */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Featured Programs
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">
                Top Global Scholarship Opportunities
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-secondary-500">
                Explore scholarship opportunities from governments, universities, foundations, and other institutions.
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
            <div className="rounded-2xl border border-dashed border-secondary-300 bg-secondary-50/50 p-12 text-center text-sm text-secondary-500">
              No published scholarships yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredScholarships.map((sch) => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ======================================================
          SCHOLARSHIP MATCHING CTA
          ====================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-900 to-primary-700 py-16 sm:py-24 text-white">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <Container>
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-800/80 px-3 py-1 text-xs font-semibold text-primary-200">
                Personalized Eligibility Questionnaire
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Not sure where to start?
                <br />
                Find scholarships that match you.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-primary-100">
                Tell us your citizenship, target degree, field of interest, and GPA. Our matching engine helps identify scholarships that match your profile.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/finder">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Start Scholarship Finder
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <span className="text-xs text-primary-200">Takes about two minutes</span>
              </div>
            </div>

            {/* Match preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">Example Match Breakdown</span>
                  <span className="rounded-full bg-success-500/20 px-2 py-0.5 text-xs font-medium text-success-300">Illustrative</span>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-bold text-white">Postgraduate study in Germany</div>
                  <div className="space-y-1.5 text-xs text-primary-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-400" />
                      <span>Degree level matches: Master's</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-400" />
                      <span>Field of study matches: Computer Science</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-400" />
                      <span>Funding type matches: Fully funded</span>
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
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-success-600">
                Full Coverage
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">Fully Funded Scholarships</h2>
              <p className="mt-1 max-w-2xl text-sm text-secondary-500">
                Explore scholarship opportunities where the awarding body provides substantial financial support. Check each listing for the exact coverage.
              </p>
            </div>
            <Link href="/fully-funded" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0">
              See all fully funded
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {fullyFundedList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fullyFundedList.map((s) => (
                <ScholarshipCard key={s.id} scholarship={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-secondary-300 bg-secondary-50/50 p-10 text-center">
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

      {/* ======================================================
          SCHOLARSHIPS BY COUNTRY
          ====================================================== */}
      <section className="bg-secondary-50/50 py-16 sm:py-24">
        <Container>
          <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">Study Destinations</div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">Scholarships by Country</h2>
              <p className="mt-1 max-w-2xl text-sm text-secondary-500">Explore scholarships and study opportunities by destination country.</p>
            </div>
            <Link href="/countries" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0">
              {stats.countries} countries
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {countryTiles.map((c) => (
              <Link
                key={c.id}
                href={`/scholarships?country=${c.id}`}
                className="group rounded-2xl border border-secondary-200 bg-white p-4 shadow-card transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card-hover"
              >
                <div className="mb-2">
                  <CountryFlag code={c.code} name={c.name} size="lg" className="shadow-sm" />
                </div>
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-secondary-900 group-hover:text-primary-600">{c.name}</h3>
                <p className="mt-0.5 text-xs text-secondary-500">{c.scholarshipCount} scholarships</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ======================================================
          SCHOLARSHIPS BY FIELD
          ====================================================== */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">Academic Disciplines</div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">Scholarships by Field of Study</h2>
              <p className="mt-1 max-w-2xl text-sm text-secondary-500">Find scholarship opportunities for computer science, engineering, business, medicine, social sciences, arts, and more.</p>
            </div>
            <Link href="/fields" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0">
              All fields
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fields.slice(0, 8).map((f) => (
              <Link
                key={f.id}
                href={`/scholarships?field=${encodeURIComponent(f.id)}`}
                className="group flex items-center gap-3 rounded-2xl border border-secondary-200 bg-white p-4 shadow-card transition-all hover:border-primary-400 hover:bg-primary-50/30"
              >
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-secondary-900 group-hover:text-primary-700">{f.name}</h3>
                  <p className="text-xs text-secondary-500">{f.scholarshipCount} programs</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ======================================================
          HOW IT WORKS
          ====================================================== */}
      <section className="border-t border-secondary-200 bg-secondary-50 py-16 sm:py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">How Global Scholarship Hub Works</h2>
            <p className="mt-2 text-sm text-secondary-500">Discover scholarship opportunities, compare them, and continue to the official application source.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-lg font-bold text-primary-700">1</div>
              <h3 className="text-lg font-bold text-secondary-900">Tell Us About Yourself</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-600">Specify your citizenship, academic achievements, target study level, and funding preferences.</p>
            </div>

            <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-lg font-bold text-primary-700">2</div>
              <h3 className="text-lg font-bold text-secondary-900">Discover & Compare</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-600">Search scholarship listings and compare funding, coverage, deadlines, eligibility, and destinations.</p>
            </div>

            <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-lg font-bold text-success-700">3</div>
              <h3 className="text-lg font-bold text-secondary-900">Track & Apply</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-600">Save deadlines and continue your application through the official university, government, or scholarship provider website.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================
          TRUST / VERIFICATION
          ====================================================== */}
      <section className="border-t border-secondary-200 bg-white py-16 sm:py-24">
        <Container>
          <div className="rounded-3xl border border-primary-100 bg-primary-50/70 p-8 sm:p-12">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-800">
                <ShieldCheck className="h-4 w-4" />
                How we handle listings
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900">Scholarship information with source transparency</h2>
              <p className="mt-3 text-sm leading-relaxed text-secondary-700">
                Each scholarship listing includes its available source information and the date it was last checked. Where a provider has not stated a funding amount, deadline, or eligibility requirement, the listing indicates that information is not stated rather than presenting an unsupported value.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-secondary-700">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success-600" /> Source URL on listings</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success-600" /> Last-checked information</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success-600" /> Browse without signing up</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success-600" /> No application fees charged</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================
          PLATFORM BENEFITS
          ====================================================== */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">Why Students Choose Global Scholarship Hub</h2>
            <p className="mt-2 text-sm text-secondary-500">Built for real usability, accessibility, and data accuracy — not just visual appearance.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platformBenefits.map((benefit, index) => (
              <div key={index} className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ======================================================
          SEO CONTENT
          ====================================================== */}
      <section className="border-t border-secondary-200 bg-secondary-50 py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">Find Scholarships for International Students</h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-secondary-600">
              <p>Global Scholarship Hub helps students discover scholarships, grants, fellowships, and financial aid opportunities from universities, governments, and foundations around the world. Explore funding opportunities for undergraduate, master's, doctoral, and other degree programs.</p>
              <p>Search for fully funded scholarships and study abroad opportunities by country, university, field of study, degree level, and funding type. Whether you are looking for scholarships in the United States, United Kingdom, Germany, Canada, Australia, Europe, Asia, or other destinations, you can explore opportunities in one place.</p>
              <p>Global Scholarship Hub provides scholarship information including eligibility requirements, funding details, application deadlines, study destinations, degree levels, and official application sources. Always verify the latest requirements and deadlines on the official scholarship provider's website before applying.</p>
            </div>

            {/* SEO INTERNAL LINKS */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/fully-funded" className="group rounded-2xl border border-secondary-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card-hover">
                <h3 className="font-bold text-secondary-900 group-hover:text-primary-600">Fully Funded Scholarships</h3>
                <p className="mt-2 text-sm leading-6 text-secondary-500">Explore scholarships offering substantial financial support for international students.</p>
              </Link>
              <Link href="/scholarships" className="group rounded-2xl border border-secondary-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card-hover">
                <h3 className="font-bold text-secondary-900 group-hover:text-primary-600">International Scholarships</h3>
                <p className="mt-2 text-sm leading-6 text-secondary-500">Browse scholarship opportunities for students from different countries.</p>
              </Link>
              <Link href="/countries" className="group rounded-2xl border border-secondary-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card-hover">
                <h3 className="font-bold text-secondary-900 group-hover:text-primary-600">Scholarships by Country</h3>
                <p className="mt-2 text-sm leading-6 text-secondary-500">Explore scholarships and study opportunities by destination country.</p>
              </Link>
              <Link href="/fields" className="group rounded-2xl border border-secondary-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card-hover">
                <h3 className="font-bold text-secondary-900 group-hover:text-primary-600">Scholarships by Field</h3>
                <p className="mt-2 text-sm leading-6 text-secondary-500">Find funding opportunities for different academic fields and disciplines.</p>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================
          DEADLINE ALERTS
          ====================================================== */}
      <section className="bg-secondary-900 py-16 sm:py-24 text-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Never Miss a Scholarship Deadline</h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary-400">Receive weekly curated alerts tailored to your citizenship, desired study level, and target destination.</p>
            <DeadlineAlertsSignup />
          </div>
        </Container>
      </section>

      {/* ======================================================
          NEWSLETTER
          ====================================================== */}
      <section className="bg-primary-50 py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">Stay Updated on New Opportunities</h2>
            <p className="mt-2 text-sm text-secondary-600">Get the latest scholarships, deadline reminders, and application tips delivered to your inbox.</p>
            <NewsletterForm />
          </div>
        </Container>
      </section>

      {/* ======================================================
          FOOTER
          ====================================================== */}
      <Footer />
    </div>
  );
}

/* ============================================================
    NEWSLETTER FORM
    ============================================================ */
function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    // Simulate API call - replace with actual API endpoint
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email.includes("@")) {
      setStatus("success");
      setMessage("Thanks for subscribing! Check your inbox for confirmation.");
      setEmail("");
    } else {
      setStatus("error");
      setMessage("Please enter a valid email address.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="flex-1">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="input-field"
          disabled={status === "loading" || status === "success"}
        />
      </div>
      <Button type="submit" variant="primary" disabled={status === "loading" || status === "success"} className="shrink-0">
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}

/* ============================================================
    FOOTER
    ============================================================ */
function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Explore: [
      { label: "Scholarships", href: "/scholarships" },
      { label: "Universities", href: "/universities" },
      { label: "Countries", href: "/countries" },
      { label: "Fields of Study", href: "/fields" },
      { label: "Fully Funded", href: "/fully-funded" },
      { label: "Deadlines", href: "/deadlines" },
    ],
    Resources: [
      { label: "Scholarship Guides", href: "/guides" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Scholarship Finder", href: "/finder" },
      { label: "Compare Scholarships", href: "/compare" },
    ],
    Company: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Submit Scholarship", href: "/submit-scholarship" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/globalscholarhub", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg> },
    { name: "LinkedIn", href: "https://linkedin.com/company/globalscholarshiphub", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" /></svg> },
    { name: "Facebook", href: "https://facebook.com/globalscholarshiphub", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg> },
    { name: "Instagram", href: "https://instagram.com/globalscholarshiphub", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg> },
    { name: "YouTube", href: "https://youtube.com/@globalscholarshiphub", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 00.46 12a29 29 0 00.46 5.54 2.78 2.78 0 001.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.54 29 29 0 00-.46-5.54z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg> },
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      <Container className="py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/diploma_hat.png" alt="" width={32} height={32} />
              <span className="text-xl font-bold">Global Scholarship Hub</span>
            </div>
            <p className="text-secondary-400 text-sm leading-relaxed mb-6 max-w-xs">
              Helping students worldwide discover verified scholarship opportunities. Transparent sources, real deadlines, no fees.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-white transition-colors" aria-label={social.name}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <nav>
            <h3 className="font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-secondary-400">
              {footerLinks.Explore.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-secondary-400">
              {footerLinks.Resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-secondary-400">
              {footerLinks.Company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-secondary-400">
              {footerLinks.Legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-secondary-500">
            &copy; {currentYear} Global Scholarship Hub. All rights reserved.
          </p>
          <p className="text-sm text-secondary-500">
            Not affiliated with any government or university. Always verify details on official provider websites.
          </p>
        </div>
      </Container>
    </footer>
  );
}