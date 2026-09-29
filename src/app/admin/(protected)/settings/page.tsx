import { PageHeader, Panel } from "@/components/admin/ui/primitives";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { SETTING_DEFS, SETTING_KEYS } from "@/lib/settings/definitions";

/**
 * Site settings.
 *
 * SUPER_ADMIN only. The form is generated from the settings registry, so every
 * key shown here has code that reads it; any other key in the table is listed
 * separately rather than silently ignored.
 */

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireRole("SUPER_ADMIN");

  const rows = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  const stored: Record<string, unknown> = {};
  for (const row of rows) stored[row.key] = row.value;

  // A key in the database that the site does not read is dead configuration.
  // Surfacing it is more honest than hiding it.
  const orphans = rows.filter((r) => !SETTING_KEYS.has(r.key));

  return (
    <>
      <PageHeader
        title="Settings"
        description="Values read while the public site renders. Saving rebuilds the affected pages."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Settings" }]}
      />

      {orphans.length > 0 ? (
        <Panel className="mb-5 border-amber-200 bg-amber-50">
          <h2 className="text-sm font-semibold text-amber-900">
            {orphans.length} setting{orphans.length === 1 ? "" : "s"} nothing reads
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-amber-900">
            These keys are stored but no code reads them, so changing them would do nothing. Remove
            them, or add the code that uses them.
          </p>
          <ul className="mt-2.5 space-y-1">
            {orphans.map((row) => (
              <li key={row.key} className="text-xs">
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] text-amber-900">
                  {row.key}
                </code>{" "}
                <span className="text-amber-800">
                  = {JSON.stringify(row.value).slice(0, 120)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <SettingsForm stored={stored} />

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-slate-500">
        Only the {SETTING_DEFS.length} settings below are editable. Credentials, database
        connection details and the session secret come from environment variables and are
        deliberately not editable from the browser.
      </p>
    </>
  );
}
