import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/oauth/config";
import { fetchProfile } from "@/lib/oauth/providers";
import { verifyState } from "@/lib/oauth/state";
import { createSession } from "@/lib/auth";
import { clearRateLimit } from "@/lib/rate-limit";
import { recordActivity } from "@/lib/audit";

/**
 * Completes the OAuth handshake and starts a session.
 *
 * Accepts both GET and POST because the two providers differ: Google returns the
 * authorisation code as a query parameter, while Apple POSTs a form back to this
 * URL (`response_mode=form_post`). One handler covers both so the two cannot
 * drift apart.
 *
 * The steps, in order, are the ones that matter: reject an unconfigured provider,
 * reject a bad or replayed state, exchange the code at the provider, then find or
 * create the account. Nothing is written before the state and the provider have
 * both been checked.
 */

async function readParams(request: Request): Promise<URLSearchParams> {
  if (request.method === "POST") {
    // Apple POSTs the authorisation code as a form, so read it from the body.
    const form = await request.formData();
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") params.set(key, value);
    }
    return params;
  }
  return new URL(request.url).searchParams;
}

function failure(request: Request, reason: string) {
  const origin = new URL(request.url).origin;
  // The visitor is sent back to the page they started from with a readable
  // reason. Provider errors are shown plainly rather than swallowed, because a
  // silent failure here looks like a broken sign-in button.
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent(reason)}`,
    { status: 303 }
  );
}

async function handle(request: Request, providerId: string) {
  const provider = getProvider(providerId);
  if (!provider) return failure(request, "That sign-in method is not available.");

  const params = await readParams(request);

  // The provider reports a user refusal with its own error code. Say so rather
  // than showing a generic message, so it is clear the visitor cancelled.
  const providerError = params.get("error");
  if (providerError) {
    return failure(
      request,
      providerError === "access_denied"
        ? "You cancelled the sign-in."
        : "The provider could not complete the sign-in."
    );
  }

  const state = verifyState(params.get("state"));
  if (!state.ok) {
    return failure(request, "That sign-in link has expired. Please try again.");
  }

  const code = params.get("code");
  if (!code) return failure(request, "The provider did not return an authorisation code.");

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/${provider.id}/callback`;

  let profile;
  try {
    profile = await fetchProfile(provider, code, redirectUri);
  } catch (error) {
    console.error(`[oauth] ${provider.id} token exchange failed:`, error);
    return failure(request, "The provider could not be reached. Please try again.");
  }

  // An existing account for this provider identity signs straight in. Otherwise
  // the identity is linked to a user row with the same email, which is what
  // lets someone who registered with a password later use "Continue with
  // Google" without losing their saved scholarships.
  const existingLink = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: provider.id,
        providerAccountId: profile.id,
      },
    },
    include: { user: true },
  });

  const user = existingLink
    ? existingLink.user
    : await (async () => {
        const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
        if (byEmail) {
          await prisma.authAccount.create({
            data: {
              userId: byEmail.id,
              provider: provider.id,
              providerAccountId: profile.id,
            },
          });
          return byEmail;
        }
        return prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            // No password: this identity can only sign in through the provider
            // until the visitor sets one from their profile.
            password: null,
            role: "USER",
            oauthAccounts: {
              create: { provider: provider.id, providerAccountId: profile.id },
            },
          },
        });
      })();

  await clearRateLimit(`login:${user.email}`);
  await createSession(user.id);
  await recordActivity({
    action: "auth.login",
    entityType: "Auth",
    entityId: user.id,
    summary: `${user.email} signed in with ${provider.label}`,
    actor: { id: user.id, email: user.email },
  });

  return NextResponse.redirect(`${origin}/dashboard`, { status: 303 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return handle(request, provider);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return handle(request, provider);
}
