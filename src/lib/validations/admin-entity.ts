import { z } from "zod";

import type { EntityDef, FieldKind, FormField } from "@/lib/admin-registry";

/** Per-kind shape checks shared by the optional and required branches. */
function kindOk(kind: FieldKind, value: string): boolean {
  if (kind === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (kind === "url") return /^(https?:\/\/[^\s]+|\/[^\s]*)$/.test(value);
  return true;
}

function kindMessage(kind: FieldKind): string {
  if (kind === "email") return "Enter a valid email address";
  if (kind === "url") return "Enter a valid URL or a path starting with /";
  return "Enter a valid value";
}

/**
 * Builds a Zod schema from an entity's field descriptors.
 *
 * Generating the schema from the registry means the form, the server validation,
 * and the table can never disagree about which fields an entity has. The same
 * schema runs in the browser for inline errors and again on the server, so a
 * hand-crafted request cannot bypass it.
 */

function schemaForField(field: FormField): z.ZodTypeAny {
  const label = field.label;

  switch (field.kind) {
    case "text":
    case "email":
    case "url":
    case "password": {
      if (field.required) {
        return z
          .string()
          .trim()
          .min(1, `${label} is required`)
          .max(field.maxLength ?? (field.kind === "text" ? 300 : 2000))
          .refine((v) => kindOk(field.kind, v), kindMessage(field.kind));
      }

      // An empty input is stored as NULL rather than "" so `IS NULL` queries
      // in the public data layer keep matching untouched rows.
      const trimmed = z
        .string()
        .trim()
        .max(field.maxLength ?? (field.kind === "text" ? 300 : 2000))
        .transform((v) => (v === "" ? null : v))
        .nullable()
        .optional();

      return trimmed.refine(
        (v) => (v == null ? true : kindOk(field.kind, v)),
        kindMessage(field.kind)
      );
    }

    case "textarea":
      if (field.required) {
        return z.string().trim().min(1, `${label} is required`).max(field.maxLength ?? 20000);
      }
      return z
        .string()
        .trim()
        .max(field.maxLength ?? 20000)
        .transform((v) => (v === "" ? null : v))
        .nullable()
        .optional();

    case "number": {
      const base = z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .transform((value) => {
          if (value === null || value === undefined || value === "") return null;
          const n = typeof value === "number" ? value : Number(value);
          return Number.isFinite(n) ? n : null;
        });
      if (field.required) {
        return z.union([z.string(), z.number()]).transform((v) => Number(v));
      }
      return base.refine(
        (v) => v == null || (field.min === undefined || v >= field.min) && (field.max === undefined || v <= field.max),
        field.min !== undefined && field.max !== undefined
          ? `Enter a value between ${field.min} and ${field.max}`
          : field.min !== undefined
            ? `Enter a value of at least ${field.min}`
            : `Enter a value of at most ${field.max}`
      );
    }

    case "select": {
      const allowed = field.options ?? [];
      if (field.required) {
        return z
          .string()
          .min(1, `${label} is required`)
          .refine((v) => allowed.length === 0 || allowed.includes(v), {
            message: `Choose a valid ${label.toLowerCase()}`,
          });
      }
      return z
        .string()
        .optional()
        .transform((v) => (v === "" ? null : v))
        .nullable()
        .refine((v) => v == null || allowed.length === 0 || allowed.includes(v), {
          message: `Choose a valid ${label.toLowerCase()}`,
        });
    }

    case "checkbox":
      return z.coerce.boolean().default(false);

    case "date":
      return z
        .string()
        .trim()
        .optional()
        .refine(
          (v) => v === undefined || v === "" || !Number.isNaN(new Date(v).getTime()),
          "Enter a valid date"
        )
        .transform((v) => (v === undefined || v === "" ? null : new Date(v)))
        .nullable();

    case "strings":
      return z
        .string()
        .optional()
        .transform((value) =>
          (value ?? "")
            .split("\n")
            .map((line) => line.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean)
        )
        .pipe(z.array(z.string().max(300)).max(300));

    case "slug":
      return z
        .string()
        .trim()
        .max(90)
        .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and hyphens only")
        .optional()
        .or(z.literal(""));

    default:
      return z.unknown().optional();
  }
}

/** Extra rules that cannot be expressed field-by-field. */
function refineEntity(entity: EntityDef, data: Record<string, unknown>, ctx: z.RefinementCtx) {
  // A country is reachable by its two-letter code in several places on the site,
  // so an obviously wrong code would silently break those routes.
  if (entity.model === "country" && typeof data.code === "string" && data.code.length !== 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["code"],
      message: "Use the two-letter ISO code, for example GB",
    });
  }

  // Email is the identity key for sign-in, so store one canonical spelling.
  if (entity.model === "user" && typeof data.email === "string") {
    data.email = data.email.trim().toLowerCase();
  }

  // A suspension with no stated reason cannot be reviewed or appealed.
  if (entity.model === "user" && data.suspended === true && !String(data.suspendedReason ?? "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["suspendedReason"],
      message: "Give a reason when suspending an account",
    });
  }

  // A field cannot be its own parent, which would make the tree unrenderable.
  if (entity.model === "field" && data.parentId && data.id && data.parentId === data.id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentId"],
      message: "A field cannot be its own parent",
    });
  }
}

export function buildEntitySchema(entity: EntityDef) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of entity.fields) shape[field.name] = schemaForField(field);

  return z
    .object(shape)
    .superRefine((data, ctx) => refineEntity(entity, data as Record<string, unknown>, ctx));
}

/** Flattens Zod issues into `{ field: message }` for inline form errors. */
export function entityFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
