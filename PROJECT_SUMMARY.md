# Global Scholarship Hub

A scholarship discovery platform: students browse, filter, compare, and track
scholarships; staff manage every listing through an admin panel backed by
PostgreSQL.

The product rule that shapes every decision here: **never present a fact the
data does not support.** Funding amounts, deadlines, eligibility, and
verification status all come from stored records. Anything a provider has not
stated is shown as "Not stated", not as a confident "No".

## Stack

| | |
|---|---|
| Framework | Next.js 16.3.5 (App Router, React Server Components) |
| UI | React 19.2.8, TypeScript, Tailwind CSS 3.4.17, lucide-react |
| Data | PostgreSQL 17, Prisma 6.19.3 |
| State | Zustand (saved scholarships, comparison, tracker, profile) |
| Validation | Zod, on the server, for every write path |
| Auth | bcrypt password hashing, HMAC-SHA256 session tokens, HTTP-only cookies |

## Getting started

```bash
npm install
npx prisma db push --skip-generate   # schema -> database
npx prisma generate
npm run db:seed                      # idempotent; safe to re-run
npm run dev
```

The seed creates the super admin printed at the end of its output. Credentials
for an existing installation live in `.env`.

```bash
npm run typecheck    # tsc --noEmit
npm run lint
npm run build
npm run start
```

## Layout

```
prisma/
  schema.prisma          all models: identity, content, editorial, activity
  seed.ts                idempotent seeding
  seed-data/             the seed's own datasets - never imported by the app
src/
  app/
    (public routes)       /, /scholarships, /finder, /countries, /fields,
                          /universities, /resources, /blog, /faq, /deadlines,
                          /compare, /tracker, /dashboard, legal pages
    admin/                staff panel; the public header and footer are
                          suppressed here (src/components/layout/SiteChrome.tsx)
    api/public/           read-only endpoints used by client components
    actions/              server actions for every write path
  components/
    layout/               Header, Footer, SiteChrome
    public/               DB-backed directory browsers
    admin/                admin shell, entity table, entity form
    consent/              first-visit cookie consent
  lib/
    data/public.ts        the only public read path; every query filters on
                          publishStatus = PUBLISHED and deletedAt IS NULL
    data/store.ts         server/client facade over the above
    admin-registry.ts     drives every registry-driven admin section
    auth.ts               sessions, roles, audit logging, rate limiting
```

## Data visibility rules

- A scholarship is public only when `publishStatus = PUBLISHED` and
  `deletedAt IS NULL`.
- Publish state and deadline state are separate. A listing past its deadline
  derives to `Expired` unless `deadlineStatusOverride` holds it open.
- `deadAt` is never accepted from a form; soft deletion goes through the
  role-checked trash action.
- Countries, universities, and fields have no public detail page, so they have
  no slug redirects either.
- Public pages read the database. There is no mock data in the runtime path:
  the seed datasets under `prisma/seed-data/` are imported by the seed only.
- The browser never calls `/api/*`. A client component gets its data from a
  server parent, or - when the data is not knowable at request time, such as the
  comparison list or a freshly requested match - from a server action in
  `app/actions/`. The JSON routes remain for external consumers and the
  verification scripts, and `src/proxy.ts` keeps them away from ordinary
  visitors: `/api/public/*` answers 404 unless the caller is on the machine the
  app runs on or presents `PUBLIC_API_KEY` as `x-api-key` (or a bearer token).
  Allowed responses carry `X-Robots-Tag: noindex` and `Cache-Control: private,
  no-store`. `/api/auth/*` is outside the matcher, because the OAuth start and
  callback routes have to stay reachable by redirect.
- Client components may import *types* from a server module but never a value.
  A value import drags the module - and Prisma - into the browser bundle, which
  `verify:bundle` catches.
- `/robots.txt` and `/sitemap.xml` are generated from the same published rows the
  public pages read. The sitemap lists the static pages plus every published
  scholarship, blog post and resource, never a draft, a deleted record, or a
  route robots.txt disallows, and `verify:links` fails if an advertised URL does
  not answer or a published record is absent from it.

## Verification

Nine scripts: eight drive the running server over real HTTP, and one reads the
build output.

