/**
 * Declarative description of every admin-managed content type.
 *
 * The admin sections share one table, one form, and one set of actions, so each
 * content type is described here as data rather than re-implemented as its own
 * page. Adding a field to the university editor means adding one line to
 * `universities.fields`, not writing a form.
 *
 * Column and field descriptors are plain data so the module stays safe to import
 * from both server and client components; icons are resolved by name in the
 * client components, because a `LucideIcon` value cannot cross that boundary.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "strings"
  | "slug"
  | "url"
  | "email"
  | "password";

export interface FormField {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Options for `select`, and the source of options for reference selects. */
  options?: string[];
  /** Options loaded per-request from the database, keyed by registry reference. */
  refOptions?: "countries" | "fields" | "users" | "parents";
  rows?: number;
  /** Span the full row in the two-column form grid. */
  full?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  /** Shown in a "Publishing" group at the end of the form. */
  group?: "publishing" | "seo" | "content";
}

export type ColumnKind =
  | "text"
  | "title"
  | "badge"
  | "date"
  | "datetime"
  | "number"
  | "publish"
  | "boolean"
  | "money"
  | "image";

export interface Column {
  key: string;
  header: string;
  kind: ColumnKind;
  sortable?: boolean;
  hideBelow?: "sm" | "md" | "lg";
  /** Maps the raw stored value to a badge tone. */
  tone?: Record<string, BadgeToneName>;
  /** Column value is a relation name already selected server-side. */
  className?: string;
  widthClass?: string;
}

export type BadgeToneName = "neutral" | "green" | "amber" | "red" | "blue" | "purple";

export type EntityModel =
  | "university"
  | "country"
  | "field"
  | "blogPost"
  | "resource"
  | "media"
  | "user";

export interface EntityDef {
  key: string;
  label: string;
  singular: string;
  model: EntityModel;
  icon: string;
  description: string;
  /** Table columns; `key` doubles as the sort key when `sortable`. */
  columns: Column[];
  /** Search + filter definitions driven by the query string. */
  searchPlaceholder: string;
  filters: {
    name: string;
    label: string;
    ref?: "countries" | "publishStatus" | "resourceType" | "role" | "featured" | "suspended";
  }[];
  fields: FormField[];
  defaultSort: { key: string; dir: "asc" | "desc" };
  hasTrash: boolean;
  hasPublish: boolean;
  hasFeatured: boolean;
  hasSlug: boolean;
  /** Prevents destructive bulk actions, e.g. on users. */
  bulkGuard?: "admin";
}

const PUBLISH_TONE: Record<string, BadgeToneName> = {
  PUBLISHED: "green",
  DRAFT: "amber",
  ARCHIVED: "neutral",
};

const SEO_FIELDS: FormField[] = [
  { name: "seoTitle", label: "SEO title", kind: "text", maxLength: 70, group: "seo", full: true, hint: "Leave blank to use the title." },
  { name: "seoDescription", label: "Meta description", kind: "textarea", rows: 2, maxLength: 180, group: "seo", full: true },
  { name: "seoKeywords", label: "SEO keywords", kind: "strings", rows: 3, group: "seo", full: true },
  { name: "canonicalUrl", label: "Canonical URL", kind: "url", group: "seo", full: true },
  { name: "noindex", label: "Hide from search engines (noindex)", kind: "checkbox", group: "seo" },
  { name: "includeInSitemap", label: "Include in the sitemap", kind: "checkbox", group: "seo" },
];

const PUBLISH_FIELDS: FormField[] = [
  { name: "publishStatus", label: "Publish status", kind: "select", required: true, options: ["DRAFT", "PUBLISHED", "ARCHIVED"], group: "publishing" },
  { name: "featured", label: "Feature this record", kind: "checkbox", group: "publishing", hint: "Featured records appear in site highlights." },
];

// --- Universities ----------------------------------------------------------

