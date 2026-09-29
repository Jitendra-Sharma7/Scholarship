/**
 * OAuth provider configuration, read from the environment.
 *
 * A provider is offered only when it is completely configured. A half-configured
 * provider must never reach the sign-in page: the button would be enabled, the
 * user would grant consent, and the callback would then fail with an error the
 * visitor cannot act on. So the check is "are all the required values present",
 * not "is one value present".
 */

export type OAuthProviderId = "google" | "apple";

export interface OAuthProvider {
  id: OAuthProviderId;
  label: string;
  clientId: string;
  /** Apple signs a JWT client secret rather than sending a plain one. */
  clientSecret?: string;
  teamId?: string;
  keyId?: string;
  privateKey?: string;
}

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

/**
 * The providers that are usable right now.
 *
 * Read per request rather than cached at module scope so that adding
 * credentials and restarting is enough; this is cheap and only runs on the two
 * auth pages and the two callback routes.
 */
export function getEnabledProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = [];

  const googleId = read("GOOGLE_CLIENT_ID");
  const googleSecret = read("GOOGLE_CLIENT_SECRET");
  if (googleId && googleSecret) {
    providers.push({ id: "google", label: "Google", clientId: googleId, clientSecret: googleSecret });
  }

  // Apple requires a signed JWT client secret: the team id, the key id, and the
  // contents of the downloaded .p8 file, with newlines preserved.
  const appleId = read("APPLE_CLIENT_ID");
  const appleTeam = read("APPLE_TEAM_ID");
  const appleKey = read("APPLE_KEY_ID");
  const applePrivateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (appleId && appleTeam && appleKey && applePrivateKey) {
    providers.push({
      id: "apple",
      label: "Apple",
      clientId: appleId,
      teamId: appleTeam,
      keyId: appleKey,
      privateKey: applePrivateKey,
    });
  }

  return providers;
}

export function getProvider(id: string): OAuthProvider | undefined {
  return getEnabledProviders().find((p) => p.id === id);
}

export function isProviderEnabled(id: string): boolean {
  return getProvider(id) !== undefined;
}
