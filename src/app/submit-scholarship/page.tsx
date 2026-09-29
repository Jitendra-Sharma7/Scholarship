import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/Layout";
import { getPublicCountries } from "@/lib/data/public";
import { SubmitScholarshipForm } from "@/components/submissions/SubmitScholarshipForm";

/**
 * Public submission intake.
 *
 * A server component so the country list comes from the database rather than a
 * mock, and so the form posts to a real endpoint: a submission that is accepted
 * but never stored would tell a scholarship coordinator their listing is in the
 * review queue when it is not.
 */

export const metadata: Metadata = {
  title: "Submit a Scholarship",
  description:
    "Submit a scholarship, grant or fellowship for review by the Global Scholarship Hub editorial team. Submissions are verified against official sources before publication.",
};

export default async function SubmitScholarshipPage() {
  const countries = await getPublicCountries();

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <Container size="md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            Community &amp; institutional submissions
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Submit a Scholarship Opportunity
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
            Are you a university representative, foundation, or scholarship coordinator? Send us the
            official details and our editorial team will verify them before anything is published.
          </p>
        </div>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <span className="font-bold">Nothing is published automatically.</span> Every submission
            enters a moderation queue and is checked against the official provider source before it
            appears on this site. A submitted listing is a claim, not an endorsement: we cannot
            confirm funding, eligibility or a deadline until we have read the provider&apos;s own
            page.
          </div>
        </div>

        <SubmitScholarshipForm
          countries={countries.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
        />

        <p className="mt-6 text-center text-xs text-gray-500">
          Already listed and out of date? Use the same form and pick{" "}
          <strong>Correction</strong> in the type selector, naming the listing you are correcting.
          Prefer to talk to a person?{" "}
          <Link href="/contact" className="font-medium text-primary-700 hover:underline">
            Contact the team
          </Link>
          .
        </p>
      </Container>
    </div>
  );
}
