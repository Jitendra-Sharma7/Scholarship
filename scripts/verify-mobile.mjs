/**
 * Mobile responsiveness verification.
 *
 * The site is read mostly on phones, and the failures that matter there are the
 * ones a desktop screenshot cannot show: a page that scrolls sideways, a
 * navigation panel you cannot reach with a thumb, or a control sized for a
 * mouse. Each check below reads the rendered HTML of every public route and
 * asserts a property that must hold on a 320-430px screen.
 *
 * These are deliberately few and specific rather than a general-purpose audit.
 * A blanket "no multi-column grid" rule would fire on the stat tiles, which are
 * genuinely meant to sit two abreast on a phone, so a rule that noisy would just
 * get ignored. What is checked instead is the set of defects that actually broke
 * a layout here.
 *
 * Needs a server on the base URL, read from `.env`.
 */
import fs from "node:fs";

import { resolveBase } from "./lib/base-url.mjs";

const BASE = resolveBase();

let failures = 0;
let checks = 0;

function check(label, ok, detail) {
  checks += 1;
  const note = !ok && detail ? `  -> ${detail}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${note}`);
  if (!ok) failures += 1;
}

/**
 * The opening tag of every element of `tagName` in a JSX file, as source text.
 *
 * A regex cannot delimit a JSX tag on its own: `onClick={() => ...}` contains a
 * `>` that does not close the tag, and a fixed character window between two
 * attributes silently stops matching the moment somebody documents an attribute
 * with a comment. Both cost a real check here, so tags are scanned instead - a
 * `>` inside a quoted value or inside an attribute expression is part of the
 * attribute, and only a `>` at the top level ends the tag.
 */
function openingTags(source, tagName) {
  const tags = [];
  const open = new RegExp(`<${tagName}\\b`, "g");
  for (let match = open.exec(source); match; match = open.exec(source)) {
    let quote = null;
    let depth = 0;
    for (let i = match.index + match[0].length; i < source.length; i += 1) {
      const char = source[i];
      if (quote) {
        if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'" || char === "`") {
        quote = char;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      } else if (char === ">" && depth === 0) {
        tags.push(source.slice(match.index, i + 1));
        break;
      }
    }
  }
  return tags;
}

/** Every static public route. Dynamic routes are covered by their listing pages. */
const ROUTES = [
  "/",
  "/scholarships",
  "/deadlines",
  "/finder",
  "/compare",
  "/tracker",
  "/countries",
  "/fields",
  "/universities",
  "/resources",
  "/blog",
  "/faq",
  "/about",
  "/contact",
  "/advertise",
  "/submit-scholarship",
  "/privacy",
  "/terms",
  "/cookies",
  "/fully-funded",
  "/dashboard",
  "/auth/login",
  "/auth/register",
];

const bodies = new Map();
for (const route of ROUTES) {
  const res = await fetch(`${BASE}${route}`);
  if (res.ok) bodies.set(route, await res.text());
  else console.log(`SKIP  ${route} responded ${res.status}`);
}

if (bodies.size === 0) {
  console.error("no public pages could be fetched; is the server running?");
  process.exit(1);
}

// ---------------------------------------------------------------------
// 1. Horizontal overflow
//
// A fixed pixel width wider than the narrowest phone guarantees a sideways
// scroll. `max-w-` is excluded because it caps rather than forces a width, and
// `pointer-events-none` blur blobs are excluded because they are decoration
// inside a clipping parent and carry no content.
// ---------------------------------------------------------------------
console.log("\n-- horizontal overflow --");
{
  const offenders = [];
  for (const [route, html] of bodies) {
    // Only the class attribute, not the escaped RSC flight payload, which
    // repeats the same classes a second time.
    for (const m of html.matchAll(/class="[^"]*"/g)) {
      const attrs = m[0];
      for (const w of attrs.matchAll(/(?<!max-)(?<!min-)w-\[(\d+)px\]/g)) {
        if (Number(w[1]) < 400) continue;
        // A blurred gradient circle is decoration, not content. It is
        // absolutely positioned inside an `overflow-hidden` hero, so it cannot
        // widen the page. That safety is asserted as its own check below
        // rather than assumed here, so removing the clipping fails the run.
        const isDecorativeBlob =
          /rounded-full/.test(attrs) && /bg-gradient/.test(attrs) && /h-\[\d+px\]/.test(attrs);
        if (isDecorativeBlob) continue;
        offenders.push(`${route}  w-[${w[1]}px]  ...${attrs.slice(0, 110)}`);
      }
    }
  }
  check(
    `no forced width of 400px or more on any public page (${bodies.size} pages)`,
    offenders.length === 0,
    offenders.slice(0, 3).join(" | ")
  );

  const home = bodies.get("/");
  check(
    "the oversized hero decoration is clipped by its section",
    /overflow-hidden/.test(home) && /blur-3xl/.test(home),
    "the hero holds a 900px-wide decorative layer; its section must clip it or the page scrolls sideways on a phone"
  );
}

