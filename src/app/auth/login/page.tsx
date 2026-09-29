import { Suspense } from "react";

import LoginForm from "./LoginForm";
import { getEnabledProviders } from "@/lib/oauth/config";

/**
 * Server entry point for sign-in.
 *
 * Which social providers are offered is decided here and passed down, so the
 * client never learns whether a credential exists.
 *
 * `?next=`, `?registered=` and `?error=` are read with `useSearchParams` inside
 * the form, which opts that subtree out of static prerendering, so it needs a
 * boundary to render while the real query string resolves.
 *
 * Rendered per request on purpose. The provider list depends on environment
 * variables, and a statically prerendered page would freeze that list at build
 * time, so adding credentials and restarting would leave the buttons missing
 * until the next build.
 */
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const providers = getEnabledProviders().map((provider) => provider.id);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <p className="text-sm text-gray-500">Loading&hellip;</p>
        </div>
      }
    >
      <LoginForm providers={providers} />
    </Suspense>
  );
}
