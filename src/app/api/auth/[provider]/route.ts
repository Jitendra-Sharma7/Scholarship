import { NextResponse } from "next/server";
import { getProvider } from "@/lib/oauth/config";
import { buildAuthorizeUrl } from "@/lib/oauth/providers";
import { createState } from "@/lib/oauth/state";

/**
 * Starts the OAuth handshake by sending the browser to the provider.
 *
 * If the provider is not fully configured this returns 404 rather than a
 * redirect, so a stale or half-configured button fails visibly instead of
 * bouncing the visitor through a consent screen that cannot complete.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);

  if (!provider) {
    return NextResponse.json(
      { error: "This sign-in method is not available." },
      { status: 404 }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/${provider.id}/callback`;

  const { url } = buildAuthorizeUrl(provider, redirectUri, createState());

  return NextResponse.redirect(url);
}
