import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Layout";
import { CookieManageButton } from "@/components/consent/CookieManageButton";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How Global Scholarship Hub uses cookies and similar technologies, the categories we use, and how to change or withdraw your consent at any time.",
};

export default function CookiePolicyPage() {
  const lastUpdated = "September 26, 2026";

  const categories = [
    {
      name: "Strictly necessary",
      required: true,
      purpose:
        "Required for the website to provide the functionality you have requested. These cannot be switched off and do not require your consent.",
      examples: [
        "Session and sign-in state",
        "Your privacy and cookie choice",
        "Security and load balancing",
      ],
    },
    {
      name: "Functional",
      required: false,
      purpose:
        "Remember choices you make so we can tailor the experience, such as your saved scholarships, application tracker, and language and filter preferences. These do not build a profile of you for advertising.",
      examples: ["Saved scholarships and application tracker", "Search filter and language preferences"],
    },
    {
      name: "Analytics",
      required: false,
      purpose:
        "Help us understand how the platform is used so we can improve it, for example which countries and fields students search most. If you set this to off, we collect no measurement events at all.",
      examples: ["Page and search-event measurement in aggregate", "Approximate visit and referral counts"],
    },
    {
      name: "Marketing and advertising",
      required: false,
      purpose:
        "Used to make advertising more relevant and to measure whether it performs, and to attribute referrals to partner organizations. Sponsored listings are labelled separately and never affect organic search ordering.",
      examples: ["Ad relevance and frequency capping", "Partner and campaign referral measurement"],
    },
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <Container size="md">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">Cookie Policy</h1>
          <p className="mt-3 text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              This Cookie Policy explains what cookies and similar technologies are, how Global
              Scholarship Hub uses them, and how you can control them. It should be read alongside
              our{" "}
              <Link href="/privacy" className="font-medium text-primary-600 underline hover:text-primary-700">
                Privacy Policy
              </Link>
              , which sets out more generally how we handle personal data.
            </p>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              A cookie is a small text file placed on your device when you visit a website. Similar
              technologies — such as local storage and session storage — serve the same purpose of
              remembering information between visits, and we treat them the same way in this Policy.
            </p>
          </section>

          {/* Similar technologies note */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What We Store on Your Device</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              The Platform currently stores session and preference data in your browser&apos;s local
              storage rather than setting tracking cookies. Because this behaves like a cookie — it
              persists on your device and is readable by this site — it is covered by the same
              categories and consent rules described below.
            </p>
          </section>

          {/* Categories */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Categories We Use</h2>
            <div className="space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                    {cat.required ? (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                        Always on
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600">{cat.purpose}</p>
                  <ul className="mt-2 space-y-0.5">
                    {cat.examples.map((ex) => (
                      <li
                        key={ex}
                        className="text-[11px] text-gray-500 before:mr-1.5 before:text-gray-400 before:content-['•']"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Managing consent */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How to Control Your Consent</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              You are never asked to consent through a wall of text or a pre-ticked box. When you
              first visit, we ask you to choose whether to accept all technologies, keep only what is
              strictly necessary, or select categories individually. Non-essential technologies stay
              switched off until you actively opt in.
            </p>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              Withdrawing consent is as easy as granting it. This page is the permanent way back: use
              the control below to revisit and change your choice at any time, and your selection
              replaces the one recorded earlier. Note that strictly necessary technologies cannot be
              switched off, because the site cannot function without them.
            </p>
            <div className="mt-5">
              <CookieManageButton />
            </div>
          </section>

          {/* Third parties */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Third-Party Technologies</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We may use third-party providers for advertising and measurement where you have
              consented to the relevant category. Where we do, those providers may set their own
              technologies on your device, and their use of them is governed by their own privacy and
              cookie policies rather than this one. We do not control how third parties handle data
              once it has been shared with them.
            </p>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              Sponsored scholarship listings are labelled clearly and are shown separately from
              organic results. Paying for placement never influences the ranking or ordering of
              organic search results.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              If you have any questions about this Cookie Policy or how we use cookies and similar
              technologies, feel free to contact us. The Global Scholarship Hub team will respond
              within 24&ndash;48 hours.
            </p>
            <a
              href="mailto:privacy@globalscholarshiphub.com"
              className="mt-4 inline-flex items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              privacy@globalscholarshiphub.com
            </a>
          </section>
        </div>
      </Container>
    </div>
  );
}
