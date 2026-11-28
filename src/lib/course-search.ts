/**
 * Course Search — shared types and pure helpers.
 *
 * The navigation links point at `/course-search?degree=masters`,
 * `?subject=business`, `?country=germany` and `?country=europe`. Those are
 * friendly, URL-safe slugs, but the database stores a degree level as the exact
 * string `"Master's"`, a subject as a Field id (cuid) with its own slug, and a
 * country as a Country id with an ISO code and a region.
 *
 * This module is the single translation layer between the two: it slugifies DB
 * values, resolves a URL slug back to the concrete DB value, and turns a filter
 * state back into a clean query string. It is deliberately free of any Prisma or
 * React import so both the server page and the client browser can use it.
 */

export interface DegreeOption {
  /** The exact value stored in Scholarship.degreeLevels. */
  value: string;
  /** URL slug, e.g. "masters". */
  slug: string;
  /** Human label, e.g. "Master's". */
  label: string;
}

export interface SubjectOption {
  /** Field id (cuid) used by the scholarship query. */
  id: string;
  slug: string;
  name: string;
}

export interface CountryOption {
  /** Country id (cuid) used by the scholarship query. */
  id: string;
  slug: string;
  name: string;
  code: string;
}

export interface RegionOption {
  name: string;
  slug: string;
}

export interface StudyModeOption {
  value: string;
  slug: string;
  label: string;
}

export interface DurationOption {
  value: string;
  slug: string;
  label: string;
}

export interface TuitionFeeOption {
  value: string;
  slug: string;
  label: string;
}

export interface CourseTypeOption {
  value: string;
  slug: string;
  label: string;
}

export interface CourseSearchOptions {
  degrees: DegreeOption[];
  subjects: SubjectOption[];
  countries: CountryOption[];
  regions: RegionOption[];
  universities: { id: string; name: string }[];
  studyModes: StudyModeOption[];
  durations: DurationOption[];
  tuitionFees: TuitionFeeOption[];
  courseTypes: CourseTypeOption[];
}

/**
 * Filter state as held in the URL: every value is a friendly slug (degree,
 * subject, country-or-region) except `university`, which is a country-style id
 * because university names are not unique enough to slug safely.
 */
export interface CourseFilterState {
  degree: string;
  subject: string;
  country: string;
  university: string;
  studyMode: string;
  duration: string;
  tuitionFee: string;
  courseType: string;
}

/** The same filters resolved to the concrete values the data layer expects. */
export interface ResolvedCourseQuery {
  degree: string;
  field: string;
  country: string;
  region: string;
  university: string;
  studyMode: string;
  duration: string;
  tuitionFee: string;
  courseType: string;
}

export const EMPTY_COURSE_FILTERS: CourseFilterState = {
  degree: "",
  subject: "",
  country: "",
  university: "",
  studyMode: "",
  duration: "",
  tuitionFee: "",
  courseType: "",
};

/**
 * Lowercases, strips accents and apostrophes, and collapses every run of
 * non-alphanumerics to a single dash. `"Master's"` -> `"masters"`,
 * `"Computer Science"` -> `"computer-science"`.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findDegreeSlug(degrees: DegreeOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = degrees.find((d) => d.slug === wanted);
  if (exact) return exact.value;
  // Fall back to a prefix match so "postgrad" can reach "Postgraduate".
  const prefix = degrees.find((d) => d.slug.startsWith(wanted));
  return prefix ? prefix.value : "";
}

function findSubjectId(subjects: SubjectOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = subjects.find((s) => s.slug === wanted || s.id === slug);
  if (exact) return exact.id;
  // "business" should reach "business-administration"; "cs" already matches an id.
  const prefix = subjects.find((s) => s.slug.startsWith(wanted));
  return prefix ? prefix.id : "";
}

function findCountryId(countries: CountryOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = countries.find(
    (c) => c.slug === wanted || c.id === slug || c.code.toLowerCase() === slug.toLowerCase(),
  );
  if (exact) return exact.id;
  const prefix = countries.find((c) => c.slug.startsWith(wanted));
  return prefix ? prefix.id : "";
}

function findRegionName(regions: RegionOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = regions.find((r) => r.slug === wanted);
  if (exact) return exact.name;
  const prefix = regions.find((r) => r.slug.startsWith(wanted));
  return prefix ? prefix.name : "";
}

function findStudyModeSlug(studyModes: StudyModeOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = studyModes.find((s) => s.slug === wanted);
  if (exact) return exact.value;
  const prefix = studyModes.find((s) => s.slug.startsWith(wanted));
  return prefix ? prefix.value : "";
}

function findDurationSlug(durations: DurationOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = durations.find((d) => d.slug === wanted);
  if (exact) return exact.value;
  const prefix = durations.find((d) => d.slug.startsWith(wanted));
  return prefix ? prefix.value : "";
}

function findTuitionFeeSlug(tuitionFees: TuitionFeeOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = tuitionFees.find((t) => t.slug === wanted);
  if (exact) return exact.value;
  const prefix = tuitionFees.find((t) => t.slug.startsWith(wanted));
  return prefix ? prefix.value : "";
}

function findCourseTypeSlug(courseTypes: CourseTypeOption[], slug: string): string {
  if (!slug) return "";
  const wanted = slugify(slug);
  const exact = courseTypes.find((c) => c.slug === wanted);
  if (exact) return exact.value;
  const prefix = courseTypes.find((c) => c.slug.startsWith(wanted));
  return prefix ? prefix.value : "";
}

/**
 * Resolve URL slugs to concrete DB values. A country slug that names a region
 * (e.g. "europe") becomes a `region` filter; anything else resolves to a single
 * country id. Unknown slugs resolve to "" so a hand-edited URL degrades to "no
 * filter" rather than an error.
 */
export function resolveCourseQuery(
  state: CourseFilterState,
  options: CourseSearchOptions,
): ResolvedCourseQuery {
  const countrySlug = state.country;
  const regionName = findRegionName(options.regions, countrySlug);
  const countryId = regionName ? "" : findCountryId(options.countries, countrySlug);

  return {
    degree: findDegreeSlug(options.degrees, state.degree),
    field: findSubjectId(options.subjects, state.subject),
    country: countryId,
    region: regionName,
    university: state.university,
    studyMode: findStudyModeSlug(options.studyModes, state.studyMode),
    duration: findDurationSlug(options.durations, state.duration),
    tuitionFee: findTuitionFeeSlug(options.tuitionFees, state.tuitionFee),
    courseType: findCourseTypeSlug(options.courseTypes, state.courseType),
  };
}

/**
 * Build the canonical query string for a filter state, using the friendly slugs
 * the navigation uses. Empty filters are omitted, so "View All" is a bare
 * `/course-search`.
 */
export function courseFiltersToQuery(state: CourseFilterState): string {
  const params = new URLSearchParams();
  if (state.degree) params.set("degree", state.degree);
  if (state.subject) params.set("subject", state.subject);
  if (state.country) params.set("country", state.country);
  if (state.university) params.set("university", state.university);
  if (state.studyMode) params.set("studyMode", state.studyMode);
  if (state.duration) params.set("duration", state.duration);
  if (state.tuitionFee) params.set("tuitionFee", state.tuitionFee);
  if (state.courseType) params.set("courseType", state.courseType);
  return params.toString();
}