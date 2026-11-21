import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, CheckCircle2, Globe, BookOpen, Award, Bell, Users, Database, ExternalLink, GraduationCap, Building2, FileText, Filter, Search, Sparkles, Target, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { HomeSearchForm } from "@/app/HomeSearchForm";
import { DeadlineAlertsSignup } from "@/app/DeadlineAlertsSignup";
import { Button } from "@/components/ui/Button";
import { FeaturedScholarshipsTabs } from "@/app/FeaturedScholarshipsTabs";
import { FullyFundedScholarships } from "@/app/FullyFundedScholarships";
import { ScholarshipCategories } from "@/app/ScholarshipCategories";
import { CountriesExplorer } from "@/app/CountriesExplorer";
import { FieldsExplorer } from "@/app/FieldsExplorer";
import { ScholarshipMatchingCTA } from "@/app/ScholarshipMatchingCTA";
import { HowItWorks } from "@/app/HowItWorks";
import { VerificationTransparency } from "@/app/VerificationTransparency";
import { DeadlineAlerts } from "@/app/DeadlineAlerts";
import { NewsletterSection } from "@/app/NewsletterSection";

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

export const metadata = pageMetadata({
  title: "Find Scholarships That Move Your Future Forward | Global Scholarship Hub",

  description: "Discover verified international scholarships, grants, and fellowships. Search by country, university, field of study, and degree level. Compare funding, deadlines, and eligibility.",

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

const trustIndicators = [
  { icon: ShieldCheck, label: "Official Sources", description: "Direct links to provider portals" },
  { icon: CheckCircle2, label: "Transparent Eligibility", description: "Clear criteria, no hidden requirements" },
  { icon: Bell, label: "Updated Deadlines", description: "Real-time status from actual dates" },
];

const popularSearches = [
  { label: "Fully Funded Scholarships", href: "/scholarships?funding=fully-funded" },
  { label: "Master's in Germany", href: "/scholarships?country=de&degree=Master's" },
  { label: "Undergraduate in USA", href: "/scholarships?country=us&degree=Undergraduate" },
  { label: "Computer Science", href: "/scholarships?field=cs" },
  { label: "No Application Fee", href: "/scholarships" },
  { label: "Chevening & Commonwealth", href: "/scholarships?query=Chevening" },
  { label: "DAAD Scholarships", href: "/scholarships?query=DAAD" },
];

export default async function HomePage() {
  // Keep database reads sequential during static generation. The hosted
  // database has a small connection pool, and running all homepage queries
  // concurrently can exhaust it while Next.js prerenders the page.
  const featured = await getPublicScholarships({ limit: 6, featuredOnly: true });
  const fullyFunded = await getPublicScholarships({ funding: "fully-funded", limit: 3 });
  const countryOptions = await getPublicCountryOptions();
  const countryTiles = await getPublicCountryTiles(15);
  const fields = await getPublicFields();
  const stats = await getPublicStats();
  const closingSoon = await getPublicScholarships({ status: "closing soon", limit: 5 });
  const upcoming = await getPublicScholarships({ status: "upcoming", limit: 5 });
  const recentlyUpdated = await getPublicScholarships({ sort: "newest", limit: 5 });
  const featuredFullyFunded = await getPublicScholarships({ funding: "fully-funded", limit: 6 });
  const featuredUndergraduate = await getPublicScholarships({ degree: "Undergraduate", limit: 6 });
  const featuredMasters = await getPublicScholarships({ degree: "Master's", limit: 6 });
  const featuredPhd = await getPublicScholarships({ degree: "PhD", limit: 6 });

  const featuredScholarships = featured.data;
  const fullyFundedList = fullyFunded.data;

  return (
    <div className="flex flex-col">
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

      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-white py-16 sm:py-24 lg:py-32">
        <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 transform blur-3xl opacity-30 pointer-events-none">
          <div className="h-[400px] w-[900px] bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" />
        </div>

        <Container>
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  Your Global Education Partner
                </span>

                <h1 className="text-4xl font-extrabold tracking-tight text-secondary-900 sm:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                  Find Scholarships That Move Your
                  <span className="text-primary-600"> Future Forward.</span>
                </h1>

                <p className="mt-5 mx-auto max-w-2xl text-lg leading-relaxed text-secondary-600 sm:text-xl lg:mx-0">
                  Discover the best international scholarships, explore top universities, and achieve your study abroad dreams.
                </p>

                <div className="mt-8">
                  <HomeSearchForm countries={countryOptions} fields={fields} />
                </div>

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

              <div className="relative hidden lg:block">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-card-elevated bg-secondary-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/20" />
                  <div className="absolute inset-0 flex items-center justify-center relative z-10">
                    <Image
                      src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80"
                      alt="Global university campus"
                      fill
                      className="object-cover"
                      priority
                      sizes="50vw"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white pointer-events-none">
                    <div>
                      <p className="text-sm font-medium opacity-90">Top Study Destination</p>
                      <p className="text-2xl font-bold">United Kingdom</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium opacity-90">Scholarships Available</p>
                      <p className="text-2xl font-bold">{stats.openScholarships.toLocaleString()}+</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-secondary-200 bg-secondary-50/60 py-10">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
            {trustIndicators.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-secondary-100 text-center sm:text-left">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-secondary-900">{item.label}</p>
                  <p className="text-xs text-secondary-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <div className="p-4 sm:p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 mx-auto mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-primary-600">
                  {stats.openScholarships.toLocaleString()}+
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Open Scholarships
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 mx-auto mb-4">
                  <Globe className="h-6 w-6" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-secondary-900">
                  {stats.countries}+
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Countries Covered
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600 mx-auto mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-success-600">
                  {stats.universities}+
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Universities Listed
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-primary-600">
                  {stats.verifiedShare}%
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Verified Recently
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <FeaturedScholarshipsTabs
        initialScholarships={featuredScholarships}
        featuredFullyFunded={featuredFullyFunded.data}
        featuredUndergraduate={featuredUndergraduate.data}
        featuredMasters={featuredMasters.data}
        featuredPhd={featuredPhd.data}
      />

      <FullyFundedScholarships initialScholarships={fullyFundedList} />

      <ScholarshipCategories />

      <CountriesExplorer initialCountries={countryTiles} totalCountries={stats.countries} />

      <FieldsExplorer initialFields={fields.slice(0, 8)} />

      <ScholarshipMatchingCTA />

      <HowItWorks />

      <VerificationTransparency />

      <DeadlineAlerts
        closingSoon={closingSoon.data}
        upcoming={upcoming.data}
        recentlyUpdated={recentlyUpdated.data}
      />

      <NewsletterSection />
    </div>
  );
}