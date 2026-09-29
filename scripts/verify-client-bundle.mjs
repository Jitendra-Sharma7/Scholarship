/**
 * Checks that no server-only code reached the browser bundle.
 *
 * The public API routes are deliberately absent from the frontend, so the only
 * way a component can get data is a server component or a server action. A
 * transitive value import of the database layer would defeat that silently: the
 * pages still work, the Prisma client just ships to the browser and throws on
 * first use, and the bundle grows by tens of kilobytes.
 *
 * That exact regression happened once, through a constants module that a client
 * component imported for its exported fallback values. This check makes it fail
 * loudly instead.
 *
 * The name patterns above only catch a module being bundled wholesale. A value
 * copied straight into a client component leaves no name behind, so the real
 * values from `.env` are searched for too, and a `NEXT_PUBLIC_*` variable that
 * holds a credential is treated as a failure on its own: Next.js inlines those
 * into the browser bundle by design.
 *
 * Requires `npm run build` first.
 */
import fs from "node:fs";
import path from "node:path";
import { leakedKeys, publicSecretNames, secretValues } from "./lib/secrets.mjs";

const CHUNKS = path.join(process.cwd(), ".next", "static", "chunks");

/** Markers that only appear when server-only code has been bundled for the browser. */
const FORBIDDEN = [
  { label: "the Prisma client", pattern: /PrismaClientKnownRequestError|has been bundled for the browser/ },
  { label: "a database connection string", pattern: /DATABASE_URL/ },
  { label: "bcrypt", pattern: /bcryptjs|\$2[aby]\$\d{2}\$/ },
  { label: "the session secret", pattern: /NEXTAUTH_SECRET/ },
];

if (!fs.existsSync(CHUNKS)) {
  console.error("No .next/static/chunks directory. Run `npm run build` first.");
  process.exit(2);
}

/**
 * Every `.js` file under the chunk directory, as a path relative to it.
 *
 * The chunks are nested per route group, so a flat readdir only ever inspected
 * the top level and would have passed while a secret sat in a nested chunk.
 */
function chunkFiles(dir = CHUNKS, prefix = "") {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) found.push(...chunkFiles(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith(".js")) found.push(rel);
  }
  return found;
}

let failures = 0;
let scanned = 0;
const secrets = secretValues();

for (const name of chunkFiles()) {
  if (!name.endsWith(".js")) continue;
  const contents = fs.readFileSync(path.join(CHUNKS, name), "utf8");
  scanned += 1;

  for (const { label, pattern } of FORBIDDEN) {
    if (pattern.test(contents)) {
      failures += 1;
      console.log(`FAIL  ${name} contains ${label}`);
    }
  }

  for (const key of leakedKeys(contents, secrets)) {
    failures += 1;
    console.log(`FAIL  ${name} contains the value of ${key}`);
  }
}

// A `NEXT_PUBLIC_` credential is inlined into the bundle whether or not a
// component imports it, so this is checked independently of the scan above.
for (const key of publicSecretNames()) {
  failures += 1;
  console.log(`FAIL  ${key} is a NEXT_PUBLIC_ variable, so its value ships to the browser`);
}

if (failures > 0) {
  console.log(
    `\n${failures} server-only leak(s) in the client bundle.\n` +
      "A client component is importing a value from a server module. Import types with\n" +
      "`import type`, or move the shared constants out of the server module. A named\n" +
      "secret means a credential reached the browser: remove the value from the source\n" +
      "and read it from the environment in a server module instead."
  );
  process.exit(1);
}

console.log(
  `No server-only code in ${scanned} client chunk(s), and none of the ` +
    `${secrets.length} configured secret(s) appear in them.`
);