const universities: EntityDef = {
  key: "universities",
  label: "Universities",
  singular: "University",
  model: "university",
  icon: "Building2",
  description: "Institutions that appear in the finder, country pages, and scholarship records.",
  searchPlaceholder: "Search universities by name, city, or country",
  defaultSort: { key: "name", dir: "asc" },
  hasTrash: true,
  hasPublish: true,
  hasFeatured: true,
  hasSlug: true,
  columns: [
    { key: "name", header: "University", kind: "title", sortable: true },
    { key: "country", header: "Country", kind: "text", hideBelow: "sm" },
    { key: "city", header: "City", kind: "text", hideBelow: "lg" },
    { key: "type", header: "Type", kind: "text", hideBelow: "lg" },
    { key: "qsRanking", header: "QS", kind: "number", hideBelow: "md", widthClass: "w-20" },
    { key: "scholarshipCount", header: "Scholarships", kind: "number", hideBelow: "md", widthClass: "w-24" },
    { key: "publishStatus", header: "State", kind: "publish", tone: PUBLISH_TONE },
    { key: "actions", header: "", kind: "text", widthClass: "w-10" },
  ],
  filters: [
    { name: "countryId", label: "Country", ref: "countries" },
    { name: "status", label: "Publish status", ref: "publishStatus" },
    { name: "featured", label: "Featured", ref: "featured" },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "slug", label: "URL slug", kind: "slug", required: true, full: true, hint: "Used in internal links and filters. There is no public page at this slug, so changing it breaks no inbound URL." },
    { name: "countryId", label: "Country", kind: "select", refOptions: "countries" },
    { name: "city", label: "City", kind: "text" },
    { name: "region", label: "Region", kind: "text" },
    { name: "type", label: "Type", kind: "text", placeholder: "e.g. Public research" },
    { name: "ownership", label: "Ownership", kind: "text", placeholder: "Public or Private" },
    { name: "website", label: "Website", kind: "url" },
    { name: "admissionsWebsite", label: "Admissions website", kind: "url" },
    { name: "foundedYear", label: "Founded", kind: "number", min: 1000, max: 2100 },
    { name: "qsRanking", label: "QS ranking", kind: "number", min: 1, hint: "Leave blank when unranked." },
    { name: "theRanking", label: "THE ranking", kind: "number", min: 1 },
    { name: "acceptanceRate", label: "Acceptance rate (%)", kind: "number", min: 0, max: 100, step: 0.01 },
    { name: "studentCount", label: "Total students", kind: "number", min: 0 },
    { name: "internationalStudentCount", label: "International students", kind: "number", min: 0 },
    { name: "internationalStudentPercent", label: "International students (%)", kind: "number", min: 0, max: 100, step: 0.01 },
    { name: "contactEmail", label: "Contact email", kind: "email" },
    { name: "contactPhone", label: "Contact phone", kind: "text" },
    { name: "address", label: "Address", kind: "text" },
    { name: "latitude", label: "Latitude", kind: "number", step: 0.0001, min: -90, max: 90 },
    { name: "longitude", label: "Longitude", kind: "number", step: 0.0001, min: -180, max: 180 },
    { name: "popularFields", label: "Popular fields", kind: "strings", rows: 4, full: true },
    { name: "description", label: "Description", kind: "textarea", rows: 6, full: true, group: "content" },
    { name: "tuitionInfo", label: "Tuition information", kind: "textarea", rows: 3, full: true, group: "content" },
    { name: "admissionInfo", label: "Admissions information", kind: "textarea", rows: 3, full: true, group: "content" },
    { name: "internationalInfo", label: "International students", kind: "textarea", rows: 3, full: true, group: "content" },
    { name: "logo", label: "Logo URL", kind: "url", full: true },
    { name: "coverImage", label: "Cover image URL", kind: "url", full: true },
    ...PUBLISH_FIELDS,
    ...SEO_FIELDS,
  ],
};

// --- Countries -------------------------------------------------------------

