"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, GraduationCap, Building2, Globe, BookOpen, Award, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { Container, Flex } from "@/components/layout/Layout";
import { useStore } from "@/lib/store/useStore";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label?: string;
  href?: string;
  divider?: boolean;
  section?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  dropdown?: DropdownItem[];
}

const navItems: NavItem[] = [
  {
    label: "Scholarships",
    href: "/scholarships",
    icon: GraduationCap,
    dropdown: [
      { label: "All Scholarships", href: "/scholarships" },
      { divider: true, section: "By Funding Type" },
      { label: "Fully Funded Scholarships", href: "/scholarships?funding=fully-funded" },
      { label: "Partially Funded Scholarships", href: "/scholarships?funding=partial-tuition" },
      { label: "Full Tuition Scholarships", href: "/scholarships?funding=fully-tuition" },
      { label: "Stipend Scholarships", href: "/scholarships?funding=stipend" },
      { label: "Mixed Funding Scholarships", href: "/scholarships?funding=mixed" },
      { divider: true, section: "By Degree Level" },
      { label: "Undergraduate Scholarships", href: "/scholarships?degree=Undergraduate" },
      { label: "Master's Scholarships", href: "/scholarships?degree=Master's" },
      { label: "PhD Scholarships", href: "/scholarships?degree=PhD" },
      { label: "Doctoral Scholarships", href: "/scholarships?degree=Doctoral" },
      { label: "MBA Scholarships", href: "/scholarships?degree=MBA" },
      { divider: true, section: "Popular Searches" },
      { label: "Scholarships with No Application Fee", href: "/scholarships?applicationFee=free" },
      { label: "Closing Soon", href: "/scholarships?status=closing soon" },
      { label: "Recently Added", href: "/scholarships?sort=newest" },
    ],
  },
  {
    label: "Universities",
    href: "/universities",
    icon: Building2,
    dropdown: [
      { label: "All Universities", href: "/universities" },
      { divider: true, section: "By Category" },
      { label: "Universities with Scholarships", href: "/universities?scholarships=with" },
      { label: "Universities with Fully Funded Scholarships", href: "/universities?scholarships=fully-funded" },
      { label: "Universities by Country", href: "/universities?sort=country" },
      { divider: true, section: "By Study Level" },
      { label: "Undergraduate Programs", href: "/universities?studyLevel=ug" },
      { label: "Postgraduate Programs", href: "/universities?studyLevel=pg" },
      { label: "PhD / Doctoral Programs", href: "/universities?studyLevel=phd" },
    ],
  },
  {
    label: "Countries",
    href: "/countries",
    icon: Globe,
  },
  {
    label: "Fields",
    href: "/fields",
    icon: BookOpen,
  },
  {
    label: "Fully Funded",
    href: "/fully-funded",
    icon: Award,
  },
  {
    label: "Resources",
    href: "/resources",
    icon: FileText,
    dropdown: [
      { label: "All Resources & Guides", href: "/resources" },
      { divider: true, section: "Application Guides" },
      { label: "How to Find Scholarships", href: "/resources/how-to-find-fully-funded-scholarships" },
      { label: "Writing Statement of Purpose", href: "/resources/writing-a-strong-statement-of-purpose" },
      { label: "Recommendation Letters Guide", href: "/resources/complete-guide-to-recommendation-letters" },
      { label: "Scholarship Interview Prep", href: "/resources/how-to-prepare-for-scholarship-interviews" },
      { label: "Common Application Mistakes", href: "/resources/common-scholarship-application-mistakes" },
      { divider: true, section: "Language Tests" },
      { label: "IELTS vs TOEFL Comparison", href: "/resources/ielts-vs-toefl-which-test" },
      { divider: true, section: "Financial Aid" },
      { label: "Financial Aid vs Scholarships", href: "/resources/financial-aid-vs-scholarships" },
      { label: "Understanding Funding Types", href: "/resources/understanding-scholarship-funding-types" },
      { divider: true, section: "Visa Information" },
      { label: "Student Visa Requirements by Country", href: "/resources/student-visa-requirements-by-country" },
      { divider: true, section: "Organisation & Strategy" },
      { label: "Reading Listings Critically", href: "/resources/reading-a-scholarship-listing-critically" },
      { divider: true, section: "Other Resources" },
      { label: "Frequently Asked Questions", href: "/faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openDropdown = (label: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDropdown(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const userName = useStore((s) => s.user?.name ?? null);
  const logout = useStore((s) => s.logout);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setActiveDropdown(null);
      setMobileOpenDropdown(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    let clickedInside = false;

    Object.values(dropdownRefs.current).forEach((ref) => {
      if (ref && ref.contains(target)) {
        clickedInside = true;
      }
    });

    const mobileMenu = document.getElementById("mobile-nav");
    if (mobileMenu && mobileMenu.contains(target)) {
      clickedInside = true;
    }

    const mobileToggle = document.querySelector('[aria-label="Toggle menu"]');
    if (mobileToggle && mobileToggle.contains(target)) {
      clickedInside = true;
    }

    if (!clickedInside) {
      setActiveDropdown(null);
      setMobileOpenDropdown(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setActiveDropdown(null);
      setMobileOpenDropdown(null);
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const renderDesktopItem = (item: NavItem) => {
    const hasDropdown = item.dropdown && item.dropdown.length > 0;
    const isOpen = activeDropdown === item.label;

    if (hasDropdown) {
      return (
        <div
          key={item.label}
          className="relative"
          role="none"
          ref={(el) => { dropdownRefs.current[item.label] = el; }}
          onMouseEnter={() => openDropdown(item.label)}
          onMouseLeave={() => scheduleClose()}
        >
          <button
            type="button"
            onClick={() => setActiveDropdown(isOpen ? null : item.label)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary-50 text-primary-700"
                : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900",
              isOpen && "bg-primary-50 text-primary-700"
            )}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-controls={`nav-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {item.label}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>

          {isOpen && (
            <div
              id={`nav-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="absolute left-0 top-full min-w-[220px] rounded-xl border border-secondary-200 bg-white py-2 shadow-card-elevated z-50 animate-slide-in"
              role="menu"
              onMouseEnter={() => openDropdown(item.label)}
              onMouseLeave={() => scheduleClose()}
            >
              <Link
                href={item.href}
                role="menuitem"
                className="flex items-center gap-3 border-b border-secondary-100 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                onClick={() => setActiveDropdown(null)}
              >
                View all {item.label}
              </Link>
              {item.dropdown?.map((ddItem, idx) => {
                if (ddItem.divider) {
                  return <div key={`divider-${idx}`} className="border-t border-secondary-100 my-1" role="separator" />;
                }
                if (ddItem.section) {
                  return <div key={`section-${idx}`} className="px-4 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wide">{ddItem.section}</div>;
                }
                return (
                  <Link
                    key={ddItem.label}
                    href={ddItem.href!}
                    role="menuitem"
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 transition-colors",
                      isActive(ddItem.href!)
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "hover:bg-secondary-50 hover:text-secondary-900"
                    )}
                    onClick={() => setActiveDropdown(null)}
                  >
                    <span className="relative">
                      {isActive(ddItem.href!) && (
                        <span className="absolute -left-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary-600" />
                      )}
                      {ddItem.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive(item.href)
            ? "bg-primary-50 text-primary-700"
            : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
        )}
        aria-current={isActive(item.href) ? "page" : undefined}
      >
        {item.label}
      </Link>
    );
  };

  const renderMobileItem = (item: NavItem) => {
    const Icon = item.icon;
    const hasDropdown = item.dropdown && item.dropdown.length > 0;
    const isMobileOpen = mobileOpenDropdown === item.label;

    if (hasDropdown) {
      return (
        <div key={item.label} className="relative">
          <button
            type="button"
            onClick={() => setMobileOpenDropdown(isMobileOpen ? null : item.label)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-left",
              isActive(item.href)
                ? "bg-primary-50 text-primary-700"
                : "text-secondary-600 hover:bg-secondary-100"
            )}
            aria-haspopup
            aria-expanded={isMobileOpen}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
            <ChevronRight
              className={cn(
                "ml-auto h-5 w-5 shrink-0 transition-transform duration-200",
                isMobileOpen && "rotate-90"
              )}
              aria-hidden="true"
            />
          </button>

          <div
            ref={(el) => { dropdownRefs.current[`mobile-${item.label}`] = el; }}
            className={cn(
              "overflow-hidden transition-all duration-200 ease-out",
              isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
            role="menu"
          >
            <div className="ml-8 mt-1 space-y-0.5 pl-2 border-l border-secondary-200">
              <Link
                href={item.href}
                role="menuitem"
                onClick={() => {
                  setMobileOpenDropdown(null);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
              >
                View all {item.label}
              </Link>
              {item.dropdown?.map((ddItem, idx) => {
                if (ddItem.divider) {
                  return <div key={`divider-${idx}`} className="border-t border-secondary-100 my-1" role="separator" />;
                }
                if (ddItem.section) {
                  return <div key={`section-${idx}`} className="px-3 py-1.5 text-xs font-semibold text-secondary-500 uppercase tracking-wide">{ddItem.section}</div>;
                }
                return (
                  <Link
                    key={ddItem.label}
                    href={ddItem.href!}
                    role="menuitem"
                    onClick={() => {
                      setMobileOpenDropdown(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 transition-colors rounded-r-lg",
                      isActive(ddItem.href!)
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "hover:bg-secondary-50 hover:text-secondary-900"
                    )}
                  >
                    <span className="relative">
                      {isActive(ddItem.href!) && (
                        <span className="absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary-600" />
                      )}
                      {ddItem.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-left",
          isActive(item.href)
            ? "bg-primary-50 text-primary-700"
            : "text-secondary-600 hover:bg-secondary-100"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/95 backdrop-blur-sm transition-shadow",
        isScrolled && "shadow-sm"
      )}
      onKeyDown={handleKeyDown}
    >
      <Container>
        <Flex justify="between" align="center" className="h-16 lg:h-20">
          <SiteLogo tone="dark" size={40} />

          <nav className="hidden items-center gap-1 lg:flex" role="menubar">
            {navItems.map(renderDesktopItem)}
          </nav>

          <Flex align="center" gap="sm">
            {isAuthenticated ? (
              <Flex align="center" gap="sm">
                <Link href="/dashboard">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary-100"
                    aria-label={`Profile for ${userName || "User"}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="hidden text-sm font-medium text-secondary-700 md:block">
                      {userName || "User"}
                    </span>
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-lg px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-100 sm:block"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </Flex>
            ) : (
              <Flex align="center" gap="sm">
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
              </Flex>
            )}
            <button
              className="-mr-2 rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </Flex>
        </Flex>

        {isMobileMenuOpen && (
          <div
            id="mobile-nav"
            className="lg:hidden animate-slide-down"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="max-h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto border-t border-secondary-200 py-4 lg:max-h-none">
              {navItems.map(renderMobileItem)}
              <div className="mt-4 flex flex-col gap-2 border-t border-secondary-200 pt-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
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
      </Container>
    </header>
  );
}
