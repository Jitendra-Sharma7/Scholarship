import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { getPublicPosts, type PublicPost } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

export const metadata = pageMetadata({
  title: "Scholarship Blog - Guides on Finding and Winning Funding",
  description:
    "Practical guidance on finding scholarships, reading listings critically, understanding funding types, and organising a search you can sustain.",
  path: "/blog",
});

/**
 * Two-letter monogram for the byline.
 *
 * The posts have an author name but no avatar, and an empty circle looks like a
 * loading failure. A monogram is derived from the name, so it is always
 * something rather than a blank.
 */
function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "GS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function PostMeta({ post }: { post: PublicPost }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{post.readMinutes} min read</span>
    </div>
  );
}

/** A post in the grid below the lead. */
function PostCard({ post }: { post: PublicPost }) {
  return (
    // `relative` is required by the title's stretched link, which makes the
    // whole card one large tap target rather than a 20px strip of underlined
    // text that is hard to hit on a phone.
    <article className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {post.category && (
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
            {post.category}
          </span>
        )}
        <PostMeta post={post} />
      </div>

      <h3 className="text-base font-bold leading-snug text-gray-900 group-hover:text-primary-700">
        <Link href={`/blog/${post.slug}`} className="before:absolute before:inset-0">
          {post.title}
        </Link>
      </h3>

      {post.excerpt && (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
      )}

      <div className="mt-5 flex items-center gap-2.5 border-t border-gray-100 pt-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
          {initials(post.author ?? "Editorial team")}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-800">
            {post.author ?? "Editorial team"}
          </p>
          <p className="text-xs text-gray-500">{formatDate(post.published)}</p>
        </div>
      </div>
    </article>
  );
}

export default async function BlogIndexPage() {
  const posts = await getPublicPosts();

  // The newest post leads as a full-width feature, and the rest sit in one even
  // grid. The previous layout grouped posts under a heading per category, which
  // with a handful of posts produced a section holding a single card each and
  // read as broken rather than editorial. The grid grows properly as the blog
  // fills, and the category still appears on every card.
  const [lead, ...rest] = posts;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <JsonLd
        data={itemListSchema({
          name: "Scholarship blog articles",
          items: posts.map((p) => ({
            name: p.title,
            path: `/blog/${p.slug}`,
            description: p.excerpt,
          })),
        })}
      />
      <Container>
        <header className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            Resource Centre
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
            Blog
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            Practical guidance on scholarship search, application strategy, and interpreting
            funding. Reviewed regularly and written to be factual rather than promotional.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500">
            No posts have been published yet.
          </p>
        ) : (
          <div className="space-y-10">
            {/* Lead article */}
            <article className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-primary-50 via-white to-white p-7 shadow-xs transition-shadow hover:shadow-md sm:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white">
                  Latest
                </span>
                {lead.category && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
                    {lead.category}
                  </span>
                )}
                <PostMeta post={lead} />
              </div>

              <h2 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-gray-950 group-hover:text-primary-800 sm:text-3xl">
                <Link href={`/blog/${lead.slug}`} className="before:absolute before:inset-0">
                  {lead.title}
                </Link>
              </h2>

              {lead.excerpt && (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">
                  {lead.excerpt}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {initials(lead.author ?? "Editorial team")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {lead.author ?? "Editorial team"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(lead.published)} &middot; {lead.readMinutes} min read
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                  Read article
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </article>

            {/* Everything else */}
            {rest.length > 0 && (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  More articles
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-14 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
          <h2 className="text-xl font-bold text-gray-900">Looking for step-by-step guides?</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-600">
            The resource centre covers application writing, language tests, interviews, documents,
            and visa requirements in more depth.
          </p>
          <Link
            href="/resources"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Browse Guides
          </Link>
        </div>
      </Container>
    </div>
  );
}
