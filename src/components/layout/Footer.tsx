"use client";

import React from "react";
import Link from "next/link";
import { Container, Grid } from "@/components/layout/Layout";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SITE_BRANDING_FALLBACK, type SiteBranding } from "@/lib/site-branding";

/**
 * One link group in the footer row. Every group renders the same way, so the
 * columns line up on their headings and their first link.
 */
function LinkGroup({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="text-sm text-gray-400 transition-colors hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ branding = SITE_BRANDING_FALLBACK }: { branding?: SiteBranding }) {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-300">
      <Container size="xl">
        {/* All six groups sit in a single row on wide screens. The brand takes
            two of the seven tracks so the wordmark and tagline keep their
            line breaks instead of being squeezed into one narrow column. */}
        <Grid cols={7} gap="lg" className="border-b border-gray-800 py-12 lg:py-14">
          <div className="xl:col-span-2">
            <SiteLogo tone="light" size={40} className="w-fit" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">{branding.tagline}</p>
          </div>

          <LinkGroup
            title="Explore"
            items={[
              { label: "Scholarships", href: "/scholarships" },
              { label: "Universities", href: "/universities" },
              { label: "Countries", href: "/countries" },
              { label: "Fields of Study", href: "/fields" },
              { label: "Fully Funded", href: "/fully-funded" },
            ]}
          />

          <LinkGroup
            title="Resources"
            items={[
              { label: "Scholarship Guides", href: "/resources" },
              { label: "Blog", href: "/blog" },
              { label: "FAQ", href: "/faq" },
              { label: "Scholarship Finder", href: "/finder" },
              { label: "Deadline Calendar", href: "/deadlines" },
            ]}
          />

          <LinkGroup
            title="For Organizations"
            items={[
              { label: "Submit a Scholarship", href: "/submit-scholarship" },
              { label: "Partner With Us", href: "/advertise#ways-to-work-with-us" },
              { label: "Advertising Policy", href: "/advertise#advertising-policy" },
            ]}
          />

          <LinkGroup
            title="Company"
            items={[
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Cookie Policy", href: "/cookies" },
            ]}
          />

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${branding.contactEmail}`}
                  className="break-all text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {branding.contactEmail}
                </a>
              </li>
              <li>
                <span className="text-sm text-gray-400">Global (Online)</span>
              </li>
            </ul>
          </div>
        </Grid>

        <div className="flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:items-center sm:text-left">
          <p className="text-sm text-gray-400">
            © 2026 Global Scholarship Hub. All rights reserved.
          </p>
          <span className="text-sm text-gray-400">Built for students, by education enthusiasts.</span>
          <p className="text-xs text-gray-500">
            Disclaimer: Global Scholarship Hub is an information platform. We do not guarantee eligibility or acceptance. Always verify requirements with official providers.
          </p>
        </div>
      </Container>
    </footer>
  );
}
