import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Server-side authentication and authorization.
 *
 * Design
 * ------
 * * Passwords are bcrypt hashes, never plaintext, never returned to a client.
 * * A session is a 256-bit random token. Only its HMAC-SHA256 digest is stored
 *   in the database, so a database leak cannot be replayed as a valid cookie.
 * * The cookie is httpOnly + sameSite=lax (+ secure in production), so client
 *   JavaScript cannot read it.
 * * Every request re-reads the session row and the user, so a suspended or
 *   demoted account loses access immediately rather than at token expiry.
 *
 * This module is server-only; importing it from a client component will fail at
 * build time rather than leaking secrets.
 */

export const SESSION_COOKIE = "gs_session";
const SESSION_TTL_DAYS = 7;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000; // at most every 5 min

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  avatar: string | null;
}

function sessionSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "NEXTAUTH_SECRET is missing or too short. Sessions cannot be signed without it."
    );
  }
  return secret;
}

/** HMAC the token so stored digests are not directly comparable to a guess. */
function digest(token: string): string {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const hdrs = await headers();

  await prisma.session.create({
    data: {
      tokenHash: digest(token),
      userId,
      expiresAt,
      ipAddress: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: hdrs.get("user-agent")?.slice(0, 250) ?? null,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    // Deleting by digest is safe even if the row is already gone.
    await prisma.session.deleteMany({ where: { tokenHash: digest(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Invalidate every session for a user, e.g. after a password change. */
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/** Removes expired rows. Safe to call opportunistically. */
export async function pruneExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}

/**
 * Resolves the current session to a user, or null.
 *
 * Expired, revoked and suspended sessions all resolve to null, so a stale
 * cookie can never grant access.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    // Clean up on read so an expired row cannot be retried.
    await prisma.session
      .delete({ where: { id: session.id } })
      .catch(() => undefined);
    return null;
  }

  if (session.user.suspended) return null;

  // Throttled write: keeps "last active" useful without a DB write per request.
  if (Date.now() - session.lastUsedAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    avatar: session.user.avatar,
  };
}

// ---------------------------------------------------------------------------
// Roles and permissions
// ---------------------------------------------------------------------------

const ROLE_RANK: Record<string, number> = {
  USER: 0,
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/** True for any staff account (everyone who may open /admin). */
export function isStaff(role: string | null | undefined): boolean {
  return ROLE_RANK[role ?? "USER"] >= ROLE_RANK.EDITOR;
}

export function atLeast(role: string | null | undefined, required: string): boolean {
  return ROLE_RANK[role ?? "USER"] >= ROLE_RANK[required];
}

/** Editors may create and edit content but not destroy it or manage people. */
export function canDeleteContent(role: string | null | undefined): boolean {
  return atLeast(role, "ADMIN");
}

export function canManageUsers(role: string | null | undefined): boolean {
  return atLeast(role, "ADMIN");
}

/** Only a super admin may create, demote or delete other admins. */
export function canManageRoles(role: string | null | undefined): boolean {
  return atLeast(role, "SUPER_ADMIN");
}

export function canChangeSettings(role: string | null | undefined): boolean {
  return atLeast(role, "SUPER_ADMIN");
}

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------

/**
 * Server-side guard for admin pages. Redirects to the admin login when there is
 * no valid staff session, so authorization never depends on a hidden UI.
 */
export async function requireStaff(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    const target = returnTo ? `/admin/login?next=${encodeURIComponent(returnTo)}` : "/admin/login";
    redirect(target);
  }
  return user;
}

/** Guard for pages that additionally require a minimum role. */
export async function requireRole(required: string, returnTo?: string): Promise<SessionUser> {
  const user = await requireStaff(returnTo);
  if (!atLeast(user.role, required)) {
    redirect("/admin/dashboard?error=forbidden");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export interface AuthResult {
  ok: boolean;
  user?: SessionUser;
  error?: string;
}

/**
 * Verifies credentials. Returns the same generic message for unknown email and
 * wrong password so the form cannot be used to enumerate accounts.
 */
export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always run a bcrypt comparison so timing does not reveal whether the
  // account exists.
  const hash = user?.password ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const valid = await verifyPassword(password, hash);

  if (!user || !user.password || !valid) {
    return { ok: false, error: "Incorrect email or password." };
  }
  if (user.suspended) {
    return {
      ok: false,
      error: "This account is suspended. Contact an administrator if you believe this is a mistake.",
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  };
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const normalized = data.email.trim().toLowerCase();
  if (!normalized || !data.password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (data.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: {
      name: data.name.trim() || null,
      email: normalized,
      password: await hashPassword(data.password),
      role: "USER",
    },
  });
  return { ok: true, id: user.id };
}

/** Constant-time string compare, for comparing user-supplied secrets. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
