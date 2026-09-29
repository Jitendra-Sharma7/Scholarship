/**
 * Timestamped pg_dump backup of DATABASE_URL.
 *
 * Schema changes in this project ship through `prisma db push`, because there is
 * no prisma/migrations directory. That means a destructive change (a dropped or
 * rewritten column) has no down migration to fall back on: a dump taken before
 * the push is the only way back. This script is that dump.
 *
 * Read-only with respect to the database. Writes a file to ./backups.
 *
 * Usage: npm run db:backup
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";

const DIR = resolve(process.env.BACKUP_DIR || "backups");
const KEEP = Number(process.env.BACKUP_KEEP || 14);
const STAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = join(DIR, `gsh-${STAMP}.dump`);

function fail(message, hint) {
  console.error(`\ndb:backup FAILED — ${message}`);
  if (hint) {
    console.error("\nRun it from the host instead:");
    console.error(hint);
  }
  process.exit(1);
}

const raw = process.env.DATABASE_URL;
if (!raw) fail("DATABASE_URL is not set.", "docker compose exec -T db pg_dump -U gsh -Fc global_scholarships > backups/gs-$(date +%F).dump");

let url;
try {
  url = new URL(raw);
} catch {
  fail("DATABASE_URL is not a valid URL.");
}

const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
if (!database) fail("DATABASE_URL has no database name.");

mkdirSync(DIR, { recursive: true });
if (existsSync(OUT)) fail(`refusing to overwrite an existing backup at ${OUT}.`);

console.log(`Backing up database "${database}" at ${url.hostname}:${url.port || 5432}`);
console.log(`Destination: ${OUT}`);

const args = [
  "--format=custom",
  "--no-password",
  "--host", url.hostname,
  "--port", url.port || "5432",
  "--username", decodeURIComponent(url.username),
  "--file", OUT,
  database,
];

const child = spawn("pg_dump", args, {
  env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password || "") },
  stdio: ["ignore", "inherit", "pipe"],
});

let stderr = "";
child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

child.on("error", (error) => {
  if (error.code === "ENOENT") {
    fail(
      "pg_dump is not on PATH.",
      "docker compose exec -T db pg_dump -U gsh -Fc global_scholarships > backups/gs-$(date +%F).dump\n" +
        "# or install PostgreSQL client tools, then re-run this script.",
    );
  }
  fail(`pg_dump could not start: ${error.message}`);
});

child.on("close", (code) => {
  if (code !== 0) {
    fail(`pg_dump exited with code ${code}.${stderr ? `\n${stderr.trim()}` : ""}`);
  }

  const bytes = statSync(OUT).size;
  if (bytes === 0) {
    unlinkSync(OUT);
    fail("pg_dump produced an empty file, so it was deleted. Do not treat this as a backup.");
  }

  const old = readdirSync(DIR)
    .filter((name) => /^gsh-.*\.dump$/.test(name) && name !== OUT.split(/[\\/]/).pop())
    .sort();
  let removed = 0;
  while (old.length - removed > KEEP - 1) {
    unlinkSync(join(DIR, old[removed]));
    removed += 1;
  }

  console.log(`\nBackup written: ${OUT} (${(bytes / 1024).toFixed(1)} KB)`);
  if (removed) console.log(`Pruned ${removed} backup(s) beyond the newest ${KEEP}.`);
  console.log("Verify it restores before relying on it: pg_restore --list on the file lists its contents.");
});
