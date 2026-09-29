import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Megaphone, Handshake, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import { Container } from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: "Partner With Us",
  description:
    "Reach students across more than 20 countries through Global Scholarship Hub. Sponsored listings, verified institutional profiles, and newsletter placements.",
};

export default function AdvertisePage() {
  const offerings = [
    {
      icon: Megaphone,
      title: "Sponsored Listings",
      body: "Promote a scholarship, programme, or recruitment initiative to students actively searching for funding. Sponsored placements are always labelled and are never presented as verified opportunities.",
    },
    {
      icon: Building2,
      title: "Verified Institutional Profiles",
      body: "Maintain a profile for your university or organisation with programmes, funding options, and official links, so students can research you in context rather than through an advertisement.",
    },
    {
      icon: Handshake,
      title: "Data and Insight Partnerships",
      body: "Work with us on research into scholarship access and mobility. We share aggregate, privacy-conscious patterns rather than individual user data, and never on individual student records.",
    },
  ];

  const principles = [
    {
      title: "Paid placement never changes organic ranking",
      body: "Sponsorship has no influence on the order, scoring, or visibility of organic search results. Commercial ranking is not something we do.",
    },
    {
      title: "Sponsored is labelled as sponsored",
      body: "Students should always be able to tell which listings are paid. We do not blend advertising into scholarship information.",
    },
    {
      title: "Sponsored does not mean verified",
      body: "Being a partner is not a verification. Verification is a separate process against an official source, and a sponsored listing is not automatically verified.",
    },
    {
      title: "No claims on our behalf",
      body: "We do not publish success rates, acceptance rates, or outcome statistics for partners unless they are independently verifiable.",
    },
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <Container>
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            <Megaphone className="h-3.5 w-3.5" />
            For Organisations
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Partner With Us
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Global Scholarship Hub helps students find funding, and helps organisations that offer
            funding reach the right students. Here is how the two work together, and where we draw
            the line.
          </p>
        </div>

        {/* Offerings */}
        <section id="ways-to-work-with-us" className="mb-12 scroll-mt-24">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Ways to work with us</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {offerings.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Principles */}
        <section id="advertising-policy" className="mb-12 scroll-mt-24">
          <h2 className="mb-2 text-xl font-bold text-gray-900">How we handle advertising</h2>
          <p className="mb-5 max-w-2xl text-sm text-gray-600">
            Advertising only works if students trust the information around it. These rules are not
            negotiable, and they apply to every partner.
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {principles.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit alternative */}
        <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Do you have a scholarship to list?</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Listing a scholarship does not cost anything. If you are an awarding organisation
                and want your programme in front of students, submit it for editorial review. We
                verify the source before publishing, and we will never publish a listing you have
                not approved.
              </p>
              <Link
                href="/submit-scholarship"
                className="mt-4 inline-flex items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Submit a Scholarship
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
          <h2 className="text-xl font-bold text-gray-900">Talk to our partnerships team</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
            Tell us about your organisation and the students you want to reach. We will reply
            within 24&ndash;48 hours with information on formats, pricing, and the verification
            process for institutional profiles.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:partnerships@globalscholarshiphub.com"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Mail className="h-4 w-4" />
              partnerships@globalscholarshiphub.com
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Contact Form
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
}
