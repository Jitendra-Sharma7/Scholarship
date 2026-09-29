import { getPublicScholarships } from "@/lib/data/public";
import { DashboardClient } from "./DashboardClient";

/**
 * Server entry point. The recommended shortlist is read here; the saved list is
 * resolved in the browser from local storage through a server action.
 */
export default async function DashboardPage() {
  const recommended = await getPublicScholarships({ limit: 3, sort: "featured" });

  return <DashboardClient recommendedScholarships={recommended.data} />;
}
