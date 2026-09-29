import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * CSRF state for the OAuth handshake.
 *
 * The state parameter is what ties an authorisation response back to the
 * browser that asked for it. It is a random nonce plus an expiry, signed with
 * the session secret so it cannot be forged, and it is single-use.
 *
 * The nonce is deliberately NOT kept in a cookie. Apple returns the user with a
 * cross-site POST, and a cookie with the usual `SameSite=Lax` is not sent on a
 * cross-site POST, so a cookie-based state would fail for Apple alone while
 * appearing to work for Google. Carrying the signed value in the state
 * parameter itself avoids that difference. The cost is that the nonce has to be
 * remembered somewhere to be single-use, which is why spent nonces are tracked
 * in module memory below, the same trade the rate limiter already makes.
 */

const STATE_TTL_MS = 10 * 60 * 1000;

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("NEXTAUTH_SECRET is missing or too short. OAuth state cannot be signed.");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Nonces already redeemed, so a captured callback cannot be replayed. */
const spent = new Map<string, number>();

function sweep(now: number): void {
  for (const [nonce, expiresAt] of spent) {
    if (expiresAt <= now) spent.delete(nonce);
  }
}

export function createState(): string {
  const nonce = randomBytes(24).toString("base64url");
  const expiresAt = Date.now() + STATE_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ nonce, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export type StateResult = { ok: true; nonce: string } | { ok: false; reason: string };

export function verifyState(state: string | null | undefined): StateResult {
  if (!state) return { ok: false, reason: "missing" };

  const separator = state.lastIndexOf(".");
  if (separator <= 0) return { ok: false, reason: "malformed" };

  const payload = state.slice(0, separator);
  const signature = state.slice(separator + 1);
  const expected = sign(payload);

  // Compare in constant time, and only after checking length, because
  // timingSafeEqual throws on a length mismatch.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad signature" };

  let parsed: { nonce?: string; expiresAt?: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "unreadable" };
  }

  const { nonce, expiresAt } = parsed;
  if (!nonce || typeof expiresAt !== "number") return { ok: false, reason: "incomplete" };

  const now = Date.now();
  if (expiresAt <= now) return { ok: false, reason: "expired" };

  sweep(now);
  if (spent.has(nonce)) return { ok: false, reason: "already used" };
  spent.set(nonce, expiresAt);

  return { ok: true, nonce };
}