const countries: EntityDef = {
  key: "countries",
  label: "Countries",
  singular: "Country",
  model: "country",
  icon: "Flag",
  description: "Destination pages, navigation, and the country filter on every listing.",
  searchPlaceholder: "Search countries by name or code",
  defaultSort: { key: "name", dir: "asc" },
  hasTrash: true,
  hasPublish: true,
  hasFeatured: true,
  hasSlug: true,
  columns: [
    { key: "name", header: "Country", kind: "title", sortable: true },
    { key: "code", header: "Code", kind: "badge", widthClass: "w-20" },
    { key: "region", header: "Region", kind: "text", sortable: true, hideBelow: "sm" },
    { key: "capital", header: "Capital", kind: "text", hideBelow: "lg" },
    { key: "currency", header: "Currency", kind: "text", hideBelow: "lg" },
    { key: "scholarshipCount", header: "Scholarships", kind: "number", hideBelow: "md", widthClass: "w-24" },
    { key: "publishStatus", header: "State", kind: "publish", tone: PUBLISH_TONE },
    { key: "actions", header: "", kind: "text", widthClass: "w-10" },
  ],
  filters: [
    { name: "status", label: "Publish status", ref: "publishStatus" },
    { name: "featured", label: "Featured", ref: "featured" },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "code", label: "ISO alpha-2 code", kind: "text", required: true, maxLength: 2, hint: "Two letters, e.g. GB." },
    { name: "code3", label: "ISO alpha-3 code", kind: "text", maxLength: 3 },
    { name: "slug", label: "URL slug", kind: "slug", required: true, full: true, hint: "Used in internal links and filters. There is no public page at this slug, so changing it breaks no inbound URL." },
    { name: "region", label: "Region", kind: "text", required: true, placeholder: "e.g. Europe" },
    { name: "continent", label: "Continent", kind: "text" },
    { name: "capital", label: "Capital city", kind: "text" },
    { name: "currency", label: "Currency", kind: "text", placeholder: "e.g. GBP" },
    { name: "officialLanguages", label: "Official languages", kind: "strings", rows: 3, full: true },
    { name: "flag", label: "Flag image path", kind: "text", full: true, placeholder: "/flags/gb.png", hint: "Relative path to a file in /public, or a full URL." },
    { name: "popularUniversities", label: "Popular universities", kind: "strings", rows: 5, full: true, hint: "One per line, by name." },
    { name: "popularFields", label: "Popular fields", kind: "strings", rows: 4, full: true },
    { name: "description", label: "Description", kind: "textarea", rows: 6, full: true, group: "content" },
    { name: "studyInfo", label: "Studying there", kind: "textarea", rows: 4, full: true, group: "content" },
    { name: "visaInfo", label: "Visa information", kind: "textarea", rows: 4, full: true, group: "content", hint: "Only record what the official immigration authority states." },
    { name: "costOfLiving", label: "Cost of living", kind: "textarea", rows: 3, full: true, group: "content" },
    ...PUBLISH_FIELDS,
    ...SEO_FIELDS,
  ],
};

// --- Fields of study -------------------------------------------------------

