"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "react-hot-toast";

import { Panel } from "@/components/admin/ui/primitives";
import { TextArea, TextInput } from "@/components/admin/ui/forms";
import { NumberInput } from "@/components/admin/ui/forms";
import { resetSetting, saveSettings } from "@/app/actions/settings-actions";
import { SETTING_DEFS, type SettingDef, type SettingsActionState } from "@/lib/settings/definitions";

/**
 * Site settings form.
 *
 * Built from the settings registry rather than a hand-written list, so a setting
 * cannot exist in the database without a label, a description and a stated
 * effect - and, more importantly, cannot exist without code that reads it.
 */

const INITIAL: SettingsActionState = {};

/** One control per kind, so the form stays declarative. */
function SettingField({
  def,
  stored,
  error,
}: {
  def: SettingDef;
  stored: unknown;
  error?: string;
}) {
  if (def.kind === "number") {
    return (
      <NumberInput
        label={def.label}
        name={def.key}
        hint={def.hint}
        error={error}
        min={def.min}
        max={def.max}
        step={1}
        defaultValue={
          typeof stored === "number" ? stored : typeof def.default === "number" ? def.default : null
        }
      />
    );
  }

  if (def.kind === "boolean") {
    return (
      <label className="flex items-start gap-2.5">
        <input type="hidden" name={def.key} value="" />
        <input
          type="checkbox"
          name={def.key}
          value="true"
          defaultChecked={stored === undefined ? Boolean(def.default) : stored === true}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
        />
        <span className="text-xs font-semibold text-slate-700">{def.label}</span>
      </label>
    );
  }

  const value = stored == null ? String(def.default) : String(stored);
  const isLong = value.length > 80 || def.key === "site.tagline";

  return isLong ? (
    <TextArea
      label={def.label}
      name={def.key}
      rows={3}
      error={error}
      defaultValue={value}
      hint={def.hint}
    />
  ) : (
    <TextInput
      label={def.label}
      name={def.key}
      type={def.kind === "email" ? "email" : "text"}
      error={error}
      defaultValue={value}
      hint={def.hint}
    />
  );
}

export function SettingsForm({ stored }: { stored: Record<string, unknown> }) {
  const [state, formAction, pending] = useActionState(saveSettings, INITIAL);
  const [resetting, startReset] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state.saved) toast.success("Settings saved. The public site has been revalidated.");
    if (state.error) toast.error(state.error);
  }, [state.saved, state.error]);

  const groups = SETTING_DEFS.reduce<Record<string, SettingDef[]>>((acc, def) => {
    (acc[def.group] ??= []).push(def);
    return acc;
  }, {});

  return (
    <form action={formAction} noValidate className="space-y-5 pb-24">
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800"
        >
          {state.error}
        </p>
      ) : null}
      {state.saved ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Settings saved.
        </p>
      ) : null}

      {Object.entries(groups).map(([group, defs]) => (
        <Panel key={group}>
          <h2 className="mb-1 text-sm font-semibold text-slate-900">{group}</h2>
          <div className="space-y-5">
            {defs.map((def) => (
              <div key={def.key} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <p className="mb-2.5 max-w-2xl text-xs leading-relaxed text-slate-600">
                  {def.description}
                </p>

                <div className="max-w-xl">
                  <SettingField
                    def={def}
                    stored={stored[def.key]}
                    error={state.fieldErrors?.[def.key]}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                    {def.key}
                  </code>
                  <span className="text-[11px] text-slate-500">Affects: {def.usedBy}</span>
                  {stored[def.key] === undefined ? (
                    <span className="text-[11px] text-slate-400">
                      Using the default ({String(def.default)})
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={resetting}
                      onClick={() =>
                        startReset(async () => {
                          const result = await resetSetting(def.key);
                          if (result?.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success(`"${def.key}" reset to its default.`);
                          router.refresh();
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      Reset to default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
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
            {pending ? "Saving" : "Save settings"}
          </button>
          <p className="text-xs text-slate-500">
            Saving rebuilds the cached public pages, because these values are read while they render.
          </p>
        </div>
      </div>
    </form>
  );
}
