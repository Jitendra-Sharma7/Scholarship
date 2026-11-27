"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  Search,
  GraduationCap,
  Building2,
  Globe,
  BookOpen,
  Award,
  FileText,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store/useStore";
import { useTheme } from "@/components/providers/ThemeProvider";

interface DropdownItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: DropdownItem[];
}

const navItems: NavItem[] = [
  {
    label: "Universities",
    href: "/universities",
    icon: Building2,
    items: [
      { label: "Top Universities", href: "/universities", icon: Award },
      { label: "Universities by Country", href: "/countries", icon: Globe },
      { label: "University Scholarships", href: "/universities?scholarships=with", icon: GraduationCap },
    ],
  },
  {
    label: "Scholarships",
    href: "/scholarships",
    icon: GraduationCap,
    items: [
      { label: "All Scholarships", href: "/scholarships", icon: GraduationCap },
      { label: "Fully Funded Scholarships", href: "/scholarships?funding=fully-funded", icon: Award },
      { label: "Undergraduate Scholarships", href: "/scholarships?degree=Undergraduate", icon: GraduationCap },
      { label: "Master's Scholarships", href: "/scholarships?degree=Master's", icon: GraduationCap },
      { label: "PhD Scholarships", href: "/scholarships?degree=PhD", icon: GraduationCap },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    icon: FileText,
    items: [
      { label: "Scholarship Guides", href: "/resources?category=guides", icon: BookOpen },
      { label: "Application Tips", href: "/resources?category=tips", icon: Award },
      { label: "Visa Guides", href: "/resources?category=visa", icon: Globe },
      { label: "FAQs", href: "/faq", icon: FileText },
    ],
  },
];

interface DirectoryNavbarProps {
  className?: string;
}

export function DirectoryNavbar({ className }: DirectoryNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const userName = useStore((s) => s.user?.name ?? null);
  const logout = useStore((s) => s.logout);

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const handleThemeToggle = toggleTheme;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur-sm transition-shadow",
        className
      )}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] lg:h-[80px]">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-3">
            <SiteLogo tone="dark" size={36} />
            <Link
              href="/universities"
              className="font-bold text-dark tracking-tight"
              aria-label="Global Academic Directory"
            >
              Global Academic<span className="text-primary-600"> Directory</span>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav
            className="hidden items-center gap-8 lg:flex"
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasDropdown = item.items && item.items.length > 0;
              const isOpen = openDropdown === item.label;

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasDropdown && setOpenDropdown(item.label)}
                  onMouseLeave={() => hasDropdown && setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (hasDropdown) {
                        setOpenDropdown(isOpen ? null : item.label);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "text-primary-600 underline underline-offset-4"
                        : "text-muted hover:text-primary-600 hover:bg-primary-light px-3 py-1.5 rounded-lg",
                      isOpen && "text-primary-600"
                    )}
                    aria-haspopup={hasDropdown ? "menu" : undefined}
                    aria-expanded={hasDropdown ? isOpen : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {hasDropdown && (
                      <ChevronDown
                        className="h-3.5 w-3.5 transition-transform duration-200"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {hasDropdown && isOpen && (
                    <div
                      className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-border bg-surface shadow-lg animate-slide-in py-2"
                      role="menu"
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {item.items?.map((subItem) => {
                        const SubIcon = subItem.icon as React.ComponentType<{ className?: string }> | undefined;
                        const isSubActive = isActive(subItem.href);
                        return (
                          <>
                            {SubIcon && <SubIcon className="h-4 w-4 shrink-0" />}
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                isSubActive
                                  ? "bg-primary-light text-primary-dark font-medium"
                                  : "text-muted hover:bg-primary-light hover:text-primary-dark"
                              )}
                              role="menuitem"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {subItem.label}
                            </Link>
                          </>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link href="/scholarships" className="hidden sm:flex">
              <Button variant="ghost" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                Search Scholarships
              </Button>
            </Link>

            <button
              type="button"
              onClick={handleThemeToggle}
              className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary-dark transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary-dark">
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden text-sm font-medium text-dark md:block">
                    {userName || "User"}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface sm:block"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            <button
              className="-mr-2 rounded-lg p-2 text-muted hover:bg-surface lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            id="mobile-nav"
            className="lg:hidden animate-slide-down border-t border-border"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="max-h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasDropdown = item.items && item.items.length > 0;
                const isOpen = openMobileDropdown === item.label;

                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => {
                        if (!hasDropdown) {
                          setIsMobileMenuOpen(false);
                        } else {
                          setOpenMobileDropdown(isOpen ? null : item.label);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-base font-medium",
                        isActive(item.href)
                          ? "bg-primary-light text-primary-dark"
                          : "text-muted hover:bg-surface"
                      )}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>
                      {hasDropdown && (
                        <ChevronDown
                          className="h-4 w-4 shrink-0 transition-transform duration-200"
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {isOpen && hasDropdown && (
                      <div className="mt-1 ml-8 space-y-1 border-l-2 border-border pl-3 animate-slide-down">
                        {item.items?.map((subItem) => {
                          const Icon = subItem.icon as React.ComponentType<{ className?: string }> | undefined;
                          const isSubActive = isActive(subItem.href);
                          return (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              onClick={() => {
                                setOpenMobileDropdown(null);
                                setIsMobileMenuOpen(false);
                              }}
                              className={cn(
                                "flex items-center gap-2 px-2 py-2 text-sm transition-colors rounded-r-lg",
                                isSubActive
                                  ? "bg-primary-light text-primary-dark font-medium"
                                  : "text-muted hover:bg-surface hover:text-dark"
                              )}
                            >
                              {Icon && <Icon className="h-4 w-4 shrink-0" />}
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Search className="h-4 w-4" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="primary" className="w-full justify-start gap-2">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
