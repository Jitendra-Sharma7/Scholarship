/**
 * Secret detection shared by the verification scripts.
 *
 * The existing bundle check matches *names* - `DATABASE_URL`, `NEXTAUTH_SECRET`
 * - which only catches a server module being bundled wholesale. It cannot catch
 * a value that was copied into a client component, because a bare string like
 * `"s3cr3t-value"` carries no name to match. Reading the real values out of
 * `.env` and searching for them catches that case directly.
 *
 * Nothing here prints a value. A failing check reports the key and where it
 * turned up, because the fix is to remove the value, not to re-read it.
 */
import fs from "node:fs";

/**
 * Keys whose values are safe to ship to the browser: they are origins, modes
 * and limits rather than credentials, and several of them are already read by
 * client components by design.
 */
const NOT_SECRET = new Set([
  "NODE_ENV",
  "NEXT_PUBLIC_SITE_URL",
  "APP_URL",
  "NEXTAUTH_URL",
  "UPLOAD_DIR",
  "UPLOAD_MAX_MB",
  "RATE_LIMIT_MAX_REQUESTS",
  "RATE_LIMIT_WINDOW_MS",
  "SMTP_HOST",
  "SMTP_PORT",
  "ADMIN_NAME",
  "ADMIN_ROLE",
]);

/** A value long enough that matching it in a bundle is meaningful, not a coincidence. */
const MIN_LENGTH = 12;

/** Parses a dotenv file. Returns a Map so a missing file is an empty result, not a crash. */
export function readEnvFile(file = ".env") {
  const out = new Map();
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
    if (!match) continue;
    out.set(match[1].trim(), match[2].trim().replace(/^["']/, "").replace(/["']$/, ""));
  }
  return out;
}

/**
 * The values that must never reach the browser or an anonymous page.
 *
 * Placeholders from `.env.example` are excluded: they are printed in the
 * repository, so finding one says nothing about this deployment.
 */
export function secretValues(env = readEnvFile()) {
  return [...env.entries()].filter(
    ([key, value]) =>
      !NOT_SECRET.has(key) &&
      !key.startsWith("NEXT_PUBLIC_") &&
      value.length >= MIN_LENGTH &&
      !/^(change-me|replace-with|your-|example|placeholder)/i.test(value)
  );
}

/**
 * A `NEXT_PUBLIC_*` variable is inlined into the browser bundle by Next.js
 * itself, so one that holds a credential leaks by being named that way. This
 * is the check that catches the rename rather than the leak.
 */
export function publicSecretNames(env = readEnvFile()) {
  return [...env.keys()].filter(
    (key) => key.startsWith("NEXT_PUBLIC_") && /SECRET|PASSWORD|TOKEN|PRIVATE|API_?KEY|CREDENTIAL/i.test(key)
  );
}

/** Every configured secret that appears in `haystack`, reported by key only. */
export function leakedKeys(haystack, secrets = secretValues()) {
  return secrets.filter(([, value]) => haystack.includes(value)).map(([key]) => key);
}
