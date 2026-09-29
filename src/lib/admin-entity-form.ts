import { getEntity, type EntityDef } from "@/lib/admin-registry";

/**
 * Helpers shared by the create and edit routes.
 *
 * Both pages need the same three things: a blank value set for a new record, the
 * value set extracted from a saved record, and the public path a slug sits under.
 * Keeping them here means the form can never disagree between the two modes.
 */

/** Public path a record's slug appears under, shown beside the slug input. */
const SLUG_PREFIX: Record<string, string> = {
  blog: "/blog/",
  resources: "/resources/",
};

export function slugPrefixFor(entityKey: string): string | undefined {
  return SLUG_PREFIX[entityKey];
}

/** The field a slug follows until an admin edits it by hand. */
export function slugSourceFor(entity: EntityDef): string {
  const title = entity.fields.find(
    (f) => f.name === "title" || f.name === "name" || f.name === "originalName"
  );
  return title?.name ?? "name";
}

/** Blank form values for a new record, matching the field kinds. */
export function blankEntityValues(entity: EntityDef): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of entity.fields) {
    switch (field.kind) {
      case "checkbox":
        values[field.name] = field.name === "includeInSitemap";
        break;
      case "strings":
        values[field.name] = [];
        break;
      case "number":
      case "date":
        values[field.name] = null;
        break;
      case "select":
        values[field.name] = field.name === "publishStatus" ? "DRAFT" : null;
        break;
      default:
        values[field.name] = "";
    }
  }

  return values;
}

/**
 * Extracts the saved record's values for the form's fields.
 *
 * Only fields the registry lists are copied, so the form never renders a
 * database column that is not part of the content type's definition.
 */
export function entityValuesFromRecord(
  entity: EntityDef,
  record: Record<string, unknown>
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of entity.fields) {
    const raw = record[field.name];

    if (field.kind === "checkbox") {
      values[field.name] = raw === true;
    } else if (field.kind === "strings") {
      values[field.name] = Array.isArray(raw) ? raw : [];
    } else {
      values[field.name] = raw ?? null;
    }
  }

  return values;
}

/** True when the record is in the bin, so the editor can say so. */
export function isTrashed(record: Record<string, unknown>): boolean {
  return record.deletedAt != null;
}

export { getEntity };
