"use client";

import React from "react";
import Link from "next/link";
import { Container, Grid } from "@/components/layout/Layout";
import { SITE_BRANDING_FALLBACK, type SiteBranding } from "@/lib/site-branding";
import { Facebook, Youtube, Linkedin, X, Instagram, GraduationCap, ShieldCheck } from "lucide-react";

function LinkGroup({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="text-sm text-secondary-400 transition-colors hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ branding = SITE_BRANDING_FALLBACK }: { branding?: SiteBranding }) {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: "Facebook", href: "https://facebook.com/globalscholarshiphub", icon: Facebook },
    { name: "YouTube", href: "https://youtube.com/@globalscholarshiphub", icon: Youtube },
    { name: "LinkedIn", href: "https://linkedin.com/company/globalscholarshiphub", icon: Linkedin },
    { name: "X", href: "https://twitter.com/globalscholarhub", icon: X },
    { name: "Instagram", href: "https://instagram.com/globalscholarshiphub", icon: Instagram },
  ];

  return (
    <footer className="bg-primary-900 text-white">
      <Container size="xl">
        <Grid cols={5} gap="lg" className="border-b border-primary-800 py-12 lg:py-14">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Global Scholarship Hub</span>
            </div>
            <p className="text-sm leading-relaxed text-secondary-400 mb-6 max-w-xs">
              {branding.tagline || "Dream. Apply. Achieve."}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <LinkGroup
            title="Quick Links"
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
              { label: "Scholarship Guide", href: "/guides" },
              { label: "Study in UK", href: "/countries/gb" },
              { label: "Visa Guidance", href: "/resources/visa" },
              { label: "FAQs", href: "/faq" },
              { label: "Blog", href: "/blog" },
            ]}
          />

          <LinkGroup
            title="About Us"
            items={[
              { label: "Our Mission", href: "/about" },
              { label: "About Us", href: "/about" },
              { label: "Contact Us", href: "/contact" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms and Conditions", href: "/terms" },
            ]}
          />

          <LinkGroup
            title="Follow Us"
            items={[
              { label: "Facebook", href: "https://facebook.com/globalscholarshiphub" },
              { label: "YouTube", href: "https://youtube.com/@globalscholarshiphub" },
              { label: "LinkedIn", href: "https://linkedin.com/company/globalscholarshiphub" },
              { label: "X", href: "https://twitter.com/globalscholarhub" },
              { label: "Instagram", href: "https://instagram.com/globalscholarshiphub" },
            ]}
          />
        </Grid>

        <div className="flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:items-center sm:text-left">
          <p className="text-sm text-secondary-400">
            © {currentYear} Global Scholarship Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-secondary-400">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success-500" />
              Verified Information
            </span>
          </div>
          <p className="text-xs text-secondary-500">
            Disclaimer: Global Scholarship Hub is an information platform. We do not guarantee eligibility or acceptance. Always verify requirements with official providers.
          </p>
        </div>
      </Container>
    </footer>
  );
}