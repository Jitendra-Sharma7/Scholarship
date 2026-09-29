/**
 * The base URL the verification scripts point at.
 *
 * Every script used to hardcode `http://localhost:3000`, which meant moving the
 * app to another port required editing ten files and silently left the checks
 * talking to whatever still answered on 3000 — or to nothing. The port is read
 * from the same `.env` the app reads, so `npm run verify` follows `PORT` and
 * `NEXTAUTH_URL` on its own.
 *
 * Precedence, highest first:
 *   1. The caller's own override: BASE, or BASE_URL for verify-links.
 *   2. NEXTAUTH_URL from the environment, then from `.env`.
 *   3. http://localhost:<PORT>, where PORT comes from `.env` when set.
 *   4. http://localhost:3000.
 */
import { readEnvFile } from "./secrets.mjs";

/** verify-links reads BASE_URL; everything else reads BASE. Pass the one to use. */
export function resolveBase(overrideKey = "BASE") {
  const override = process.env[overrideKey];
  if (override) return override.replace(/\/$/, "");

  const env = readEnvFile();
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? env.get("NEXTAUTH_URL");
  if (nextAuthUrl) return nextAuthUrl.replace(/\/$/, "");

  const port = process.env.PORT ?? env.get("PORT") ?? "3000";
  return `http://localhost:${port}`;
}