const fields: EntityDef = {
  key: "fields",
  label: "Fields of Study",
  singular: "Field of Study",
  model: "field",
  icon: "Library",
  description: "Study areas that drive the field pages, filters, and matching.",
  searchPlaceholder: "Search fields of study",
  defaultSort: { key: "name", dir: "asc" },
  hasTrash: true,
  hasPublish: true,
  hasFeatured: false,
  hasSlug: true,
  columns: [
    { key: "name", header: "Field", kind: "title", sortable: true },
    { key: "parentName", header: "Parent", kind: "text", hideBelow: "sm" },
    { key: "category", header: "Category", kind: "text", hideBelow: "lg" },
    { key: "childCount", header: "Sub-fields", kind: "number", hideBelow: "md", widthClass: "w-24" },
    { key: "scholarshipCount", header: "Scholarships", kind: "number", hideBelow: "md", widthClass: "w-24" },
    { key: "publishStatus", header: "State", kind: "publish", tone: PUBLISH_TONE },
    { key: "actions", header: "", kind: "text", widthClass: "w-10" },
  ],
  filters: [
    { name: "status", label: "Publish status", ref: "publishStatus" },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "slug", label: "URL slug", kind: "slug", required: true, full: true, hint: "Used in internal links and filters. There is no public page at this slug, so changing it breaks no inbound URL." },
    { name: "parentId", label: "Parent field", kind: "select", refOptions: "parents", full: true, hint: "Leave blank for a top-level field." },
    { name: "category", label: "Category", kind: "text", placeholder: "e.g. STEM" },
    { name: "icon", label: "Icon name", kind: "text" },
    { name: "avgSalary", label: "Average salary", kind: "text" },
    { name: "popularDegrees", label: "Popular degrees", kind: "strings", rows: 4, full: true },
    { name: "careerPaths", label: "Career paths", kind: "strings", rows: 5, full: true },
    { name: "description", label: "Description", kind: "textarea", rows: 6, full: true, group: "content" },
    { name: "image", label: "Image URL", kind: "url", full: true, group: "content" },
    { name: "publishStatus", label: "Publish status", kind: "select", required: true, options: ["DRAFT", "PUBLISHED", "ARCHIVED"], group: "publishing" },
    ...SEO_FIELDS,
  ],
};

// --- Blog ------------------------------------------------------------------

const blog: EntityDef = {
  key: "blog",
  label: "Blog",
  singular: "Post",
  model: "blogPost",
  icon: "Newspaper",
  description: "Editorial content. Posts are hidden until published.",
  searchPlaceholder: "Search posts by title or tag",
  defaultSort: { key: "createdAt", dir: "desc" },
  hasTrash: true,
  hasPublish: true,
  hasFeatured: true,
  hasSlug: true,
  columns: [
    { key: "title", header: "Post", kind: "title", sortable: true },
    { key: "category", header: "Category", kind: "text", hideBelow: "sm" },
    { key: "authorName", header: "Author", kind: "text", hideBelow: "lg" },
    { key: "readingTime", header: "Read", kind: "number", hideBelow: "md", widthClass: "w-16" },
    { key: "publishedAt", header: "Published", kind: "date", hideBelow: "sm" },
    { key: "publishStatus", header: "State", kind: "publish", tone: PUBLISH_TONE },
    { key: "actions", header: "", kind: "text", widthClass: "w-10" },
  ],
  filters: [
    { name: "status", label: "Publish status", ref: "publishStatus" },
    { name: "featured", label: "Featured", ref: "featured" },
  ],
  fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "slug", label: "URL slug", kind: "slug", required: true, full: true, hint: "This is the public URL. Changing it after publication creates a permanent redirect from the old address." },
    { name: "excerpt", label: "Excerpt", kind: "textarea", rows: 3, full: true, maxLength: 400 },
    { name: "content", label: "Content", kind: "textarea", rows: 20, full: true, group: "content", hint: "Plain text or basic HTML. Keep it readable without scripts." },
    { name: "category", label: "Category", kind: "text", placeholder: "e.g. Applications" },
    { name: "authorId", label: "Author", kind: "select", refOptions: "users" },
    { name: "authorName", label: "Author name", kind: "text", hint: "Shown when the author has no account." },
    { name: "tags", label: "Tags", kind: "strings", rows: 3, full: true },
    { name: "readingTime", label: "Reading time (minutes)", kind: "number", min: 1 },
    { name: "scheduledAt", label: "Schedule for", kind: "date", hint: "Only meaningful for a published post; otherwise the date is informational." },
    { name: "featuredImage", label: "Featured image URL", kind: "url", full: true, group: "content" },
    ...PUBLISH_FIELDS,
    ...SEO_FIELDS,
  ],
};

// --- Resources -------------------------------------------------------------

