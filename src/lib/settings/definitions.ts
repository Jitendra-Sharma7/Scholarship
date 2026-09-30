/**
 * The settings this site actually honours.
 *
 * A settings table is easy to fill with keys no code reads, which looks
 * configurable while changing nothing. Every key here is consumed somewhere in
 * `src`, and the list is the contract: adding a key means adding the code that
 * uses it in the same change.
 *
 * This file holds no zod schema, on purpose. The settings form is a client
 * component, and it needs the definitions; importing them from the module that
 * builds the schemas shipped zod to the browser to render three form fields.
 */

export type SettingKind = "number" | "text" | "email" | "boolean";

export interface SettingDef {
  key: string;
  label: string;
  description: string;
  group: string;
  kind: SettingKind;
  default: string | number | boolean;
  min?: number;
  max?: number;
  /** Extra guidance shown under the control. */
  hint?: string;
  /** Where the value is read, shown so an admin knows what a change affects. */
  usedBy: string;
}

export const SETTING_DEFS: SettingDef[] = [
  {
    key: "scholarships.closingSoonDays",
    label: "Closing soon window",
    description:
      "How many days before the deadline a scholarship is shown as closing soon, and included in the closing-soon listing.",
    group: "Scholarships",
    kind: "number",
    default: 14,
    min: 1,
    max: 90,
    hint: "Days. Below 7 is aggressive; above 30 stops being a useful warning.",
    usedBy: "Deadline status on cards and detail pages, and the closing-soon filters",
  },
  {
    key: "site.contactEmail",
    label: "Contact email",
    description: "The support address shown in the footer. Use an address you actually read.",
    group: "Site",
    kind: "email",
    default: "jitendra.route2uni@gmail.com",
    hint: "Shown in the footer as a mailto link. Use an address that is monitored.",
    usedBy: "Site footer",
  },
  {
    key: "site.tagline",
    label: "Footer tagline",
    description: "The short description under the site name in the footer.",
    group: "Site",
    kind: "text",
    default:
      "Helping students worldwide discover, compare, and apply for scholarships, grants, fellowships, and financial-aid opportunities.",
    usedBy: "Site footer",
  },
];

export const SETTING_KEYS = new Set(SETTING_DEFS.map((s) => s.key));

export function getSettingDef(key: string): SettingDef | null {
  return SETTING_DEFS.find((s) => s.key === key) ?? null;
}

export interface SettingsActionState {
  error?: string;
  saved?: boolean;
  fieldErrors?: Record<string, string>;
}
