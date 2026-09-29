import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth";
import { getAdminNotifications } from "@/lib/admin-notifications";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminRoleName } from "@/lib/admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Global Scholarship Hub Admin" },
  robots: { index: false, follow: false },
};

/**
 * Gate for every page inside this route group.
 *
 * `requireStaff` runs on the server and redirects to the sign-in page when
 * there is no valid staff session, so a visitor cannot read admin markup by
 * navigating directly. Individual pages add role checks on top via
 * `requireRole`.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  const { unread } = await getAdminNotifications();

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role as AdminRoleName }}
      unreadCount={unread}
    >
      {children}
    </AdminShell>
  );
}