const resources: EntityDef = {
  key: "resources",
  label: "Resources",
  singular: "Resource",
  model: "resource",
  icon: "FolderOpen",
  description: "Guides, templates, and downloads shown on the resources pages.",
  searchPlaceholder: "Search resources by title, category, or tag",
  defaultSort: { key: "updatedAt", dir: "desc" },
  hasTrash: true,
  hasPublish: true,
  hasFeatured: true,
  hasSlug: true,
  columns: [
    { key: "title", header: "Resource", kind: "title", sortable: true },
    { key: "type", header: "Type", kind: "badge", hideBelow: "sm" },
    { key: "category", header: "Category", kind: "text", hideBelow: "md" },
    { key: "updatedAt", header: "Updated", kind: "date", sortable: true, hideBelow: "lg" },
    { key: "publishStatus", header: "State", kind: "publish", tone: PUBLISH_TONE },
    { key: "actions", header: "", kind: "text", widthClass: "w-10" },
  ],
  filters: [
    { name: "status", label: "Publish status", ref: "publishStatus" },
    { name: "type", label: "Type", ref: "resourceType" },
    { name: "featured", label: "Featured", ref: "featured" },
  ],
  fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "slug", label: "URL slug", kind: "slug", required: true, full: true, hint: "This is the public URL. Changing it after publication creates a permanent redirect from the old address." },
    { name: "type", label: "Type", kind: "select", required: true, options: ["GUIDE", "PDF", "DOCUMENT", "LINK", "VIDEO", "TEMPLATE"] },
    { name: "category", label: "Category", kind: "text" },
    { name: "url", label: "External URL", kind: "url" },
    { name: "fileUrl", label: "File URL", kind: "url", hint: "Direct link to the downloadable file." },
    { name: "thumbnail", label: "Thumbnail URL", kind: "url" },
    { name: "description", label: "Description", kind: "textarea", rows: 6, full: true, group: "content" },
    {
      name: "content",
      label: "Body",
      kind: "textarea",
      rows: 20,
      full: true,
      group: "content",
      hint: "Article body for GUIDE resources. Start each section with \"## Heading\" and separate paragraphs with a blank line. Leave empty for a resource that is only a link or download.",
    },
    { name: "tags", label: "Tags", kind: "strings", rows: 3, full: true, group: "content" },
    ...PUBLISH_FIELDS,
    ...SEO_FIELDS,
  ],
};

// --- Media -----------------------------------------------------------------

const media: EntityDef = {
  key: "media",
  label: "Media",
  singular: "File",
  model: "media",
  icon: "Image",
  description: "Images and files already in the library. Used when adding logos or cover images.",
  searchPlaceholder: "Search files by name, alt text, or folder",
  defaultSort: { key: "createdAt", dir: "desc" },
  hasTrash: true,
  hasPublish: false,
  hasFeatured: false,
  hasSlug: false,
  columns: [
    { key: "originalName", header: "File", kind: "title" },
    { key: "folder", header: "Folder", kind: "text", hideBelow: "sm" },
    { key: "mimeType", header: "Type", kind: "text", hideBelow: "md" },
    { key: "size", header: "Size", kind: "number", hideBelow: "md", widthClass: "w-24" },
    { key: "createdAt", header: "Added", kind: "date", sortable: true, hideBelow: "sm" },
    { key: "actions", header: "", kind: "text", widthClass: "w-10" },
  ],
  filters: [],
  fields: [
    { name: "originalName", label: "Display name", kind: "text", required: true, full: true },
    { name: "alt", label: "Alt text", kind: "text", full: true, hint: "Describe the image for screen readers and search engines." },
    { name: "folder", label: "Folder", kind: "text", required: true, placeholder: "general" },
    { name: "url", label: "URL", kind: "text", required: true, full: true },
  ],
};

// --- Users -----------------------------------------------------------------