```bash
npm run verify            # bundle check, then all eight HTTP suites, in order
npm run verify:bundle     # no server-only code or secret value in the browser bundle
npm run verify:auth       # session boundary, roles, logout
npm run verify:content    # registry CRUD, publishing, submissions,
                          # settings, public visibility
npm run verify:crud       # scholarship create/edit/publish/trash
npm run verify:public     # admin edits reach the public pages, and no
                          # secret value is in the served HTML
npm run verify:forms      # every form refuses bad input and says why
npm run verify:links      # internal links, admin links, sitemap coverage
npm run verify:speed      # page weight budgets and response times
npm run verify:mobile     # sideways scroll, mobile nav, touch targets
npm run verify:oauth      # provider wiring, config gating, CSRF state
```

They need `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the environment and a server on
`http://localhost:3000`. `verify:bundle` reads `.next/static/chunks` and needs
`npm run build` first.

Secrets are checked from both sides. `verify:bundle` searches every client chunk
- nested ones included, which the previous flat read never did - for the actual
values of every secret-named variable in `.env`, and fails on any `NEXT_PUBLIC_*`
variable whose name says it holds a credential, because Next.js inlines those
into the browser by design. `verify:public` runs the same comparison against the
server-rendered HTML of the public routes, so a value serialised into a page
fails too. Neither check prints a value; both report the key and the file. A
name-pattern scan could never do this: a literal `"s3cr3t"` in a client component
leaves no name to match. The only `NEXT_PUBLIC_*` variable in the project is
`NEXT_PUBLIC_SITE_URL`, and it holds an origin.

`verify:speed` measures the compressed bytes of the document and every asset a
page references, plus the response time, against per-route budgets. It exists
because two of the largest costs on this site were invisible: `SubmitScholarshipForm`
imported a label map out of a module that also built a zod schema, which put 61 KB
of validation library in the browser to render one `<select>`; and four public
pages passed all 197 country records to client components that render four fields
out of twenty, which put roughly 78 KB of unrendered editorial copy into the RSC
payload of the homepage alone. The label maps and setting definitions now live in
schema-free modules for exactly that reason, and the check fails if a field no
client component renders reappears in a page's payload. Pages now transfer
210-235 KB, of which about 200 KB is the React and Next.js runtime every page
shares; the country flags in `public/flags` are the largest remaining per-page
cost at 25-30 KB, and they are not cheaply reducible - the heaviest is a genuine
178 KB coat of arms, and a whitespace-and-precision pass only recovered 1%.

`verify:links` exists because three dead links reached production here, and none
of them looked broken in a screenshot. It crawls the public site, requests every
route, query link and authenticated admin page, checks each external link, and
reads `/sitemap.xml`: an entry may not be a route `robots.txt` disallows, every
entry has to answer 200, and every published scholarship, blog post and resource
has to be in it. Third-party hosts that answer a scripted request with 403 or
time out are reported separately, not counted as broken - bot protection is not
evidence that a link is wrong.

`verify:mobile` covers what a desktop screenshot cannot show, and every check in
it corresponds to something that was actually wrong here: the header's brand
lockup plus auth buttons plus menu toggle overflowed a 320-390px screen, the
open mobile menu let the page scroll underneath it and did not say whether it
was open, the browse filter toggle was a 30px target guarding the whole
filtering experience, and country and field names were truncated to
unreadability in two-column phone grids. Its checks are deliberately few and
specific. A blanket "no multi-column grid" rule would fire on the stat tiles,
which are correctly two abreast on a phone, so a noisier rule would have been
ignored instead of maintained.

`verify:forms` exists because the public sign-in and registration pages once
accepted any email and any password, waited 800ms in the browser, and reported
success without a server being involved. Nothing about that looked broken in a
screenshot. Each check now asserts that the server refuses bad input *and* names
the offending field, which is the part a bare "it returned an error" check would
have missed. The public forms call their actions from a transition, so they have
no `<form action>` to replay; their rules are the ones in `signIn` and `signUp`,
and `verify:forms` exercises those through the form-based admin login, which
delegates to the same functions.

Because they drive the real admin UI, a run creates real rows. `npm run
clean:test-records` removes everything the suites created, including the
matching activity log entries, so a verification pass does not inflate the
public counts. It reports what it found unless `--apply` is passed.

## Schema changes

This environment's database role cannot create a shadow database, so
`prisma migrate dev` fails with `P3014`. Use:

```bash
npx prisma db push --skip-generate --accept-data-loss
npx prisma generate
```

Stop the running server before `prisma generate` on Windows; the query engine
DLL stays locked while it is running.
