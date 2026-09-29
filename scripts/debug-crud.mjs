const BASE = "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
let cookie = "";

function decode(s) {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function absorb(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [p] = c.split(";");
    if (p.startsWith("gs_session=")) cookie = p;
  }
}
function hiddenFields(html) {
  const out = [];
  for (const tag of html.match(/<input[^>]*type="hidden"[^>]*>/g) ?? []) {
    const n = tag.match(/name="([^"]*)"/)?.[1];
    const v = tag.match(/value="([^"]*)"/)?.[1] ?? "";
    if (n) out.push([decode(n), decode(v)]);
  }
  return out;
}

const login = await (await fetch(`${BASE}/admin/login`)).text();
const fd = new FormData();
for (const [n, v] of hiddenFields(login)) fd.set(n, v);
fd.set("email", EMAIL);
fd.set("password", PASSWORD);
const lr = await fetch(`${BASE}/admin/login`, { method: "POST", body: fd, redirect: "manual" });
absorb(lr);
console.log("login status", lr.status, "cookie len", cookie.length);

const list = await fetch(`${BASE}/admin/scholarships`, { headers: { cookie } });
const lh = await list.text();
console.log("list status", list.status, "len", lh.length);
for (const probe of ["Add scholarship", "Select all on page", "Bulk actions", "Scholarships", "Add scholarship</", "admin/scholarships/new"]) {
  console.log(`  contains ${JSON.stringify(probe)}:`, lh.includes(probe));
}
console.log("  h1:", lh.match(/<h1[^>]*>([\s\S]{0,120}?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

// now try the create
const np = await (await fetch(`${BASE}/admin/scholarships/new`, { headers: { cookie } })).text();
console.log("hidden action fields:", hiddenFields(np).map(([n]) => n).filter((n) => n.startsWith("$ACTION")));

async function count() {
  const h = await (await fetch(`${BASE}/admin/scholarships?page=1`, { headers: { cookie } })).text();
  return Number(h.match(/([\d,]+)\s+scholarships?/)?.[1].replace(/,/g, "") ?? -1);
}

const before = await count();
const nfd = new FormData();
for (const [n, v] of hiddenFields(np)) nfd.set(n, v);
nfd.set("title", "DEBUG valid create");
nfd.set("fundingType", "fully-funded");
nfd.set("deadline", new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10));
nfd.set("source", "https://example.org/program");
nfd.set("verificationStatus", "Verification Needed");
nfd.set("publishStatus", "DRAFT");
nfd.set("description", "Created by the debug script.");
nfd.set("degreeLevels", "Master's");
nfd.set("degreeLevelsOther", "JD");
nfd.set("includeInSitemap", "true");
const cr = await fetch(`${BASE}/admin/scholarships/new`, {
  method: "POST",
  headers: { cookie },
  body: nfd,
  redirect: "manual",
});
const ch = await cr.text();
console.log("create status", cr.status);
console.log("location:", cr.headers.get("location"));
console.log("content-type:", cr.headers.get("content-type"));
console.log("count before/after:", before, await count());
const text = ch.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const i = text.indexOf("attention");
if (i >= 0) console.log("validation:", JSON.stringify(text.slice(i, i + 200)));
const slugProbe = text.match(/e2e|debug/i);
console.log("title echoed:", slugProbe ? "yes" : "no");
console.log("first 300:", JSON.stringify(text.slice(0, 300)));
const e = text.indexOf("must be signed in");
if (e >= 0) console.log("AUTH ERROR:", text.slice(e - 100, e + 200));
const s2 = text.indexOf("Something went wrong");
if (s2 >= 0) console.log("ERROR STATE:", text.slice(s2 - 100, s2 + 300));
