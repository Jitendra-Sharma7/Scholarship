import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getSiteBranding } from "@/lib/site-branding-server";
import JsonLd from "@/components/seo/JsonLd";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";
import { organizationSchema, webSiteSchema } from "@/lib/seo-jsonld";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

/**
 * Absolute origin for canonical URLs and OpenGraph/Twitter image resolution.
 * Without it Next.js falls back to http://localhost:3000, which makes social
 * cards resolve to the wrong host in production.
 *
 * Note there is deliberately no `alternates.canonical` here. A canonical on the
 * root layout is inherited by every route that does not override it, so it
 * silently pointed /scholarships, /countries, /fields, /deadlines, /finder,
 * /about, /contact and /compare at "/" - telling crawlers they were duplicates
 * of the homepage. Each page now sets its own canonical via `pageMetadata()`.
 */
const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Global Scholarship Hub | Global Scholarship Discovery Platform",
    template: "%s | Global Scholarship Hub",
  },
  description:
    "Discover, filter, compare, save, and apply for scholarships, grants, fellowships, and financial-aid opportunities from around the world. Find the funding for your future.",
  applicationName: SITE_NAME,
  keywords: [
    "scholarships",
    "grants",
    "fellowships",
    "financial aid",
    "tuition waivers",
    "study abroad",
    "international students",
    "fully funded scholarships",
    "master's scholarships",
    "PhD scholarships",
    "undergraduate scholarships",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/diploma_hat.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/diploma_hat.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_NAME,
    title: "Global Scholarship Hub | Global Scholarship Discovery Platform",
    description:
      "Discover, filter, compare, save, and apply for scholarships from around the world.",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Scholarship Hub | Global Scholarship Discovery Platform",
    description:
      "Discover, filter, compare, save, and apply for scholarships from around the world.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read here rather than hardcoding: the contact details in the footer are a
  // support address that changes, and a stale one is worse than none.
  const branding = await getSiteBranding();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${merriweather.variable}`}
    >
      <body className="font-sans antialiased bg-white text-gray-900">
        {/* Site identity, emitted once for the whole site. The WebSite entity
            gives the search box a sitelink; the Organization entity is what
            other pages reference as their `publisher`. */}
        <JsonLd data={webSiteSchema()} />
        <JsonLd
          data={organizationSchema({
            contactEmail: branding.contactEmail,
            tagline: branding.tagline,
          })}
        />
        <Providers>
          <SiteChrome branding={branding}>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}