"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Checkbox,
  DateInput,
  FormSection,
  NumberInput,
  Select,
  SlugInput,
  StringListInput,
  TextArea,
  TextInput,
} from "@/components/admin/ui/forms";
import { Panel } from "@/components/admin/ui/primitives";
import { humanizeEnum, type EntityDef, type FormField } from "@/lib/admin-registry";
import type { EntityActionState } from "@/app/actions/admin-entity-actions";
import { cn } from "@/lib/utils";

/**
 * Editor for every registry-driven admin section.
 *
 * The form is generated from `entity.fields`, so validation, layout and the
 * server action all read the same definition. Reference selects (country, parent
 * field, author) are resolved to concrete options on the server and passed in,
 * which keeps the browser from needing a Prisma query.
 */

export interface EntityFieldOptions {
  [fieldName: string]: { value: string; label: string; disabled?: boolean }[];
}

export interface EntityFormProps {
  entity: EntityDef;
  mode: "create" | "edit";
  /** Saved values, keyed by field name. Absent in create mode. */
  values: Record<string, unknown>;
  options: EntityFieldOptions;
  /** Public path prefix shown beside the slug input. */
  slugPrefix?: string;
  /** Field the slug follows until an admin edits it by hand. */
  slugSource: string;
  action: (prev: EntityActionState, formData: FormData) => Promise<EntityActionState>;
  /** Where the form posts to; kept server-side so the action stays the boundary. */
  deleteAction?: React.ReactNode;
}

const INITIAL: EntityActionState = {};

/** Fields are grouped by their `group`, with anything ungrouped first. */
function groupFields(fields: FormField[]) {
  const order: FormField["group"][] = [undefined, "content", "publishing", "seo"];
  const titles: Record<string, string> = {
    content: "Content",
    publishing: "Publishing",
    seo: "Search engines",
  };
  return order
    .map((group) => ({
      group,
      title: group ? titles[group] : "Details",
      fields: fields.filter((f) => (f.group ?? undefined) === group),
    }))
    .filter((section) => section.fields.length > 0);
}

function defaultValue(field: FormField, values: Record<string, unknown>): unknown {
  if (field.kind === "checkbox") return values[field.name] === true;
  return values[field.name] ?? undefined;
}

export function EntityForm({
  entity,
  mode,
  values,
  options,
  slugPrefix,
  slugSource,
  action,
  deleteAction,
}: EntityFormProps) {
  const [state, formAction, pending] = useActionState<EntityActionState, FormData>(action, INITIAL);
  const errors = state.fieldErrors ?? {};
  const sections = useMemo(() => groupFields(entity.fields), [entity.fields]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-5 pb-28" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800"
        >
          {state.error}
        </p>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900"
        >
          {Object.keys(errors).length} field{Object.keys(errors).length === 1 ? " needs" : "s need"}{" "}
          attention before this {entity.singular.toLowerCase()} can be saved. The problems are
          marked below.
        </p>
      ) : null}

      {sections.map((section) => (
        <Panel key={section.title}>
          <FormSection title={section.title} columns={section.title === "Details" ? 2 : 1}>
            {section.fields.map((field) => {
              const error = errors[field.name];
              const value = defaultValue(field, values);
              const span = field.full ? "sm:col-span-2" : undefined;

              if (field.kind === "checkbox") {
                return (
                  <div key={field.name} className={cn(span, "sm:pt-6")}>
                    <Checkbox
                      label={field.label}
                      name={field.name}
                      hint={field.hint}
                      defaultChecked={value === true}
                    />
                    {error ? (
                      <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>
                    ) : null}
                  </div>
                );
              }

              if (field.kind === "slug") {
                return (
                  <div key={field.name} className={span}>
                    <SlugInput
                      name={field.name}
                      defaultValue={typeof value === "string" ? value : ""}
                      sourceName={slugSource}
                      hint={field.hint}
                      error={error}
                      prefix={slugPrefix}
                      label={field.label}
                    />
                  </div>
                );
              }

              if (field.kind === "strings") {
                return (
                  <div key={field.name} className={span}>
                    <StringListInput
                      label={field.label}
                      name={field.name}
                      hint={field.hint}
                      error={error}
                      rows={field.rows ?? 4}
                      defaultValues={Array.isArray(value) ? (value as string[]) : []}
                    />
                  </div>
                );
              }

              if (field.kind === "select") {
                const list = options[field.name] ?? (field.options ?? []).map((o) => ({ value: o, label: humanizeEnum(o) }));
                return (
                  <div key={field.name} className={span}>
                    <Select
                      label={field.label}
                      name={field.name}
                      hint={field.hint}
                      error={error}
                      required={field.required}
                      placeholder={field.required ? undefined : "Not set"}
                      defaultValue={typeof value === "string" ? value : ""}
                      options={list}
                    />
                  </div>
                );
              }

              if (field.kind === "textarea") {
                return (
                  <div key={field.name} className={span}>
                    <TextArea
                      label={field.label}
                      name={field.name}
                      hint={field.hint}
                      error={error}
                      required={field.required}
                      rows={field.rows ?? 4}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      defaultValue={typeof value === "string" ? value : ""}
                    />
                  </div>
                );
              }

              if (field.kind === "number") {
                return (
                  <NumberInput
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    hint={field.hint}
                    error={error}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                    defaultValue={typeof value === "number" ? value : null}
                    className={span}
                  />
                );
              }

              if (field.kind === "date") {
                return (
                  <DateInput
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    hint={field.hint}
                    error={error}
                    required={field.required}
                    defaultValue={
                      typeof value === "string"
                        ? value
                        : value instanceof Date
                          ? value
                          : null
                    }
                    className={span}
                  />
                );
              }

              return (
                <TextInput
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  hint={field.hint}
                  error={error}
                  required={field.required}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  type={
                    field.kind === "email"
                      ? "email"
                      : field.kind === "password"
                        ? "password"
                        : field.kind === "url"
                          ? "url"
                          : "text"
                  }
                  defaultValue={
                    value == null ? "" : typeof value === "string" || typeof value === "number" ? value : ""
                  }
                  className={span}
                />
              );
            })}
          </FormSection>
        </Panel>
      ))}

      {/* Sticky save bar: a long editor never hides its primary action. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <Link
            href={`/admin/${entity.key}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to {entity.label.toLowerCase()}
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {deleteAction}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {pending
                ? "Saving"
                : mode === "create"
                  ? `Create ${entity.singular.toLowerCase()}`
                  : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
