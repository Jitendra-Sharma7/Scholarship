import { getSiteBranding } from "@/lib/site-branding-server";
import { ContactForm } from "./ContactForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact Us - Submit a Scholarship or Ask a Question",
  description:
    "Get in touch with Global Scholarship Hub. Submit a scholarship for inclusion, ask a question about a listing, or discuss advertising and partnerships.",
  path: "/contact",
});

/**
 * The contact address is read from settings here, so changing
 * `site.contactEmail` updates this page as well as the footer, instead of the
 * two drifting apart with a hard-coded address in each.
 */
export default async function ContactPage() {
  const { contactEmail } = await getSiteBranding();
  return <ContactForm contactEmail={contactEmail} />;
}
