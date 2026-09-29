import RegisterForm from "./RegisterForm";
import { getEnabledProviders } from "@/lib/oauth/config";

/**
 * Server entry point for registration.
 *
 * Which social providers are offered is decided here, on the server, and passed
 * down as a list. The client never inspects credentials, so a provider is shown
 * only when it is completely configured, and no secret can reach the browser.
 *
 * Rendered per request on purpose. The provider list depends on environment
 * variables, and a statically prerendered page would freeze that list at build
 * time, so adding credentials and restarting would leave the buttons missing
 * until the next build.
 */
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const providers = getEnabledProviders().map((provider) => provider.id);

  return <RegisterForm providers={providers} />;
}
