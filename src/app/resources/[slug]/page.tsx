import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, CalendarDays, Download, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { getPublicResourceBySlug, getPublicResources } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { articleSchema, breadcrumbSchema } from "@/lib/seo-jsonld";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-render one path per published resource.
 *
 * The database is read during `next build`. When it is unreachable this
 * returns no paths rather than failing the deployment; the pages then render on
 * demand, which is a slower first request but otherwise identical. See the
 * matching comment in `/blog/[slug]/page.tsx`.
 */
export async function generateStaticParams() {
  try {
    const resources = await getPublicResources();
    return resources.map((g) => ({ slug: g.slug }));
  } catch (error) {
    console.warn(
      "[build] /resources/[slug] could not read the database, so no guides were pre-rendered. " +
        "They will be rendered on demand at request time. Check DATABASE_URL.",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Like the blog posts, these guides had no canonical and inherited
 * `canonical: "/"` from the root layout.
 *
 * A guide that is a downloadable file rather than an article is still
 * indexable - the page explains what the file is and links to it - so it gets
 * the same treatment.
 */
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublicResourceBySlug(slug);
  if (!guide) {
    return { title: "Guide Not Found", robots: { index: false, follow: true } };
  }

  return pageMetadata({
    title: guide.title,
    description:
      guide.excerpt ??
      "A step-by-step scholarship application guide covering documents, statements of purpose, interviews, language tests and visa requirements.",
    path: `/resources/${guide.slug}`,
    type: "article",
    publishedTime: guide.updated,
    modifiedTime: guide.updated,
    section: guide.category ?? undefined,
    tags: guide.tags,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = await getPublicResourceBySlug(slug);

  if (!guide) notFound();

  const all = await getPublicResources();
  const others = all.filter((g) => g.slug !== slug).slice(0, 3);
  const download = guide.fileUrl ?? guide.url;

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <JsonLd
        data={articleSchema({
          kind: "Article",
          headline: guide.title,
          description: guide.excerpt,
          path: `/resources/${guide.slug}`,
          published: guide.updated,
          modified: guide.updated,
          section: guide.category,
          tags: guide.tags,
          image: guide.thumbnail,
        })}
      />
      <JsonLd
        data={breadcrumbSchema({
          trail: [
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: guide.title, path: `/resources/${guide.slug}` },
          ],
        })}
      />
      <Container size="md">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/resources" className="hover:text-primary-600">
            Resources
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{guide.title}</span>
        </nav>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-10">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {guide.category && (
                <span className="rounded-full bg-primary-50 px-2.5 py-1 font-semibold text-primary-700">
                  {guide.category}
                </span>
              )}
              {guide.sections.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {guide.readMinutes} min read
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Updated {formatDate(guide.updated)}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">{guide.title}</h1>
            {guide.excerpt && <p className="mt-3 text-base text-gray-600">{guide.excerpt}</p>}

            {download && guide.sections.length === 0 && (
              <a
                href={download}
                {...(guide.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                {guide.fileUrl ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                {guide.fileUrl ? "Download" : "Open resource"}
                {guide.url ? " (external)" : ""}
              </a>
            )}
          </header>

          <div className="mt-7 space-y-7">
            {guide.sections.map((section, index) => (
              <section key={`${section.heading}-${index}`}>
                {section.heading && (
                  <h2 className="text-lg font-bold text-gray-900">{section.heading}</h2>
                )}
                <div className="mt-2 space-y-3">
                  {section.body.map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-gray-700">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-10 rounded-xl border border-primary-100 bg-primary-50/60 p-5">
            <p className="text-sm leading-relaxed text-primary-900">
              This guide is general information, not professional advice. Requirements change
              frequently — always confirm current details with the official scholarship provider
              before applying.
            </p>
          </footer>
        </article>

        {/* Related */}
        {others.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-base font-bold text-gray-900">Related guides</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/resources/${o.slug}`}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-900 shadow-xs transition-all hover:border-primary-300 hover:shadow-md"
                >
                  {o.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link
          href="/resources"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all guides
        </Link>
      </Container>
    </div>
  );
}
