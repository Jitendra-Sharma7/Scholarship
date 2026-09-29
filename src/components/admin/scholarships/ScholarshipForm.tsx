"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  CharCount,
  Checkbox,
  CheckboxGroup,
  DateInput,
  FormSection,
  NumberInput,
  Select,
  SlugInput,
  StringListInput,
  TextArea,
  TextInput,
} from "@/components/admin/ui/forms";
import { DeadlineBadge, Panel } from "@/components/admin/ui/primitives";import {
  createScholarship,
  setScholarshipStatus,
  trashScholarship,
  updateScholarship,
  type ScholarshipActionState,
} from "@/app/actions/scholarship-actions";
import {
  DEADLINE_STATUSES,
  FUNDING_TYPES,
  FUNDING_TYPE_LABELS,
  PUBLISH_STATUSES,
  SUGGESTED_DEGREE_LEVELS,
  STUDY_MODES,
  VERIFICATION_STATUSES,
  fromPrismaDeadlineStatus,
  fromPrismaFundingType,
  fromPrismaStudyMode,
  fromPrismaVerificationStatus,
} from "@/lib/enums";
// The pure evaluator, not `lib/deadline`, which reads settings from the
// database and would drag the Prisma client into the browser bundle.
import { evaluateDeadlineSync } from "@/lib/deadline-core";
import { formatDate } from "@/lib/utils";

/**
 * Scholarship editor.
 *
 * One form covers create and edit; the only differences are the defaults and
 * whether the slug and publish controls are available. Validation runs on the
 * server, and field-level errors are returned in `state.fieldErrors` rather than
 * thrown, so a failed save keeps everything the admin typed.
 */

const INITIAL_STATE: ScholarshipActionState = {};

export interface EditorReference {
  countries: { id: string; name: string; code: string }[];
  universities: { id: string; name: string; countryId: string | null }[];
  providers: { id: string; name: string }[];
  fields: { id: string; name: string; parentId: string | null }[];
}

type ScholarshipRecord = {
  id: string;
  title: string;
  shortTitle: string | null;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  providerId: string | null;
  universityId: string | null;
  countryId: string | null;
  city: string | null;
  region: string | null;
  providerContact: string | null;
  logo: string | null;
  coverImage: string | null;
  fundingType: string;
  isFullyFunded: boolean;
  fundingAmount: number | null;
  currency: string | null;
  monthlyStipend: number | null;
  annualStipend: number | null;
  tuitionCoverage: boolean;
  accommodationCoverage: boolean;
  travelAllowance: boolean;
  healthInsurance: boolean;
  visaSupport: boolean;
  researchFunding: boolean;
  otherBenefits: string | null;
  degreeLevels: string[];
  eligibleCountries: string[];
  nationalityRestrictions: string[];
  minGpa: number | null;
  minPercentage: number | null;
  ageRequirement: number | null;
  workExpReq: string | null;
  otherRequirements: string | null;
  numAwards: number | null;
  financialNeedReq: boolean;
  languageReqs: string[];
  otherTestReqs: string[];
  academicReqs: string[];
  selectionCriteria: string[];
  ieltsReq: number | null;
  toeflReq: number | null;
  greReq: number | null;
  gmatReq: number | null;
  studyMode: string | null;
  studyType: string | null;
  subField: string | null;
  duration: string | null;
  intake: string | null;
  openingDate: Date | null;
  deadline: Date | null;
  deadlineType: string | null;
  applicationFee: number | null;
  applicationMethod: string | null;
  documentsRequired: string[];
  applicationProcess: string[];
  publishStatus: string;
  featured: boolean;
  featuredOrder: number | null;
  featuredUntil: Date | null;
  deadlineStatusOverride: string | null;
  source: string;
  verificationStatus: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  canonicalUrl: string | null;
  ogImage: string | null;
  noindex: boolean;
  includeInSitemap: boolean;
  deletedAt: Date | null;
  updatedAt: Date;
};

