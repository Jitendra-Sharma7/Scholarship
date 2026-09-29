"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable admin form controls.
 *
 * Every control is uncontrolled-friendly: the name attribute is what the server
 * action reads, so the same markup works inside a plain `<form>` without wiring
 * each field to React state. Only the genuinely interactive helpers
 * (`StringListInput`, `SlugInput`, `DeadlineStatusPreview`) hold state.
 */

const CONTROL_BASE =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const CONTROL_OK = "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20";
const CONTROL_ERR = "border-red-400 focus:border-red-500 focus:ring-red-500/20";

function controlClass(invalid: boolean) {
  return cn(CONTROL_BASE, invalid ? CONTROL_ERR : CONTROL_OK);
}

// --- Field wrapper ---------------------------------------------------------

/**
 * Wraps a control with its label, hint, and validation message, and wires up the
 * `aria-describedby` / `aria-invalid` pair so screen readers announce problems.
 */
export function Field({
  label,
  name,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (props: {
    id: string;
    name: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
    className: string;
  }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        name,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
        className: controlClass(Boolean(error)),
      })}

      {hint ? (
        <p id={`${id}-hint`} className="text-[11px] leading-snug text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-[11px] font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// --- Text inputs -----------------------------------------------------------

export function TextInput({
  label,
  name,
  defaultValue,
  hint,
  error,
  required,
  placeholder,
  type = "text",
  readOnly,
  className,
  autoComplete,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(p) => (
        <input
          {...p}
          type={type}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          readOnly={readOnly}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={cn(p.className, readOnly && "bg-slate-50 text-slate-600")}
        />
      )}
    </Field>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  hint,
  error,
  required,
  rows = 4,
  placeholder,
  maxLength,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(p) => (
        <textarea
          {...p}
          rows={rows}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(p.className, "resize-y leading-relaxed")}
        />
      )}
    </Field>
  );
}

export function NumberInput({
  label,
  name,
  defaultValue,
  hint,
  error,
  min,
  max,
  step,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: number | null;
  hint?: ReactNode;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} name={name} hint={hint} error={error} className={className}>
      {(p) => (
        <input
          {...p}
          type="number"
          inputMode="decimal"
          defaultValue={defaultValue ?? ""}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}

// --- Date ------------------------------------------------------------------

function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  // `slice(0,10)` on the local-time ISO string, not the UTC one, so the date an
  // admin typed is the date we store.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function DateInput({
  label,
  name,
  defaultValue,
  hint,
  error,
  required,
  className,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string | Date | null;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the raw `YYYY-MM-DD` value, for live previews. */
  onChange?: (value: string) => void;
}) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(p) => (
        <input
          {...p}
          type="date"
          defaultValue={toDateInputValue(defaultValue)}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
      )}
    </Field>
  );
}

