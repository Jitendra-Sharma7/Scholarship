import { getPublicCountryOptions, getPublicFields } from "@/lib/data/public";
import { ProfileForm } from "./ProfileForm";

/**
 * Server entry point. Options are read from published records here and handed to
 * the form, so the browser never fetches them. Only the four fields the picker
 * renders are passed down; the full record carries a description and visa notes
 * per country that this form never shows.
 */
export default async function ProfilePage() {
  const [countries, fields] = await Promise.all([
    getPublicCountryOptions(),
    getPublicFields(),
  ]);

  return <ProfileForm countries={countries} fields={fields} />;
}
