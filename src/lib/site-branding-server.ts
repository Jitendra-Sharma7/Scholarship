import { getSettingString } from "@/lib/settings";
import {
  SITE_BRANDING_FALLBACK,
  isValidContactEmail,
  type SiteBranding,
} from "@/lib/site-branding";

/**
 * Server-side site identity reader.
 *
 * Kept apart from `lib/site-branding` because that module is imported by client
 * components for its types and fallback values; putting the database read
 * beside them would pull the settings layer - and Prisma - into the browser
 * bundle.
 *
 * The root layout calls this on every page, so a database that is briefly
 * unreachable takes the whole site down with a 500 - including pages that need
 * no data. An unreachable read is therefore handled the same way as an invalid
 * value and returns the fallback. The warning is loud because a silent
 * contact-address swap goes unnoticed until a support mail bounces.
 */
export async function getSiteBranding(): Promise<SiteBranding> {
  let contactEmail: string;
  let tagline: string;

  try {
    [contactEmail, tagline] = await Promise.all([
      getSettingString("site.contactEmail", SITE_BRANDING_FALLBACK.contactEmail),
      getSettingString("site.tagline", SITE_BRANDING_FALLBACK.tagline),
    ]);
  } catch (error) {
    console.warn(
      "[branding] could not read site settings; falling back to the default contact " +
        "address and tagline. Check DATABASE_URL.",
      error instanceof Error ? error.message : error
    );
    return {
      contactEmail: SITE_BRANDING_FALLBACK.contactEmail,
      tagline: SITE_BRANDING_FALLBACK.tagline,
    };
  }

  return {
    contactEmail: isValidContactEmail(contactEmail) ? contactEmail : SITE_BRANDING_FALLBACK.contactEmail,
    tagline: tagline.trim() || SITE_BRANDING_FALLBACK.tagline,
  };
}

export { SITE_BRANDING_FALLBACK };
export type { SiteBranding };