// --- Select ----------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  hint,
  error,
  required,
  placeholder,
  className,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: SelectOption[];
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(p) => (
        <select
          {...p}
          defaultValue={defaultValue ?? ""}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        >
          {placeholder ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

// --- Checkbox / toggle -----------------------------------------------------

export function Checkbox({
  label,
  name,
  defaultChecked,
  hint,
  className,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      {/*
        Sentinel so an unticked box still submits a value. Without it, clearing a
        checkbox that defaults to on (such as "include in sitemap") is
        indistinguishable from the field never being rendered, and the old value
        silently survives the save.
      */}
      <input type="hidden" name={name} value="" />
      <input
        id={id}
        name={name}
        type="checkbox"
        value="true"
        defaultChecked={defaultChecked}
        aria-describedby={hintId}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="mt-0.5 text-[11px] leading-snug text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A checkbox group that serialises to repeated form fields.
 *
 * Post-processing in the server actions collapses these into a single value, so
 * the action signature stays uniform whether the input is a text field or a
 * list. The hidden sentinel keeps "nothing selected" distinguishable from
 * "field absent", which matters for arrays that must be cleared.
 */
export function CheckboxGroup({
  legend,
  name,
  options,
  defaultValues = [],
  hint,
  columns = 2,
}: {
  legend: string;
  name: string;
  options: SelectOption[];
  defaultValues?: string[];
  hint?: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  const groupId = useId();
  const selected = useMemo(() => new Set(defaultValues.map(String)), [defaultValues]);

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-slate-700">{legend}</legend>
      <div
        className={cn(
          "grid gap-2",
          columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : ""
        )}
      >
        {options.map((opt, index) => {
          // Derived from the single group id plus the index: hooks cannot be
          // called inside the map, and the options list is stable per render.
          const id = `${groupId}-${index}`;
          return (
            <div key={opt.value} className="flex items-center gap-2">
              <input
                id={id}
                name={name}
                type="checkbox"
                value={opt.value}
                defaultChecked={selected.has(opt.value)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
              />
              <label htmlFor={id} className="text-xs text-slate-700">
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
      {/* Clears the group when every box is unticked. */}
      <input type="hidden" name={name} value="" />
      {hint ? <p className="text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </fieldset>
  );
}

// --- String list (one per line) -------------------------------------------

/**
 * Multi-value text input backed by a newline-separated textarea.
 *
 * A textarea is the right control here rather than a tag widget: admins paste
 * lists of universities, documents, or countries straight from a source, and
 * plain text stays reviewable and accessible.
 */
export function StringListInput({
  label,
  name,
  defaultValues = [],
  hint,
  error,
  rows = 4,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  defaultValues?: string[];
  hint?: ReactNode;
  error?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field
      label={label}
      name={name}
      hint={
        hint ?? (
          <>
            One per line. Bullet points (<code className="rounded bg-slate-100 px-1">-</code>) are
            stripped automatically.
          </>
        )
      }
      error={error}
      className={className}
    >
      {(p) => (
        <textarea
          {...p}
          rows={rows}
          defaultValue={defaultValues.join("\n")}
          placeholder={placeholder ?? "One value per line"}
          className={cn(p.className, "resize-y font-mono text-[13px] leading-relaxed")}
        />
      )}
    </Field>
  );
}

// --- Slug ------------------------------------------------------------------

function slugifyLocal(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/**
 * Slug field that mirrors the title until the admin edits the slug by hand.
 *
 * Auto-slugging is a convenience, not a rule: once a record is published its
 * slug is a permanent URL, so touching the slug here is always deliberate.
 */
export function SlugInput({
  name,
  defaultValue,
  sourceName,
  error,
  hint,
  disabled,
  prefix = "/scholarships/",
  label = "URL slug",
}: {
  name: string;
  defaultValue?: string | null;
  /** Name of the title input the slug should follow until it is overridden. */
  sourceName: string;
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  /** Public path the slug appears under, shown as a read-only prefix. */
  prefix?: string;
  label?: string;
}) {
  const id = useId();
  const initial = defaultValue ?? "";
  const [manual, setManual] = useState(initial.length > 0);
  const [value, setValue] = useState(initial);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <span className="hidden shrink-0 items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-2.5 font-mono text-[13px] text-slate-500 sm:flex">
          {prefix}
        </span>
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setManual(true);
            setValue(slugifyLocal(e.target.value));
          }}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-lg border px-3 py-2 font-mono text-[13px] text-slate-900 outline-none focus:ring-2 disabled:bg-slate-50",
            disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "",
            error ? "border-red-400 focus:ring-red-500/20" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
          )}
        />
        {!manual ? (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementsByName(sourceName)[0] as HTMLInputElement | undefined;
              if (el) setValue(slugifyLocal(el.value));
            }}
            className="shrink-0 rounded-lg border border-slate-300 px-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            From title
          </button>
        ) : null}
      </div>
      <p className="text-[11px] leading-snug text-slate-500">
        {hint ?? (
          <>
            Leave as generated. Changing a published slug creates a permanent redirect from the old
            URL, so existing links keep working.
          </>
        )}
      </p>
      {error ? <p className="text-[11px] font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

// --- Layout helpers --------------------------------------------------------

/** Groups related fields under a titled sub-heading. */
export function FormSection({
  title,
  description,
  children,
  columns = 2,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div
        className={cn(
          "grid gap-4",
          columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : ""
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Character counter that warns before a SEO field is silently truncated. */
export function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.trim().length;
  const tone = len > max ? "text-red-600" : len > max * 0.9 ? "text-amber-600" : "text-slate-400";
  return (
    <span className={cn("text-[11px] tabular-nums", tone)}>
      {len}/{max}
    </span>
  );
}