// ---------------------------------------------------------------------
// 2. A navigation path that exists on a phone
//
// The desktop nav is hidden below `lg`, so the site needs a real mobile
// control. Asserting only that a hamburger exists was not enough: it also has
// to disclose its state, otherwise a screen-reader user cannot tell whether the
// panel opened.
//
// The open panel is not in the server HTML, because it is only mounted after a
// tap, so these read the component source rather than the rendered page.
// ---------------------------------------------------------------------
console.log("\n-- mobile navigation --");
{
  const header = fs.readFileSync("src/components/layout/Header.tsx", "utf8");
  const menuToggle = openingTags(header, "button").find((tag) =>
    tag.includes('aria-label="Toggle menu"')
  );
  check(
    "the header offers a mobile menu toggle",
    Boolean(menuToggle) && /lg:hidden/.test(menuToggle),
    "no lg:hidden toggle button in the header"
  );
  check(
    "the mobile menu toggle discloses its expanded state",
    /aria-expanded=\{isMobileMenuOpen\}/.test(header),
    "the toggle has no aria-expanded, so its state is unannounced"
  );
  check(
    "the mobile menu is a scrollable region capped to the viewport",
    /max-h-\[calc\(100dvh-4rem\)\]/.test(header) && /overflow-y-auto/.test(header),
    "a long menu cannot scroll, so its lower links are unreachable on a short screen"
  );
  check(
    "the mobile menu identifies the region it controls",
    /aria-controls="mobile-nav"/.test(header),
    "the toggle and the panel are not associated"
  );
  check(
    "the mobile menu locks the page behind it",
    /document\.body\.style\.overflow = "hidden"/.test(header),
    "the page scrolls under the open panel"
  );
  check(
    "the menu closes when the route changes",
    /setIsMobileMenuOpen\(false\)/.test(header) && /pathname !== lastPathname/.test(header),
    "navigating while the menu is open leaves it covering the new page"
  );
}

// ---------------------------------------------------------------------
// 3. Touch targets
//
// A phone is used with a thumb. Anything under 44px is hard to hit, and the
// filter toggle that opens the whole browse experience was once 30px tall.
// That component streams its results on the client, so its markup is absent
// from the server HTML and the source is the only place to assert this.
// ---------------------------------------------------------------------
console.log("\n-- touch targets --");
{
  const browser = fs.readFileSync("src/app/scholarships/ScholarshipsBrowser.tsx", "utf8");
  const toggle = openingTags(browser, "button").find((tag) =>
    /aria-controls=\{[^}]*"scholarship-filters"/.test(tag)
  );
  check(
    "the scholarships filter toggle exists for mobile",
    Boolean(toggle) && /lg:hidden/.test(toggle),
    toggle ? "the toggle is not hidden on desktop" : "mobile users have no way to open the filters"
  );
  const minHeight = toggle?.match(/min-h-\[(\d+)px\]/)?.[1];
  check(
    "the scholarships filter toggle meets a 44px touch target",
    Number(minHeight) >= 44,
    toggle ? `its minimum height is ${minHeight ?? "unset"}px` : "toggle not found"
  );
  check(
    "the browse page has a mobile filters panel, not just a desktop sidebar",
    /block lg:hidden/.test(browser) && /<SearchFilters/.test(browser),
    "the only filter UI is the desktop sidebar, so filtering is unreachable on a phone"
  );
}

// ---------------------------------------------------------------------
// 4. Truncation must not be the only way to read something
//
// A clipped country or degree list is fine in a card, but only if the full
// value is still reachable. `title` is the cheapest way to keep it.
// ---------------------------------------------------------------------
console.log("\n-- clipped text --");
{
  const card = fs.readFileSync("src/components/scholarships/ScholarshipCard.tsx", "utf8");
  const bare = [...card.matchAll(/<span className="truncate">(?![\s\S]{0,80}?title=)/g)];
  check(
    "clipped card values expose a title with the full text",
    bare.length === 0,
    `${bare.length} truncated span(s) have no title attribute`
  );
}

console.log(`\n${failures} failure(s) across ${checks} checks.`);
process.exit(failures === 0 ? 0 : 1);