const users: EntityDef = {
  key: "users",
  label: "Users",
  singular: "User",
  model: "user",
  icon: "Users",
  description: "People who signed up, plus the staff accounts that can reach the admin panel.",
  searchPlaceholder: "Search users by name or email",
  defaultSort: { key: "createdAt", dir: "desc" },
  hasTrash: false,
  hasPublish: false,
  hasFeatured: false,
  hasSlug: false,
  bulkGuard: "admin",
  columns: [
    { key: "name", header: "User", kind: "title" },
    { key: "email", header: "Email", kind: "text", hideBelow: "sm" },
    {
      key: "role",
      header: "Role",
      kind: "badge",
      hideBelow: "sm",
      tone: { SUPER_ADMIN: "purple", ADMIN: "blue", EDITOR: "green", USER: "neutral" },
    },
    { key: "suspended", header: "Access", kind: "boolean", hideBelow: "md", tone: { true: "red", false: "green" } },
    { key: "lastLoginAt", header: "Last login", kind: "date", hideBelow: "lg" },
    { key: "createdAt", header: "Joined", kind: "date", sortable: true, hideBelow: "lg" },
    { key: "actions", header: "", kind: "text", widthClass: "w-10" },
  ],
  filters: [
    { name: "role", label: "Role", ref: "role" },
    { name: "suspended", label: "Access", ref: "suspended" },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text" },
    { name: "email", label: "Email", kind: "email", required: true },
    { name: "role", label: "Role", kind: "select", required: true, options: ["USER", "EDITOR", "ADMIN", "SUPER_ADMIN"], full: true, hint: "Only SUPER_ADMIN and ADMIN can change roles." },
    { name: "suspended", label: "Suspend this account", kind: "checkbox", full: true, hint: "A suspended user cannot sign in." },
    { name: "suspendedReason", label: "Suspension reason", kind: "text", full: true },
    { name: "country", label: "Country", kind: "text" },
    { name: "educationLevel", label: "Current education level", kind: "text" },
    { name: "desiredDegree", label: "Desired degree", kind: "text" },
    { name: "fieldOfStudy", label: "Field of study", kind: "text" },
    { name: "gpa", label: "GPA", kind: "number", step: 0.01, min: 0, max: 4 },
    { name: "ielts", label: "IELTS", kind: "number", step: 0.5 },
    { name: "toefl", label: "TOEFL", kind: "number" },
    { name: "bio", label: "Bio", kind: "textarea", rows: 4, full: true },
    { name: "targetCountries", label: "Target countries", kind: "strings", rows: 3, full: true },
  ],
};

export const ENTITIES: Record<string, EntityDef> = {
  universities,
  countries,
  fields,
  blog,
  resources,
  media,
  users,
};

/** Entity keys handled by the generic CRUD routes, in nav order. */
export const ENTITY_KEYS = Object.keys(ENTITIES);

/**
 * Admin path segments that must not be claimed by the dynamic `[entity]`
 * segment. Next resolves static routes first, so this is a guard rather than a
 * routing requirement: it keeps `/admin/anything-else` a 404 instead of an
 * empty table.
 */
export const RESERVED_ENTITY_SEGMENTS = new Set([
  "dashboard",
  "scholarships",
  "trash",
  "submissions",
  "activity",
  "settings",
  "login",
  "api",
]);

/** True when `[entity]` should serve this segment. */
export function isGenericEntitySegment(key: string): boolean {
  return Boolean(ENTITIES[key]) && !RESERVED_ENTITY_SEGMENTS.has(key);
}

/** Admin sections built as bespoke pages rather than the generic CRUD. */
export const SPECIAL_PAGES: Record<string, { label: string; singular: string }> = {
  submissions: { label: "Submissions", singular: "Submission" },
  activity: { label: "Activity Log", singular: "Entry" },
  settings: { label: "Settings", singular: "Setting" },
};

export function getEntity(key: string): EntityDef | null {
  return ENTITIES[key] ?? null;
}

/** Human-readable label for a stored enum value, e.g. `FULL_TUITION` -> `Full tuition`. */
export function humanizeEnum(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}
