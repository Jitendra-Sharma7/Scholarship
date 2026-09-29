import { createSign } from "crypto";
import type { OAuthProvider } from "./config";

/**
 * Provider endpoints and the differences between them.
 *
 * Google and Apple differ in three ways that matter to the code: where the
 * browser is sent, how the authorisation response comes back (query string vs a
 * form POST), and how the client authenticates to the token endpoint (a plain
 * secret vs a signed JWT). Each is handled here so the routes stay generic.
 */

export interface AuthorizeUrl {
  url: string;
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string
): AuthorizeUrl {
  const url = new URL(
    provider.id === "google"
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : "https://appleid.apple.com/auth/authorize"
  );

  url.searchParams.set("client_id", provider.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", provider.id === "google" ? "openid email profile" : "name email");

  if (provider.id === "google") {
    // Without these Google will not return a refresh token, and it will refuse a
    // consent screen that cannot say who is asking.
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "select_account");
  } else {
    url.searchParams.set("response_mode", "form_post");
  }

  return { url: url.toString() };
}

/**
 * Builds the client secret for the token request.
 *
 * Apple requires a JWT signed with the team's private key; Google takes the
 * plain client secret.
 */
export function buildClientSecret(provider: OAuthProvider): string {
  if (provider.id === "google") return provider.clientSecret ?? "";

  const header = { alg: "ES256", kid: provider.keyId, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: provider.teamId,
    aud: "https://appleid.apple.com",
    sub: provider.clientId,
    iat: now,
    exp: now + 60 * 60,
  };

  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const signingInput = `${encode(header)}.${encode(claims)}`;

  // createSign wants the PEM body without the header and footer lines.
  const key = (provider.privateKey ?? "")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const pem = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----\n`;
  const signature = createSign("SHA256").update(signingInput).sign(pem, "base64url");

  return `${signingInput}.${signature}`;
}

export function tokenEndpoint(provider: OAuthProvider): string {
  return provider.id === "google"
    ? "https://oauth2.googleapis.com/token"
    : "https://appleid.apple.com/auth/token";
}

export interface OAuthProfile {
  /** The provider's stable identifier for this person. */
  id: string;
  email: string;
  name: string | null;
}

/**
 * Exchanges an authorisation code for tokens and reads the profile.
 *
 * The `id_token` is read from the token endpoint response rather than from a
 * separate userinfo call. That response arrives over TLS in a server-to-server
 * request authenticated with the client secret, so an attacker cannot substitute
 * their own token: producing one would require the secret. The claims are still
 * checked below for issuer, audience and expiry, which is what ties the token to
 * this application.
 */
export async function fetchProfile(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<OAuthProfile> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: provider.clientId,
    client_secret: buildClientSecret(provider),
  });

  const response = await fetch(tokenEndpoint(provider), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`token endpoint refused the exchange (HTTP ${response.status})`);
  }

  const tokens = (await response.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("the token response carried no id_token");

  const claims = readIdTokenClaims(provider, tokens.id_token);

  const sub = claims.sub as string | undefined;
  const email = claims.email as string | undefined;
  if (!sub || !email) throw new Error("the id_token carried no subject or email");

  return {
    id: sub,
    email: email.toLowerCase(),
    name: (claims.name as string | undefined) ?? null,
  };
}

/** Decodes the id_token payload and confirms it belongs to this application. */
function readIdTokenClaims(
  provider: OAuthProvider,
  idToken: string
): Record<string, unknown> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("the id_token is not a JWT");

  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;

  const expectedIssuer =
    provider.id === "google" ? "https://accounts.google.com" : "https://appleid.apple.com";
  if (claims.iss !== expectedIssuer) {
    throw new Error("the id_token was issued by a different provider");
  }

  // Google puts the client id in `aud` and repeats it in `azp`; Apple puts the
  // client id in `aud` and an internal bundle id alongside it. Accept either
  // shape but require our own client id to be present.
  const audience = [claims.aud, claims.azp, ...(Array.isArray(claims.aud) ? claims.aud : [])].filter(
    (value): value is string => typeof value === "string"
  );
  if (!audience.includes(provider.clientId)) {
    throw new Error("the id_token was issued to a different application");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now) {
    throw new Error("the id_token has expired");
  }

  return claims;
}
