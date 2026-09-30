import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2
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
 * Written for the query people actually type ("scholarships", "grants",
 * "fellowships") rather than for the product name. The description states no
 * counts on purpose: snippets get cached for weeks, and a figure that drifts
 * out of date in a search result reads as untrustworthy.
 */
export const metadata = pageMetadata({
  title: "Scholarships, Grants & Fellowships Worldwide | Global Scholarship Hub",
  description:
    "Search and compare verified scholarships, grants, fellowships and financial aid from universities, governments and foundations worldwide. Filter by country, field and degree level, and never miss a deadline.",
  path: "/",
});

export default async function HomePage() {
  const [featured, fullyFunded, countryOptions, countryTiles, fields, stats] =
    await Promise.all([
      getPublicScholarships({ limit: 6 }),
      getPublicScholarships({ funding: "fully-funded", limit: 3 }),
      getPublicCountryOptions(),
      getPublicCountryTiles(12),
      getPublicFields(),
      getPublicStats(),
    ]);
  const featuredScholarships = featured.data;
  const fullyFundedList = fullyFunded.data;

  const popularSearches = [
    { label: "Fully Funded Scholarships", href: "/scholarships?funding=fully-funded" },
    { label: "Master's in Germany", href: "/scholarships?country=de&degree=Master's" },
    { label: "Undergraduate in USA", href: "/scholarships?country=us&degree=Undergraduate" },
    { label: "Computer Science", href: "/scholarships?field=cs" },
    { label: "No Application Fee", href: "/scholarships" },
    { label: "Chevening & Commonwealth", href: "/scholarships?query=Chevening" },
    { label: "DAAD Scholarships", href: "/scholarships?query=DAAD" },
  ];

  return (
    <div className="flex flex-col">
      {/* Describes the listings the page actually renders, in the order it
          renders them. Built from the same `featuredScholarships` array the
          cards below use, so the schema cannot claim entries that are absent. */}
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
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-white py-16 sm:py-24">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 transform blur-3xl opacity-30 pointer-events-none">
          <div className="h-[400px] w-[900px] bg-gradient-to-r from-primary-400 to-indigo-400 rounded-full" />
        </div>

        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-950 sm:text-6xl sm:leading-tight">
              Find Scholarships. <br className="hidden sm:inline" />
              <span className="text-primary-600">Fund Your Future.</span> Study Anywhere.
            </h1>

            <p className="mt-5 text-lg text-gray-600 sm:text-xl leading-relaxed max-w-2xl mx-auto">
              Discover verified scholarships, grants, fellowships, and financial aid from top universities, governments, and foundations worldwide.
            </p>

            {/* Quick Action CTAs */}
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

          {/* Large Hero Search Bar */}
          <div className="mx-auto mt-12 max-w-4xl">
            <HomeSearchForm countries={countryOptions} fields={fields} />

            {/* Popular Search Tags */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Popular:</span>
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
      <section className="border-y border-gray-100 bg-gray-50/60 py-8">
        <Container>
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            <div>
              <p className="text-3xl font-extrabold text-primary-600">
                {stats.openScholarships.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Open Scholarships
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">
                {stats.countries}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destinations Worldwide
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-600">
                {stats.universities}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Universities Listed
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600">
                {`${stats.verifiedShare}%`}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verified Recently
              </p>
            </div>
          </div>
        </Container>
      </section>
      <section className="py-16 bg-white">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Featured Programs
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Top Global Opportunities
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Prestigious government & institutional scholarships accepting applications right now.
              </p>
            </div>
            <Link
              href="/scholarships"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              View all scholarships →
            </Link>
          </div>

          {featuredScholarships.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
              No published scholarships yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredScholarships.map((sch) => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))}
            </div>
          )}
        </Container>
      </section>
      <section className="py-16 bg-gradient-to-r from-primary-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-800/80 px-3 py-1 text-xs font-semibold text-primary-200">
                Personalized Eligibility Questionnaire
              </span>
              <h2 className="text-3xl font-extrabold sm:text-4xl leading-tight">
                Not sure where to start? <br />
                Answer 10 quick questions to see your matches.
              </h2>
              <p className="text-primary-100 text-base leading-relaxed max-w-xl">
                Tell us your citizenship, target degree, field of interest, and GPA.                 Our matching engine will identify scholarships you qualify for, and show which part of the listing drove each match.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/finder"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-900 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-gray-100"
                >
                  Start Scholarship Finder
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-xs text-primary-200">Takes about two minutes</span>
              </div>
            </div>

            {/* Visual interactive preview box */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                    Example Match Breakdown
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300 font-medium">
                    Illustrative
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-bold text-white">Postgraduate study in Germany</div>
                  <div className="space-y-1.5 text-xs text-primary-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Degree level matches: Master&apos;s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Field of study matches: Computer Science</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Funding type matches: Fully funded</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <section className="py-16 bg-white">
        <Container>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Full Coverage
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Fully Funded Scholarships
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Opportunities where tuition and living costs are met by the awarding body.
                Check the coverage breakdown on each listing for what is included.
              </p>
            </div>
            <Link
              href="/fully-funded"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:mt-0"
            >
              See all fully funded &rarr;
            </Link>
          </div>

          {fullyFundedList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {fullyFundedList.map((s) => (
                <ScholarshipCard key={s.id} scholarship={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-10 text-center">
              <p className="text-sm text-gray-600">
                No fully funded opportunities are listed right now.{" "}
                <Link href="/scholarships" className="font-semibold text-primary-600 hover:underline">
                  Browse all scholarships
                </Link>
              </p>
            </div>
          )}
        </Container>
      </section>
      <section className="py-16 bg-gray-50/50">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Study Destinations
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Explore Scholarships by Country
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Discover tuition-free and fully funded destinations across Europe, North America, Asia & Oceania.
              </p>
            </div>
            <Link
              href="/countries"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              {stats.countries} countries →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                {/* Clamped rather than truncated: at two columns wide on a phone
                    a country name like "United Arab Emirates" would otherwise
                    be cut off with no way to read it. */}
                <h3 className="line-clamp-2 leading-tight font-bold text-gray-900 group-hover:text-primary-600 text-sm">
                  {c.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.scholarshipCount} scholarships</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-16 bg-white">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Disciplines
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Scholarships by Field of Study
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Find dedicated grants for STEM, Business, Medicine, Social Sciences, Arts and more.
              </p>
            </div>
            <Link
              href="/fields"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              All fields →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {fields.slice(0, 8).map((f) => (
              <Link
                key={f.id}
                href={`/scholarships?field=${encodeURIComponent(f.id)}`}
                className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-400 hover:bg-primary-50/30 shadow-xs"
              >
                <div className="min-w-0">
                  <h3 className="line-clamp-2 leading-tight font-semibold text-sm text-gray-900 group-hover:text-primary-700">
                    {f.name}
                  </h3>
                  <p className="text-xs text-gray-500">{f.scholarshipCount} programs</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              How Global Scholarship Hub Works
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              A transparent, trusted process from initial discovery to submitting on the official portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Tell Us About Yourself</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Specify your citizenship, academic achievements, target study level, and funding preferences to generate your personalized profile.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Discover & Compare</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Search verified listings with our matching engine. Compare funding amounts, coverage, deadlines, and eligibility side-by-side.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Track & Apply Directly</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Save deadlines to your personalized application tracker and apply directly through the official university or government portal.
              </p>
            </div>
          </div>
        </Container>
      </section>
      <section className="py-16 bg-white border-t border-gray-100">
        <Container>
          <div className="rounded-3xl bg-primary-50/70 border border-primary-100 p-8 sm:p-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 mb-4">
                <ShieldCheck className="h-4 w-4" />
                How we handle listings
              </div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Every listing links to its source
              </h2>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Each record carries a link to the awarding body&rsquo;s own page and the date
                we last checked it. Where a provider has not stated a funding amount, a
                deadline or an eligibility rule, we show &ldquo;not stated&rdquo; rather than
                guess. Match scores are our own heuristic, not an admissions decision.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-gray-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Source URL on every listing
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Last-checked date shown
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> No sign-up to browse
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <section className="py-16 bg-gray-900 text-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Never Miss a Scholarship Deadline
            </h2>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Receive weekly curated alerts tailored to your citizenship, desired study level, and target destination.
            </p>
            <DeadlineAlertsSignup />
          </div>
        </Container>
      </section>
    </div>
  );
}
