import Link from "next/link";
import { BookOpen, FileText, HelpCircle, ArrowRight, Clock, CalendarDays, Download } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { getPublicFaqs, getPublicResources } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

export const metadata = pageMetadata({
  title: "Scholarship Guides & Resources - Applications, Visas & Documents",
  description:
    "Step-by-step guides on finding scholarships, writing statements of purpose, recommendation letters, interviews, language tests, and student visa requirements.",
  path: "/resources",
});

export default async function ResourcesPage() {
  const [resources, faqs] = await Promise.all([getPublicResources(), getPublicFaqs()]);

  const articles = resources.filter((r) => r.sections.length > 0);
  const downloads = resources.filter((r) => r.sections.length === 0 && (r.url || r.fileUrl));
  const categories = new Set(articles.map((a) => a.category).filter((c): c is string => Boolean(c)));

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <JsonLd
        data={itemListSchema({
          name: "Scholarship guides and resources",
          items: resources.map((r) => ({
            name: r.title,
            path: `/resources/${r.slug}`,
            description: r.excerpt,
          })),
        })}
      />
      <Container>
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Student Knowledge Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Scholarship Application Resources
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Practical guides on finding funding, writing applications, and interpreting what a
            scholarship actually covers. Written to be factual rather than promotional.
          </p>
        </div>

        {/* Real counts, linked to real destinations */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="#guides"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Application Guides</h2>
            <p className="mt-1 text-xs text-gray-500">
              {articles.length} in-depth guide{articles.length === 1 ? "" : "s"} across {categories.size}{" "}
              topic{categories.size === 1 ? "" : "s"}
            </p>
          </a>

          <Link
            href="/faq"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="mt-1 text-xs text-gray-500">
              {faqs.length} answered question{faqs.length === 1 ? "" : "s"} on eligibility,
              verification, and privacy
            </p>
          </Link>

          <Link
            href="/blog"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Blog</h2>
            <p className="mt-1 text-xs text-gray-500">Shorter reads on search strategy and funding</p>
          </Link>
        </div>

        {/* Guides */}
        <section id="guides" className="scroll-mt-24">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Guides &amp; Articles</h2>
          {articles.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
              No guides have been published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {articles.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/resources/${guide.slug}`}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-primary-300 hover:shadow-md"
                >
                  <div className="min-w-0">
                    {guide.category && (
                      <span className="text-xs font-semibold text-primary-600">{guide.category}</span>
                    )}
                    <h3 className="mt-1 text-sm font-bold text-gray-900 group-hover:text-primary-700">
                      {guide.title}
                    </h3>
                    {guide.excerpt && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-600">
                        {guide.excerpt}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {guide.readMinutes} min read
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Updated {formatDate(guide.updated)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-primary-600" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Downloadable resources, when an editor has published any */}
        {downloads.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Downloads &amp; External Tools</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {downloads.map((item) => {
                const href = item.fileUrl ?? item.url;
                if (!href) return null;
                const external = Boolean(item.url);
                return (
                  <a
                    key={item.slug}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-600">
                          {item.excerpt}
                        </p>
                      )}
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600">
                        <Download className="h-3 w-3" />
                        {item.fileUrl ? "Download" : "Open"}
                        {external ? " (external)" : ""}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}

