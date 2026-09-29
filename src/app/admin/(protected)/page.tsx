import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** `/admin` entry point; the panel itself is under the protected group. */
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
