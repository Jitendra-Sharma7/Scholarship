"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";

import {
  Checkbox,
  FormSection,
  NumberInput,
  TextArea,
  TextInput,
} from "@/components/admin/ui/forms";
import { Panel } from "@/components/admin/ui/primitives";
import { createIntakeAction, updateIntakeAction } from "@/app/actions/intake-actions";

interface IntakeFormState {
  error?: string;
}

interface IntakeData {
  id: string;
  name: string;
  slug: string;
  startMonth: number;
  startYear: number;
  endMonth?: number | null;
  endYear?: number | null;
  isActive: boolean;
  sortOrder: number;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const INITIAL_STATE: IntakeFormState = {};

export function IntakeForm({ mode, intake }: { mode: "create" | "edit"; intake?: IntakeData }) {
  const isEdit = mode === "edit" && Boolean(intake);
  const record = intake;

  const action = isEdit ? updateIntakeAction.bind(null, record!.id) : createIntakeAction;
  const [state, formAction, pending] = useActionState<IntakeFormState, FormData>(action, INITIAL_STATE);

  const error = state.error;

  return (
    <form action={formAction} className="pb-24" noValidate>
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-5">
        <Panel>
          <FormSection title="Basic Information" columns={2}>
            <TextInput
              label="Name"
              name="name"
              required
              defaultValue={record?.name ?? ""}
              placeholder="e.g. September 2027"
              maxLength={100}
            />

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Start Month (1-12)"
                name="startMonth"
                defaultValue={record?.startMonth ?? 9}
                min={1}
                max={12}
              />
              <NumberInput
                label="Start Year"
                name="startYear"
                defaultValue={record?.startYear ?? new Date().getFullYear()}
                min={2020}
                max={2035}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="End Month (1-12) – optional"
                name="endMonth"
                defaultValue={record?.endMonth ?? null}
                min={1}
                max={12}
              />
              <NumberInput
                label="End Year – optional"
                name="endYear"
                defaultValue={record?.endYear ?? null}
                min={2020}
                max={2035}
              />
            </div>

            <TextArea
              label="Description"
              name="description"
              rows={3}
              defaultValue={record?.description ?? ""}
              placeholder="Optional description of this intake period"
            />
          </FormSection>
        </Panel>

        <Panel>
          <FormSection title="Settings" columns={2}>
            <div className="flex items-end">
              <Checkbox
                label="Active"
                name="isActive"
                defaultChecked={record?.isActive ?? true}
                hint="Inactive intakes are hidden from filters"
              />
            </div>

            <NumberInput
              label="Sort Order"
              name="sortOrder"
              defaultValue={record?.sortOrder ?? null}
              hint="Lower numbers appear first in lists"
            />
          </FormSection>
        </Panel>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
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
            {isEdit ? "Save changes" : "Create intake"}
          </button>

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/admin/intakes"
              className="rounded-lg px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}