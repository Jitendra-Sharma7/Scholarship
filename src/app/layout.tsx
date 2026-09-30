import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Inter, Merriweather } from "next/font/google";

import { Providers } from "./providers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { AdSenseScript } from "@/components/ads/AdSenseScript";

import { getSiteBranding } from "@/lib/site-branding-server";

import JsonLd from "@/components/seo/JsonLd";

import {
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

import {
  organizationSchema,
  webSiteSchema,
} from "@/lib/seo-jsonld";

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
 * Global SEO metadata.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      "Global Scholarship Hub | Fully Funded Scholarships Worldwide",

    template:
      "%s | Global Scholarship Hub",
  },

  description:
    "Find fully funded scholarships, grants, fellowships and financial aid for international students. Search scholarships by country, university, field and degree level.",

  applicationName: SITE_NAME,

  authors: [
    {
      name: SITE_NAME,
    },
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  category: "education",

  keywords: [
    "scholarships",
    "fully funded scholarships",
    "scholarships for international students",
    "international scholarships",
    "study abroad scholarships",
    "masters scholarships",
    "PhD scholarships",
    "undergraduate scholarships",
    "scholarships for students",
    "scholarships worldwide",
    "grants",
    "fellowships",
    "financial aid",
    "tuition scholarships",
    "university scholarships",
    "government scholarships",
    "scholarship opportunities",
    "study abroad funding",
  ],

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/diploma_hat.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],

    apple: [
      {
        url: "/diploma_hat.png",
        sizes: "180x180",
      },
    ],
  },

  manifest: "/manifest.webmanifest",

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

  openGraph: {
    type: "website",

    locale: "en_US",

    url: SITE_URL,

    siteName: SITE_NAME,

    title:
      "Global Scholarship Hub | Fully Funded Scholarships Worldwide",

    description:
      "Find fully funded scholarships, grants, fellowships and financial aid for international students.",

    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Global Scholarship Hub | Fully Funded Scholarships Worldwide",

    description:
      "Find fully funded scholarships, grants and fellowships for international students.",

    images: [OG_IMAGE.url],
  },

  other: {
    "google-adsense-account":
      "ca-pub-6190025929296653",
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
  const branding = await getSiteBranding();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${merriweather.variable}`}
    >
      <body className="font-sans antialiased bg-white text-gray-900">

        {/* Website structured data */}
        <JsonLd
          data={webSiteSchema()}
        />

        {/* Organization structured data */}
        <JsonLd
          data={organizationSchema({
            contactEmail: branding.contactEmail,
            tagline: branding.tagline,
          })}
        />

        <Providers>

          <AdSenseScript />

          <SiteChrome branding={branding}>
            {children}
          </SiteChrome>

        </Providers>

      </body>
    </html>
  );
}
