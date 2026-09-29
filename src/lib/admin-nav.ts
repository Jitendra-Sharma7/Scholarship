import {
  Activity,
  Building2,
  FileText,
  Flag,
  FolderOpen,
  GraduationCap,
  Home,
  Inbox,
  LayoutDashboard,
  Library,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Single source of truth for admin navigation.
 *
 * `minRole` is checked server-side before a page renders, and is repeated in the
 * sidebar purely so links an admin cannot use are not offered. The sidebar is
 * only a convenience - it is never the authorization boundary.
 */

export type AdminRoleName = "EDITOR" | "ADMIN" | "SUPER_ADMIN";

const ROLE_RANK: Record<AdminRoleName, number> = {
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function rank(role: string | null | undefined): number {
  return ROLE_RANK[(role ?? "USER") as AdminRoleName] ?? 0;
}

export function meetsRole(role: string | null | undefined, min: AdminRoleName): boolean {
  return rank(role) >= ROLE_RANK[min];
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  minRole: AdminRoleName;
  /** Match nested routes too (e.g. /admin/scholarships/abc). */
  matchPrefix?: boolean;
  description: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        minRole: "EDITOR",
        description: "Platform statistics and recent activity",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        href: "/admin/scholarships",
        label: "Scholarships",
        icon: GraduationCap,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Create, edit, publish and feature opportunities",
      },
      {
        href: "/admin/universities",
        label: "Universities",
        icon: Building2,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Manage university records and rankings",
      },
      {
        href: "/admin/countries",
        label: "Countries",
        icon: Flag,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Manage country profiles and study information",
      },
      {
        href: "/admin/fields",
        label: "Fields of Study",
        icon: Library,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Manage fields, categories and subfields",
      },
    ],
  },
  {
    title: "Editorial",
    items: [
      {
        href: "/admin/blog",
        label: "Blog",
        icon: Newspaper,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Write, schedule and publish blog posts",
      },
      {
        href: "/admin/resources",
        label: "Resources",
        icon: FileText,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Guides, PDFs, videos and links",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/admin/submissions",
        label: "Submissions",
        icon: Inbox,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Review community submissions",
      },
      {
        href: "/admin/media",
        label: "Media",
        icon: FolderOpen,
        minRole: "EDITOR",
        matchPrefix: true,
        description: "Images and documents used across the site",
      },
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        minRole: "ADMIN",
        matchPrefix: true,
        description: "Accounts, roles and access",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/admin/activity",
        label: "Activity Log",
        icon: Activity,
        minRole: "ADMIN",
        matchPrefix: true,
        description: "Audit trail of administrative changes",
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
        minRole: "SUPER_ADMIN",
        matchPrefix: true,
        description: "Site, SEO and scholarship defaults",
      },
    ],
  },
];

export function navSectionsForRole(role: string | null | undefined): NavSection[] {
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => meetsRole(role, item.minRole)),
  })).filter((section) => section.items.length > 0);
}

export function isActivePath(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

/** Top-level quick actions shown on the dashboard. */
export const QUICK_ACTIONS = [
  { href: "/admin/scholarships/new", label: "Add Scholarship", icon: GraduationCap },
  { href: "/admin/universities/new", label: "Add University", icon: Building2 },
  { href: "/admin/countries/new", label: "Add Country", icon: Flag },
  { href: "/admin/fields/new", label: "Add Field", icon: Library },
  { href: "/admin/blog/new", label: "Write Blog Post", icon: Newspaper },
  { href: "/admin/resources/new", label: "Add Resource", icon: FileText },
] as const;

export const ADMIN_HOME = "/admin/dashboard";
export { Home as HomeIcon };
