import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { getPublicScholarshipById } from "@/lib/data/public";
import { getSettingNumber } from "@/lib/settings";
import { resolveRedirect } from "@/lib/slug";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, scholarshipSchema } from "@/lib/seo-jsonld";
import ScholarshipDetailsClient from "./ScholarshipDetailsClient";

interface ScholarshipPageProps {
  params: Promise<{ id: string }>;
}

/** Guards the editor-supplied canonical: only absolute http(s) URLs are used. */
function isAbsoluteHttpUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Scholarship detail.
 *
 * The record is resolved on the server and handed to the client component as
 * initial data. That means:
 *   - the page is indexed with real content instead of a loading spinner,
 *   - an unknown, draft or trashed id produces a true HTTP 404 rather than a
 *     soft 404 that search engines treat as a valid page.
 *
 * Only published, non-deleted rows resolve, so unpublished content cannot be
 * reached by guessing a URL.
 */
export async function generateMetadata({ params }: ScholarshipPageProps): Promise<Metadata> {
  const { id } = await params;
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);
  const scholarship = await getPublicScholarshipById(id, closingSoonDays);

  if (!scholarship) {
    return { title: "Scholarship not found", robots: { index: false, follow: true } };
  }

  const description =
    scholarship.shortDescription ??
    scholarship.description ??
    `Details, funding and application deadline for ${scholarship.title}.`;

  // The slug is the one address this record is published under: it is what
  // sitemap.ts lists, so a canonical pointing anywhere else would tell a crawler
  // to prefer a URL the sitemap never offers. See the redirect in the component
  // below, which sends the cuid form here permanently.
  const url = `/scholarships/${scholarship.slug}`;

  // An editor-supplied canonical is honoured, but only when it is an absolute
  // http(s) URL. A relative or malformed value would otherwise emit a canonical
  // pointing nowhere and de-index the page.
  const canonical = isAbsoluteHttpUrl(scholarship.canonicalUrl)
    ? (scholarship.canonicalUrl as string)
    : url;

  return pageMetadata({
    title: scholarship.seoTitle ?? scholarship.title,
    description,
    path: canonical,
    // `noindex` is a real CMS field that nothing read, so a record an editor
    // explicitly retired was still being indexed.
    noindex: scholarship.noindex,
    ...(scholarship.coverImage
      ? { image: { url: scholarship.coverImage, alt: scholarship.title } }
      : {}),
  });
}

export default async function ScholarshipDetailsPage({ params }: ScholarshipPageProps) {
  const { id } = await params;
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);

  const scholarship = await getPublicScholarshipById(id, closingSoonDays);

  if (!scholarship) {
    // The id may be a URL we have retired: an admin changing a published
    // scholarship's slug records a permanent redirect so inbound links survive.
    // Resolving it here keeps those links working instead of returning a 404.
    const target = await resolveRedirect(`/scholarships/${id}`);
    if (target) permanentRedirect(target);
    notFound();
  }

  // A scholarship is reachable by its cuid and by its slug because the lookup
  // accepts either. The slug is the published address, so the other form is sent
  // there permanently rather than left to compete as a duplicate: without this,
  // a cuid URL already shared or indexed would be a second copy of the same page.
  if (id !== scholarship.slug) {
    permanentRedirect(`/scholarships/${scholarship.slug}`);
  }

  const detailPath = `/scholarships/${scholarship.slug}`;

  return (
    <>
      <JsonLd
        data={scholarshipSchema({
          name: scholarship.title,
          description: scholarship.shortDescription ?? scholarship.description,
          path: detailPath,
          deadline: scholarship.deadline || null,
          degreeLevels: scholarship.degreeLevels,
          provider: scholarship.universityName ?? scholarship.providerName,
          country: scholarship.countryName,
        })}
      />
      <JsonLd
        data={breadcrumbSchema({
          trail: [
            { name: "Home", path: "/" },
            { name: "Scholarships", path: "/scholarships" },
            { name: scholarship.title, path: detailPath },
          ],
        })}
      />
      <ScholarshipDetailsClient initialScholarship={scholarship} />
    </>
  );
}
