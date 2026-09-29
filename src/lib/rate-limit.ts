import { headers } from "next/headers";

/**
 * Fixed-window rate limiter kept in module scope.
 *
 * Suitable for a single Node process, which is how the app currently runs. If
 * this is ever deployed across multiple instances, swap the Map for Redis so
 * the counters are shared; the interface below would not need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory: drop expired buckets periodically instead of growing forever.
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
}

function maxRequests(): number {
  const parsed = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

function windowMs(): number {
  const parsed = Number(process.env.RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000;
}

/**
 * Counts one hit against `key` and reports whether it may proceed.
 *
 * @param key    Bucket identity, e.g. "login:<ip>".
 * @param limit  Optional per-call override; defaults to RATE_LIMIT_MAX_REQUESTS.
 */
export async function rateLimit(key: string, limit?: number): Promise<RateLimitResult> {
  const now = Date.now();
  sweep(now);

  const max = limit ?? maxRequests();
  const window = windowMs();

  let ip = "unknown";
  try {
    const hdrs = await headers();
    ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? ip;
  } catch {
    // Outside a request scope; the caller-provided key still applies.
  }

  const bucketKey = `${key}:${ip}`;

  const existing = buckets.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: max - 1, retryAfter: Math.ceil(window / 1000) };
  }

  existing.count += 1;
  const allowed = existing.count <= max;
  return {
    allowed,
    remaining: Math.max(0, max - existing.count),
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Clears every bucket. Used by tests and the dev-only reset route. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Forgets one bucket, e.g. after a successful sign-in.
 *
 * The point of the login limiter is to slow down password guessing, which only
 * failed attempts help. Charging a correct password against the same budget
 * means an administrator who mistypes once and then signs in normally can lock
 * themselves out, so a successful attempt clears the record instead.
 */
export async function clearRateLimit(key: string): Promise<void> {
  let ip = "unknown";
  try {
    const hdrs = await headers();
    ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? ip;
  } catch {
    // Outside a request scope; the caller's key alone identifies the bucket.
  }
  buckets.delete(`${key}:${ip}`);
}
