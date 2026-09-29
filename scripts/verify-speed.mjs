/**
 * Page weight and response-time budgets.
 *
 * Two regressions here are invisible in a screenshot and expensive on a phone.
 *
 * The first is a server component handing a client component a whole database
 * record to render four fields. React serialises the entire prop into the RSC
 * payload, so all 197 countries - each with a description, study notes and visa
 * guidance - were shipped to the browser on the homepage, /finder, /scholarships
 * and /countries, which is most of the page weight. The budget below is what
 * catches the return of that.
 *
 * The second is a client component importing a *value* out of a server module,
 * which drags the whole module - and zod with it - into the bundle. `verify:bundle`
 * catches that globally; this one catches it per page, and measures the result.
 *
 * Needs a server on the base URL, read from `.env`.
 */
const BASE = resolveBase();

import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";

import { resolveBase } from "./lib/base-url.mjs";

/**
 * Per-route ceilings, measured and then set with headroom. The JS figure is
 * almost entirely the React and Next.js runtime plus the shared providers, and
 * is the same on every page: `/contact` ships as much framework code as the
 * homepage. It is here to catch a dependency being added, not to be optimised
 * route by route.
 */
const ROUTES = [
  { path: "/", totalKb: 260, htmlKb: 40 },
  { path: "/scholarships", totalKb: 260, htmlKb: 40 },
  { path: "/finder", totalKb: 250, htmlKb: 30 },
  { path: "/countries", totalKb: 250, htmlKb: 30 },
  { path: "/universities", totalKb: 250, htmlKb: 30 },
  { path: "/deadlines", totalKb: 260, htmlKb: 40 },
  { path: "/fully-funded", totalKb: 260, htmlKb: 40 },
  { path: "/blog", totalKb: 240, htmlKb: 30 },
  { path: "/contact", totalKb: 240, htmlKb: 20 },
  { path: "/submit-scholarship", totalKb: 250, htmlKb: 25 },
];

/** A single slow response, on a warm process, is a real problem worth failing on. */
const RESPONSE_BUDGET_MS = 1500;

/**
 * Fields that belong to a rendered country page and are read by no client
 * component. If one of these turns up in a page's RSC payload, a full country
 * record has been serialised to the browser again.
 */
const SERVER_ONLY_COUNTRY_FIELDS = [
  "studyInfo",
  "visaInfo",
  "costOfLiving",
  "avgLivingCost",
  "popularFields",
  "languageRequirements",
];

let failures = 0;
let checks = 0;
function check(label, ok, detail) {
  checks += 1;
  const note = !ok && detail ? `  -> ${detail}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${note}`);
  if (!ok) failures += 1;
}

/**
 * Compressed bytes as sent, which is what a visitor downloads.
 *
 * `fetch` transparently decodes gzip, so its `arrayBuffer()` is the *expanded*
 * body and would report roughly four times the real transfer. This counts bytes
 * off the socket instead, and only decompresses afterwards when the text itself
 * is needed for the field checks.
 */
function rawGet(url) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;
    const request = client.request(
      target,
      { headers: { "accept-encoding": "gzip, br", "user-agent": "verify-speed" } },
      (res) => {
        const chunks = [];
        let bytes = 0;
        res.on("data", (chunk) => {
          bytes += chunk.length;
          chunks.push(chunk);
        });
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          const encoding = String(res.headers["content-encoding"] ?? "");
          let text = "";
          try {
            if (encoding === "gzip") text = zlib.gunzipSync(raw).toString("utf8");
            else if (encoding === "br") text = zlib.brotliDecompressSync(raw).toString("utf8");
            else if (encoding === "deflate") text = zlib.inflateSync(raw).toString("utf8");
            else text = raw.toString("utf8");
          } catch {
            text = "";
          }
          resolve({ bytes, text, status: res.statusCode });
        });
      }
    );
    request.on("error", reject);
    request.end();
  });
}

const rows = [];

for (const route of ROUTES) {
  // Warm the route first: the first hit pays for a cold module and a cold
  // connection, which is not what this measures. `warm` is the response whose
  // byte count is used, so the request that is timed is a separate one.
  const warm = await rawGet(`${BASE}${route.path}`);

  const started = performance.now();
  const html = (await rawGet(`${BASE}${route.path}`)).text;
  const ms = Math.round(performance.now() - started);
  const htmlBytes = warm.bytes;
  const assets = [
    ...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)].map((m) => m[1])),
  ];
  let assetBytes = 0;
  for (const asset of assets) {
    assetBytes += (await rawGet(`${BASE}${asset}`)).bytes;
  }

  const totalKb = Math.round((htmlBytes + assetBytes) / 1024);
  const htmlKb = Math.round(htmlBytes / 1024);
  const assetKb = Math.round(assetBytes / 1024);
  rows.push({ path: route.path, totalKb, htmlKb, assetKb, ms });

  check(
    `${route.path} responds within ${RESPONSE_BUDGET_MS}ms`,
    ms <= RESPONSE_BUDGET_MS,
    `${ms}ms`
  );
  check(
    `${route.path} stays under its ${route.totalKb} KB transfer budget`,
    totalKb <= route.totalKb,
    `${totalKb} KB (html ${htmlKb} + assets ${assetKb})`
  );
  check(
    `${route.path} stays under its ${route.htmlKb} KB document budget`,
    htmlKb <= route.htmlKb,
    `${htmlKb} KB uncompressed on the wire, ${html.length} chars as served`
  );

  // The payload guard: an RSC payload is a JS string, so a field name survives
  // into it verbatim even when the surrounding JSON is escaped.
  const leaked = SERVER_ONLY_COUNTRY_FIELDS.filter((field) => html.includes(field));
  check(
    `${route.path} ships no unrendered country fields to the browser`,
    leaked.length === 0,
    leaked.join(", ")
  );
}

console.log("");
console.log("route".padEnd(22) + "total".padStart(7) + "html".padStart(7) + "assets".padStart(9) + "ms".padStart(7));
for (const r of rows) {
  console.log(
    r.path.padEnd(22) +
      `${r.totalKb} KB`.padStart(7) +
      `${r.htmlKb} KB`.padStart(7) +
      `${r.assetKb} KB`.padStart(9) +
      String(r.ms).padStart(7)
  );
}

console.log(`\n${failures} failure(s) across ${checks} checks.`);
process.exit(failures === 0 ? 0 : 1);
