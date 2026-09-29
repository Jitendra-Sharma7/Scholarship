import { z } from "zod";
import type { SettingDef } from "@/lib/settings/definitions";

/**
 * The per-key validation schemas for the settings an admin can edit.
 *
 * The definitions themselves - the keys, labels, ranges and defaults - live in
 * `lib/settings/definitions.ts`, which imports nothing. The settings form is a
 * client component, and this module is not: keeping zod on this side means a
 * browser never downloads it to render the form.
 */

/** Schema for one key, or `null` for a key the site does not recognise. */
export function schemaForSetting(def: SettingDef): z.ZodTypeAny {
  switch (def.kind) {
    case "number": {
      const numeric = z
        .string()
        .trim()
        .min(1, `${def.label} is required`)
        .transform((v) => Number(v))
        .refine((n) => Number.isFinite(n), "Enter a number");
      if (def.min === undefined && def.max === undefined) return numeric;
      return numeric.refine(
        (n) => (def.min === undefined || n >= def.min) && (def.max === undefined || n <= def.max),
        `Enter a value between ${def.min} and ${def.max}`
      );
    }
    case "boolean":
      return z.coerce.boolean().default(false);
    case "email":
      return z
        .string()
        .trim()
        .min(3, `${def.label} is required`)
        .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address");
    default:
      return z
        .string()
        .trim()
        .min(1, `${def.label} is required`)
        .max(500, "Keep this under 500 characters");
  }
}