export function ScholarshipForm({
  mode,
  scholarship,
  fieldIds,
  reference,
  canDelete = false,
}: {
  mode: "create" | "edit";
  scholarship?: ScholarshipRecord;
  fieldIds?: string[];
  reference: EditorReference;
  canDelete?: boolean;
}) {
  const isEdit = mode === "edit" && Boolean(scholarship);
  const record = scholarship;

  const action = isEdit ? updateScholarship.bind(null, record!.id) : createScholarship;
  const [state, formAction, pending] = useActionState<ScholarshipActionState, FormData>(
    action,
    INITIAL_STATE
  );

  const errors = state.fieldErrors ?? {};
  const generalError = state.error;
  const router = useRouter();

  /**
   * Enum selects submit the display string and the server action converts it
   * back with `toPrisma*`. The stored value is the Prisma enum name, so an
   * existing record's value must be mapped back to display here or the select
   * would show nothing selected.
   */
  const fundingValue = record ? fromPrismaFundingType(record.fundingType) : "";
  const verificationValue = record
    ? fromPrismaVerificationStatus(record.verificationStatus)
    : "Verification Needed";
  const studyModeValue = record?.studyMode ? (fromPrismaStudyMode(record.studyMode) ?? "") : "";
  const overrideValue = record?.deadlineStatusOverride
    ? fromPrismaDeadlineStatus(record.deadlineStatusOverride)
    : "";

  // Live deadline preview. Recomputed on every change so an admin sees the
  // public status update before saving, rather than after.
  const [deadline, setDeadline] = useState(() => toInputDate(record?.deadline));
  const [openingDate, setOpeningDate] = useState(() => toInputDate(record?.openingDate));
  const [override, setOverride] = useState(overrideValue);

  const preview = useMemo(
    () =>
      evaluateDeadlineSync({
        deadline: deadline ? new Date(`${deadline}T23:59:59`) : null,
        openingDate: openingDate ? new Date(openingDate) : null,
        override: override || null,
      }),
    [deadline, openingDate, override]
  );

  // The save bar is sticky so a long form never hides the primary action.
  const [seoTitle, setSeoTitle] = useState(record?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(record?.seoDescription ?? "");
  const [shortDescription, setShortDescription] = useState(record?.shortDescription ?? "");

  useEffect(() => {
    if (generalError) toast.error(generalError);
  }, [generalError]);
  const fieldOptions = useMemo(
    () => reference.fields.map((f) => ({ value: f.id, label: f.name })),
    [reference.fields]
  );

  return (
    <form action={formAction} className="pb-24" noValidate>
      {generalError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800"
        >
          {generalError}
        </p>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900"
        >
          {Object.keys(errors).length} field{Object.keys(errors).length === 1 ? " needs" : "s need"}{" "}
          attention before this scholarship can be saved. The problems are marked in red below.
        </p>
      ) : null}

      <div className="space-y-5">
        {/* --- Basics --- */}
        <Panel>
          <div className="space-y-4">
            <FormSection title="Basics" columns={1}>
              <TextInput
                label="Title"
                name="title"
                required
                defaultValue={record?.title ?? ""}
                error={errors.title}
                placeholder="e.g. Chevening Commonwealth Scholarship 2026"
                maxLength={300}
              />

              <TextInput
                label="Short title"
                name="shortTitle"
                defaultValue={record?.shortTitle ?? ""}
                error={errors.shortTitle}
                hint="Optional compact name for cards and search results."
              />

              <div>
                <SlugInput
                  name="slug"
                  sourceName="title"
                  defaultValue={record?.slug ?? ""}
                  error={errors.slug}
                  disabled={false}
                />
              </div>

              <div>
                <label
                  htmlFor="shortDescription"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Card summary
                </label>
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  rows={2}
                  maxLength={400}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  aria-invalid={Boolean(errors.shortDescription)}
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="text-[11px] leading-snug text-slate-500">
                    One or two sentences shown on listing cards and search results.
                  </p>
                  <CharCount value={shortDescription} max={400} />
                </div>
                {errors.shortDescription ? (
                  <p className="text-[11px] font-medium text-red-600">{errors.shortDescription}</p>
                ) : null}
              </div>

              <TextArea
                label="Full description"
                name="description"
                rows={8}
                defaultValue={record?.description ?? ""}
                error={errors.description}
                hint="Leave out funding promises and eligibility claims that are not confirmed in the source below."
              />
            </FormSection>
          </div>
        </Panel>

        {/* --- Funding --- */}
        <Panel>
          <FormSection
            title="Funding"
            description="Only record amounts the official source confirms. Leave a field blank rather than estimating it."
            columns={3}
          >
            <Select
              label="Funding type"
              name="fundingType"
              required
              defaultValue={fundingValue}
              options={FUNDING_TYPES.map((f) => ({ value: f, label: FUNDING_TYPE_LABELS[f] }))}
              placeholder="Select a funding type"
              error={errors.fundingType}
            />

            <NumberInput
              label="Total funding amount"
              name="fundingAmount"
              defaultValue={record?.fundingAmount ?? null}
              error={errors.fundingAmount}
              placeholder="e.g. 45000"
              step={0.01}
            />

            <TextInput
              label="Currency"
              name="currency"
              defaultValue={record?.currency ?? ""}
              error={errors.currency}
              placeholder="e.g. GBP"
              maxLength={20}
            />

            <NumberInput
              label="Monthly stipend"
              name="monthlyStipend"
              defaultValue={record?.monthlyStipend ?? null}
              error={errors.monthlyStipend}
              step={0.01}
            />

            <NumberInput
              label="Annual stipend"
              name="annualStipend"
              defaultValue={record?.annualStipend ?? null}
              error={errors.annualStipend}
              step={0.01}
            />

            <NumberInput
              label="Application fee"
              name="applicationFee"
              defaultValue={record?.applicationFee ?? null}
              error={errors.applicationFee}
              step={0.01}
              hint="Leave blank when there is no fee."
            />

            <div className="sm:col-span-3">
              <Checkbox
                label="Fully funded (everything, including living costs)"
                name="isFullyFunded"
                defaultChecked={record?.isFullyFunded ?? false}
                hint="Drives the Fully Funded filter and page. Only tick this when the source funds tuition and living costs in full."
              />
            </div>

            <div className="grid gap-2.5 sm:col-span-3 sm:grid-cols-2 lg:grid-cols-3">
              <Checkbox label="Tuition covered" name="tuitionCoverage" defaultChecked={record?.tuitionCoverage} />
              <Checkbox
                label="Accommodation covered"
                name="accommodationCoverage"
                defaultChecked={record?.accommodationCoverage}
              />
              <Checkbox label="Travel allowance" name="travelAllowance" defaultChecked={record?.travelAllowance} />
              <Checkbox label="Health insurance" name="healthInsurance" defaultChecked={record?.healthInsurance} />
              <Checkbox label="Visa support" name="visaSupport" defaultChecked={record?.visaSupport} />
              <Checkbox label="Research funding" name="researchFunding" defaultChecked={record?.researchFunding} />
            </div>

            <div className="sm:col-span-3">
              <TextArea
                label="Other benefits"
                name="otherBenefits"
                rows={3}
                defaultValue={record?.otherBenefits ?? ""}
                error={errors.otherBenefits}
              />
            </div>
          </FormSection>
        </Panel>

        {/* --- Deadline --- */}
        <Panel>
          <FormSection
            title="Application window"
            description="Deadline status is calculated from these dates, so it never needs updating by hand."
          >
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 sm:col-span-2">
              <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-blue-900">
                Visitors will see
                <DeadlineBadge status={preview.status} />
                {preview.status === "Expired" && !override ? (
                  <span className="text-blue-700">
                    because the deadline has passed or no date is set
                  </span>
                ) : null}
                {override ? (
                  <span className="text-blue-700">(pinned by an administrator)</span>
                ) : null}
              </p>
              {preview.daysRemaining > 0 && preview.daysRemaining <= 14 ? (
                <p className="mt-1 text-xs text-blue-800">
                  {preview.daysRemaining} day{preview.daysRemaining === 1 ? "" : "s"} remaining.
                </p>
              ) : null}
            </div>

            <DateInput
              label="Opening date"
              name="openingDate"
              defaultValue={record?.openingDate ?? null}
              error={errors.openingDate}
              hint="When applications open, if different from today."
              onChange={setOpeningDate}
            />
            <DateInput
              label="Deadline"
              name="deadline"
              required
              defaultValue={record?.deadline ?? null}
              error={errors.deadline}
              hint="The official closing date. Required so the public status is accurate."
              onChange={setDeadline}
            />

            <TextInput
              label="Deadline type"
              name="deadlineType"
              defaultValue={record?.deadlineType ?? ""}
              error={errors.deadlineType}
              placeholder="e.g. Rolling, Fixed, Varies"
            />

            <Select
              label="Status override"
              name="deadlineStatusOverride"
              defaultValue={overrideValue}
              options={DEADLINE_STATUSES.map((s) => ({ value: s, label: s }))}
              placeholder="Calculate automatically"
              error={errors.deadlineStatusOverride}
              hint="Use only when the official deadline changed after publication."
              onChange={setOverride}
            />

            <div className="sm:col-span-2">
              <TextInput
                label="Official application link"
                name="applicationUrl"
                type="url"
                defaultValue={record?.applicationUrl ?? ""}
                error={errors.applicationUrl}
                placeholder="https://..."
                hint="The link to the official application form. Leave blank rather than guessing."
              />
            </div>

            <TextInput
              label="Official website"
              name="officialUrl"
              type="url"
              defaultValue={record?.officialUrl ?? ""}
              error={errors.officialUrl}
              placeholder="https://..."
            />

            <TextInput
              label="Application method"
              name="applicationMethod"
              defaultValue={record?.applicationMethod ?? ""}
              error={errors.applicationMethod}
              placeholder="e.g. Online portal, embassy nomination"
            />

            <div className="sm:col-span-2">
              <StringListInput
                label="Documents required"
                name="documentsRequired"
                defaultValues={record?.documentsRequired ?? []}
                error={errors.documentsRequired}
                rows={5}
              />
            </div>

            <div className="sm:col-span-2">
              <StringListInput
                label="Application process"
                name="applicationProcess"
                defaultValues={record?.applicationProcess ?? []}
                error={errors.applicationProcess}
                rows={5}
                hint="One step per line, in order."
              />
            </div>
          </FormSection>
        </Panel>

        {/* --- Eligibility --- */}
        <Panel>
          <FormSection
            title="Eligibility"
            description="Copy these from the official source. An empty field means unstated, not unrestricted."
            columns={3}
          >
            <div className="sm:col-span-3">
              <label
                htmlFor="degreeLevels"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Degree levels
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_DEGREE_LEVELS.map((level) => {
                  const selected = (record?.degreeLevels ?? []).includes(level);
                  const id = `degree-${level.replace(/\s+/g, "-").toLowerCase()}`;                  return (
                    <span key={level}>
                      <input type="hidden" name="degreeLevels" value="" />
                      <label
                        htmlFor={id}
                        className={`inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? "border-blue-300 bg-blue-50 text-blue-800"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          id={id}
                          type="checkbox"
                          name="degreeLevels"
                          value={level}
                          defaultChecked={selected}
                          className="sr-only"
                        />
                        {level}
                      </label>
                    </span>
                  );
                })}
              </div>
              <input
                id="degreeLevels"
                name="degreeLevelsOther"
                defaultValue={(record?.degreeLevels ?? [])
                  .filter((d) => !(SUGGESTED_DEGREE_LEVELS as readonly string[]).includes(d))
                  .join(", ")}
                placeholder="Any other levels, comma separated (e.g. JD, MD)"
                aria-label="Other degree levels"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Standard levels are offered above; type anything else here.
              </p>
              {errors.degreeLevels ? (
                <p className="text-[11px] font-medium text-red-600">{errors.degreeLevels}</p>
              ) : null}
            </div>

            <NumberInput
              label="Minimum GPA"
              name="minGpa"
              defaultValue={record?.minGpa ?? null}
              error={errors.minGpa}
              step={0.01}
              hint="On the 4.0 scale used by the public matcher."
            />
            <NumberInput
              label="Minimum percentage"
              name="minPercentage"
              defaultValue={record?.minPercentage ?? null}
              error={errors.minPercentage}
              step={0.01}
            />
            <NumberInput
              label="Age limit"
              name="ageRequirement"
              defaultValue={record?.ageRequirement ?? null}
              error={errors.ageRequirement}
            />
            <NumberInput
              label="Number of awards"
              name="numAwards"
              defaultValue={record?.numAwards ?? null}
              error={errors.numAwards}
            />
            <NumberInput
              label="IELTS"
              name="ieltsReq"
              defaultValue={record?.ieltsReq ?? null}
              error={errors.ieltsReq}
              step={0.5}
            />
            <NumberInput
              label="TOEFL"
              name="toeflReq"
              defaultValue={record?.toeflReq ?? null}
              error={errors.toeflReq}
            />
            <NumberInput
              label="GRE"
              name="greReq"
              defaultValue={record?.greReq ?? null}
              error={errors.greReq}
            />
            <NumberInput
              label="GMAT"
              name="gmatReq"
              defaultValue={record?.gmatReq ?? null}
              error={errors.gmatReq}
            />
            <div className="sm:col-span-3">
              <Checkbox
                label="Financial need required"
                name="financialNeedReq"
                defaultChecked={record?.financialNeedReq}
              />
            </div>

            <div className="sm:col-span-3">
              <StringListInput
                label="Eligible countries"
                name="eligibleCountries"
                defaultValues={record?.eligibleCountries ?? []}
                error={errors.eligibleCountries}
                rows={3}
                hint="Country names, one per line. Blank means open to all nationalities."
              />
            </div>
            <div className="sm:col-span-3">
              <StringListInput
                label="Nationality restrictions"
                name="nationalityRestrictions"
                defaultValues={record?.nationalityRestrictions ?? []}
                error={errors.nationalityRestrictions}
                rows={3}
                hint="Nationals of these countries are excluded, where that is stated."
              />
            </div>
            <div className="sm:col-span-3">
              <StringListInput
                label="Language requirements"
                name="languageReqs"
                defaultValues={record?.languageReqs ?? []}
                error={errors.languageReqs}
                rows={2}
              />
            </div>
            <div className="sm:col-span-3">
              <StringListInput
                label="Other tests"
                name="otherTestReqs"
                defaultValues={record?.otherTestReqs ?? []}
                error={errors.otherTestReqs}
                rows={2}
              />
            </div>
            <div className="sm:col-span-3">
              <StringListInput
                label="Academic requirements"
                name="academicReqs"
                defaultValues={record?.academicReqs ?? []}
                error={errors.academicReqs}
                rows={3}
              />
            </div>
            <div className="sm:col-span-3">
              <StringListInput
                label="Selection criteria"
                name="selectionCriteria"
                defaultValues={record?.selectionCriteria ?? []}
                error={errors.selectionCriteria}
                rows={3}
              />
            </div>
            <div className="sm:col-span-2">
              <TextArea
                label="Work experience"
                name="workExpReq"
                rows={3}
                defaultValue={record?.workExpReq ?? ""}
                error={errors.workExpReq}
              />
            </div>
            <div className="sm:col-span-3">
              <TextArea
                label="Other requirements"
                name="otherRequirements"
                rows={4}
                defaultValue={record?.otherRequirements ?? ""}
                error={errors.otherRequirements}
              />
            </div>
          </FormSection>
        </Panel>

        {/* --- Study details --- */}
        <Panel>
          <FormSection title="Study details" columns={3}>
            <Select
              label="Study mode"
              name="studyMode"
              defaultValue={studyModeValue}
              options={STUDY_MODES.map((m) => ({ value: m, label: m }))}
              placeholder="Not specified"
              error={errors.studyMode}
            />
            <TextInput
              label="Study type"
              name="studyType"
              defaultValue={record?.studyType ?? ""}
              error={errors.studyType}
              placeholder="e.g. Full time"
            />
            <TextInput
              label="Sub-field"
              name="subField"
              defaultValue={record?.subField ?? ""}
              error={errors.subField}
            />
            <TextInput
              label="Duration"
              name="duration"
              defaultValue={record?.duration ?? ""}
              error={errors.duration}
              placeholder="e.g. 1 year"
            />
            <TextInput
              label="Intake"
              name="intake"
              defaultValue={record?.intake ?? ""}
              error={errors.intake}
              placeholder="e.g. September 2026"
            />
            <TextInput
              label="City"
              name="city"
              defaultValue={record?.city ?? ""}
              error={errors.city}
            />
            <TextInput
              label="Region"
              name="region"
              defaultValue={record?.region ?? ""}
              error={errors.region}
            />
            <TextInput
              label="Provider contact"
              name="providerContact"
              defaultValue={record?.providerContact ?? ""}
              error={errors.providerContact}
            />
          </FormSection>
        </Panel>

        {/* --- Organisation & location --- */}
        <Panel>
          <FormSection title="Organisation and location" columns={3}>
            <Select
              label="Country"
              name="countryId"
              defaultValue={record?.countryId ?? ""}
              options={reference.countries.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Not set"
              error={errors.countryId}
            />
            <Select
              label="University"
              name="universityId"
              defaultValue={record?.universityId ?? ""}
              options={reference.universities.map((u) => ({ value: u.id, label: u.name }))}
              placeholder="Not set"
              error={errors.universityId}
            />
            <Select
              label="Provider"
              name="providerId"
              defaultValue={record?.providerId ?? ""}
              options={reference.providers.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Not set"
              error={errors.providerId}
            />
            <TextInput
              label="Image URL"
              name="logo"
              defaultValue={record?.logo ?? ""}
              error={errors.logo}
              placeholder="https://..."
              hint="Optional. Leave blank when no verified logo exists."
            />
            <TextInput
              label="Cover image URL"
              name="coverImage"
              defaultValue={record?.coverImage ?? ""}
              error={errors.coverImage}
              placeholder="https://..."
            />
          </FormSection>
        </Panel>

        {/* --- Fields of study --- */}
        <Panel>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Fields of study</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Linked fields drive the field pages and the study-area filter. Select none if the
                scholarship is open to every subject.
              </p>
            </div>
            {fieldOptions.length > 0 ? (
              <CheckboxGroup
                legend="Fields"
                name="fieldIds"
                options={fieldOptions}
                defaultValues={fieldIds ?? []}
                columns={3}
              />
            ) : (
              <p className="text-sm text-slate-500">No fields have been created yet.</p>
            )}
            {errors.fieldIds ? (
              <p className="text-[11px] font-medium text-red-600">{errors.fieldIds}</p>
            ) : null}
          </div>
        </Panel>

        {/* --- Verification --- */}
        <Panel>
          <FormSection
            title="Verification"
            description="This is what visitors see when they ask whether we have confirmed the details."
            columns={2}
          >
            <div className="sm:col-span-2">
              <TextInput
                label="Source URL"
                name="source"
                defaultValue={record?.source ?? ""}
                error={errors.source}
                placeholder="https://official-site.example/program"
                hint="Where these details were confirmed. Required for a listing to be marked verified."
              />
            </div>
            <Select
              label="Verification status"
              name="verificationStatus"
              defaultValue={verificationValue}
              options={VERIFICATION_STATUSES.map((v) => ({ value: v, label: v }))}
              error={errors.verificationStatus}
              hint="New records start as needing verification. Only mark verified after checking the official source."
            />
            <div className="flex items-end">
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-600">
                A scholarship with no source URL must not be marked as verified.
              </p>
            </div>
          </FormSection>
        </Panel>

        {/* --- Publishing --- */}
        <Panel>
          <FormSection title="Publishing" columns={2}>
            <Select
              label="Publish status"
              name="publishStatus"
              defaultValue={record?.publishStatus ?? "DRAFT"}
              options={PUBLISH_STATUSES.map((s) => ({
                value: s,
                label: s.charAt(0) + s.slice(1).toLowerCase(),
              }))}
              error={errors.publishStatus}
              hint="Drafts and archived records are hidden from the public site."
            />
            <div className="flex items-end">
              <Checkbox
                label="Feature this scholarship"
                name="featured"
                defaultChecked={record?.featured ?? false}
                hint="Featured listings appear in the highlights on the home page."
              />
            </div>
            <NumberInput
              label="Featured order"
              name="featuredOrder"
              defaultValue={record?.featuredOrder ?? null}
              error={errors.featuredOrder}
              hint="Lower numbers appear first."
            />
            <DateInput
              label="Featured until"
              name="featuredUntil"
              defaultValue={record?.featuredUntil ?? null}
              error={errors.featuredUntil}
              hint="Optional. The highlight stops after this date."
            />
            <div className="flex flex-col gap-2.5 sm:col-span-2">
              <Checkbox
                label="Hide from search engines (noindex)"
                name="noindex"
                defaultChecked={record?.noindex ?? false}
              />
              <Checkbox
                label="Include in the sitemap"
                name="includeInSitemap"
                defaultChecked={record?.includeInSitemap ?? true}
              />
            </div>
          </FormSection>
        </Panel>

        {/* --- SEO --- */}
        <Panel>
          <FormSection
            title="Search engine listing"
            description="Leave blank to use the title and summary from the Basics section."
            columns={1}
          >
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="seoTitle" className="text-xs font-semibold text-slate-700">
                  SEO title
                </label>
                <CharCount value={seoTitle} max={70} />
              </div>
              <input
                id="seoTitle"
                name="seoTitle"
                maxLength={70}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.seoTitle ? (
                <p className="text-[11px] font-medium text-red-600">{errors.seoTitle}</p>
              ) : null}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="seoDescription"
                  className="text-xs font-semibold text-slate-700"
                >
                  Meta description
                </label>
                <CharCount value={seoDescription} max={180} />
              </div>
              <textarea
                id="seoDescription"
                name="seoDescription"
                rows={2}
                maxLength={180}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.seoDescription ? (
                <p className="text-[11px] font-medium text-red-600">{errors.seoDescription}</p>
              ) : null}
            </div>

            <StringListInput
              label="SEO keywords"
              name="seoKeywords"
              defaultValues={record?.seoKeywords ?? []}
              error={errors.seoKeywords}
              rows={3}
            />

            <TextInput
              label="Canonical URL"
              name="canonicalUrl"
              type="url"
              defaultValue={record?.canonicalUrl ?? ""}
              error={errors.canonicalUrl}
              placeholder="https://globalscholarshiphub.com/scholarships/..."
              hint="Only set this when the same scholarship lives at another address we do not control."
            />

            <TextInput
              label="Social share image URL"
              name="ogImage"
              defaultValue={record?.ogImage ?? ""}
              error={errors.ogImage}
              placeholder="https://... (1200x630)"
            />
          </FormSection>
        </Panel>
      </div>

      {/* --- Sticky save bar --- */}
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
            {isEdit ? "Save changes" : "Create scholarship"}
          </button>

          {isEdit ? (
            <PublishButtons
              id={record!.id}
              publishStatus={record!.publishStatus}
              onDone={() => router.refresh()}
            />
          ) : null}

          {isEdit && canDelete && !record!.deletedAt ? (
            <TrashButton id={record!.id} onDone={() => router.push("/admin/scholarships")} />
          ) : null}

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            {isEdit && record!.updatedAt ? (
              <span>Last saved {formatDate(record!.updatedAt)}</span>
            ) : null}
            <Link
              href="/admin/scholarships"
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

function PublishButtons({
  id,
  publishStatus,
  onDone,
}: {
  id: string;
  publishStatus: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function go(next: "DRAFT" | "PUBLISHED" | "ARCHIVED", message: string) {
    startTransition(async () => {
      const result = await setScholarshipStatus(id, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(message);
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      {publishStatus === "PUBLISHED" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => go("DRAFT", "Moved to draft and hidden from the site")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Unpublish
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => go("PUBLISHED", "Published to the public site")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Publish
        </button>
      )}
    </>
  );
}

function TrashButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Move to trash
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
      <span className="text-xs font-medium text-red-800">Move to trash? This is reversible.</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white"
      >
        No
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await trashScholarship(id);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Moved to trash");
            router.refresh();
            onDone();
          })
        }
        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
        Yes, move it
      </button>
    </div>
  );
}

/** `toISOString` shifts by timezone; take the local calendar date instead. */
function toInputDate(value: Date | null | undefined): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
