import { SITE_NAME, SITE_URL, absoluteUrl } from "./seo";

/**
 * schema.org JSON-LD builders.
 *
 * The site previously shipped no structured data at all, which left every rich
 * result on the table: no sitelinks, no article cards, no breadcrumb trail in
 * the SERP, no FAQ answers.
 *
 * Two rules govern everything here:
 *
 * 1. Nothing is invented. Every value comes from a database record or from a
 *    string already on the page. No review counts, no star ratings, no
 *    "trusted by N students" figures. Fabricated structured data is what earns
 *    manual actions, and this project's entire reason for existing is that the
 *    numbers on it are real.
 * 2. URLs are absolute. Relative ids in JSON-LD resolve against the wrong
 *    origin in syndicated contexts.
 */

type Json = Record<string, unknown>;

export interface Crumb {
  name: string;
  /** Site-relative path; the final entry is usually the current page. */
  path: string;
}

/** Site identity + the on-site search box. */
export function webSiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description:
      "Search scholarships, grants and fellowships from around the world, filter by country, field and degree level, and track application deadlines.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    // The listing page reads `?query=`, not the more common `?q=`. A
    // SearchAction pointing at the wrong parameter silently returns unfiltered
    // results, so it has to match what the page actually reads.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/scholarships?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface OrganizationInput {
  /** The support address shown in the footer, read from site settings. */
  contactEmail: string;
  tagline: string;
}

/**
 * Site-level publisher identity.
 *
 * `sameAs` is intentionally empty. The site has no verified social profiles to
 * point at, and inventing handles would produce entities that resolve to
 * nothing - or to somebody else's account.
 */
export function organizationSchema({ contactEmail, tagline }: OrganizationInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/og-image.png"),
      width: 1200,
      height: 630,
    },
    description: tagline,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: contactEmail,
      availableLanguage: ["English"],
    },
  };
}

export interface ListItem {
  name: string;
  /** Site-relative path. */
  path: string;
  description?: string | null;
}

export interface ItemListInput {
  name: string;
  items: ListItem[];
  /** Set for a filtered subset, e.g. "Scholarships in Germany". */
  scopedName?: string;
}

/**
 * An ordered list of the entities a directory page actually renders.
 *
 * `position` is 1-based and matches the on-page order, so the list describes
 * what a visitor sees when the SERP previews it.
 */
export function itemListSchema({ name, items, scopedName }: ItemListInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#list`,
    name: scopedName ?? name,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
      url: absoluteUrl(item.path),
    })),
  };
}

export interface BreadcrumbInput {
  trail: Crumb[];
}

/**
 * Breadcrumb trail. Google replaced the old breadcrumb rich result with this in
 * 2024, and it is what puts "Home > Scholarships > ..." under the result.
 */
export function breadcrumbSchema({ trail }: BreadcrumbInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export interface ArticleInput {
  kind: "Article" | "BlogPosting";
  headline: string;
  description?: string | null;
  path: string;
  published: string;
  modified?: string | null;
  author?: string | null;
  section?: string | null;
  tags?: string[];
  image?: string | null;
  wordCount?: number;
}

export function articleSchema(input: ArticleInput): Json {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": input.kind,
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    url,
    datePublished: input.published,
    dateModified: input.modified ?? input.published,
    ...(input.author ? { author: { "@type": "Person", name: input.author } } : {}),
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(input.image ? { image: [absoluteUrl(input.image)] } : {}),
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.tags?.length ? { keywords: input.tags.join(", ") } : {}),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    inLanguage: "en",
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqInput {
  faqs: FaqItem[];
  path: string;
}

/**
 * FAQPage markup, built from the same rows the `<details>` elements render.
 *
 * Worth knowing: since August 2023 Google only shows FAQ rich results for
 * authoritative government and health sites, so this will not produce an
 * expanded SERP block here. It is still emitted because the markup is
 * factually correct and matches the visible content, which helps other
 * consumers - and a mismatched FAQPage block would be a spam signal.
 */
export function faqPageSchema({ faqs, path }: FaqInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export interface ScholarshipInput {
  name: string;
  description?: string | null;
  path: string;
  /** ISO date from the record, or null when the listing has no date. */
  deadline?: string | null;
  degreeLevels?: string[];
  /** University or provider name, when the record names one. */
  provider?: string | null;
  country?: string | null;
}

/**
 * A single scholarship listing.
 *
 * `EducationalOccupationalProgram` is the type Google documents for
 * scholarship and financial-aid pages. Only fields backed by a real column are
 * emitted - no `offers`, no `aggregateRating`, no invented accreditation.
 */
export function scholarshipSchema(input: ScholarshipInput): Json {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "@id": `${url}#scholarship`,
    name: input.name,
    url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.deadline ? { applicationDeadline: input.deadline } : {}),
    ...(input.degreeLevels?.length ? { programType: input.degreeLevels.join(", ") } : {}),
    ...(input.provider ? { provider: { "@type": "Organization", name: input.provider } } : {}),
    ...(input.country ? { areaServed: { "@type": "Country", name: input.country } } : {}),
  };
}
