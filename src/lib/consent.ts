/**
 * Cookie & similar-technologies consent.
 *
 * The Platform currently stores session and preference data in `localStorage`.
 * Under GDPR that is a "similar technology" and is covered by this consent, so the
 * same categories apply whether the storage medium is a cookie or Web Storage.
 *
 * Non-essential categories are inert until a decision is recorded. Gate any future
 * analytics or advertising script behind `canUse()` or `loadScriptIfConsented()`.
 */

export const CONSENT_STORAGE_KEY = "gs_hub_consent";

/**
 * Bump when categories or their meaning change. A stored decision from an older
 * version is treated as absent, which re-prompts the visitor.
 */
export const CONSENT_VERSION = 1;

export type ConsentCategory = "essential" | "functional" | "analytics" | "marketing";

export interface ConsentState {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of the decision, or null if none recorded. */
  decidedAt: string | null;
  version: number;
}

export type ConsentDecision = Omit<ConsentState, "essential" | "decidedAt" | "version">;

export const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  decidedAt: null,
  version: CONSENT_VERSION,
};

export interface ConsentCategoryMeta {
  id: ConsentCategory;
  label: string;
  description: string;
  /** Essential storage is required for the site to function and cannot be switched off. */
  locked: boolean;
  /** Whether anything currently sets this category. */
  active: boolean;
  examples: string[];
}

export const CONSENT_CATEGORIES: ConsentCategoryMeta[] = [
  {
    id: "essential",
    label: "Strictly necessary",
    description:
      "Required for the website to provide the functionality you have requested. These cannot be switched off and do not require consent.",
    locked: true,
    active: true,
    examples: [
      "Session and sign-in state",
      "Your privacy and cookie choice",
      "Security and load balancing",
    ],
  },
  {
    id: "functional",
    label: "Functional",
    description:
      "Remember choices you make so we can tailor the experience, such as your saved scholarships, application tracker, and language and filter preferences. These do not build a profile of you for advertising.",
    locked: false,
    active: true,
    examples: ["Saved scholarships and application tracker", "Search filter and language preferences"],
  },
  {
    id: "analytics",
    label: "Analytics",
    description:
      "Help us understand how the platform is used so we can improve it, for example which countries and fields students search most. Set to off, we collect no measurement events at all.",
    locked: false,
    active: false,
    examples: ["Page and search-event measurement in aggregate", "Approximate visit and referral counts"],
  },
  {
    id: "marketing",
    label: "Marketing and advertising",
    description:
      "Used to make advertising more relevant and to measure whether it performs, and to attribute referrals to partner organizations. Sponsored listings are labelled separately and never affect organic search ordering.",
    locked: false,
    active: false,
    examples: ["Ad relevance and frequency capping", "Partner and campaign referral measurement"],
  },
];

/** Read the stored decision. Returns null when absent, malformed, or outdated. */
export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      essential: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : null,
      version: CONSENT_VERSION,
    };
  } catch {
    // Corrupted or blocked storage (private mode, disabled cookies): treat as undecided.
    return null;
  }
}

export function writeConsent(decision: ConsentDecision): ConsentState {
  const state: ConsentState = {
    essential: true,
    functional: decision.functional,
    analytics: decision.analytics,
    marketing: decision.marketing,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: the banner will re-prompt on the next visit, which is
    // the safe outcome because we then never assume consent.
  }
  return state;
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

/** True only when a recorded decision explicitly granted this category. */
export function canUse(category: ConsentCategory, state: ConsentState | null): boolean {
  if (category === "essential") return true;
  if (!state) return false;
  return state[category];
}

/**
 * Load a third-party script only when the matching category is consented to.
 * Returns without doing anything when consent is absent or withheld.
 */
export function loadScriptIfConsented(
  src: string,
  category: ConsentCategory,
  state: ConsentState | null
): boolean {
  if (typeof document === "undefined") return false;
  if (!canUse(category, state)) return false;
  if (document.querySelector(`script[src="${src}"]`)) return true;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.dataset.consentCategory = category;
  document.head.appendChild(script);
  return true;
}

/* ------------------------------------------------------------------ *
 * Subscription layer
 *
 * Exposes consent as an external store so components can read it with
 * `useSyncExternalStore`. That keeps the server snapshot and the client
 * snapshot distinct without a setState-in-effect, which React reports as a
 * cascading render and which would flash the banner on every page load.
 * ------------------------------------------------------------------ */

type Listener = () => void;

const listeners = new Set<Listener>();

let snapshot: ConsentState | null = null;
let initialised = false;

function ensureInitialised(): void {
  if (initialised) return;
  snapshot = readConsent();
  initialised = true;
}

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeToConsent(listener: Listener): () => void {
  ensureInitialised();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Client snapshot. Reads storage once, then serves the cached value. */
export function getConsentSnapshot(): ConsentState | null {
  ensureInitialised();
  return snapshot;
}

/** Server snapshot. Always "no decision", so SSR output never claims consent. */
export function getConsentServerSnapshot(): null {
  return null;
}

export function saveConsent(decision: ConsentDecision): ConsentState {
  const state = writeConsent(decision);
  snapshot = state;
  emit();
  return state;
}

export function resetConsent(): void {
  clearConsent();
  snapshot = null;
  emit();
}
