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
  label: string;
  href: string;
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
      { label: "Fully Funded Scholarships", href: "/scholarships?funding=fully" },
      { label: "Partially Funded Scholarships", href: "/scholarships?funding=partially" },
      { label: "Undergraduate Scholarships", href: "/scholarships?level=undergraduate" },
      { label: "Master's Scholarships", href: "/scholarships?level=masters" },
      { label: "PhD Scholarships", href: "/scholarships?level=phd" },
      { label: "Postdoctoral Scholarships", href: "/scholarships?level=postdoc" },
      { label: "Government Scholarships", href: "/scholarships?type=government" },
    ],
  },
  {
    label: "Universities",
    href: "/universities",
    icon: Building2,
    dropdown: [
      { label: "Top Universities", href: "/universities?sort=ranking" },
      { label: "Universities by Country", href: "/universities/by-country" },
      { label: "Universities by Ranking", href: "/universities/by-ranking" },
      { label: "University Scholarships", href: "/universities/scholarships" },
      { label: "Popular Universities", href: "/universities?sort=popular" },
    ],
  },
  {
    label: "Countries",
    href: "/countries",
    icon: Globe,
    dropdown: [
      { label: "Scholarships in United Kingdom", href: "/countries/united-kingdom" },
      { label: "Scholarships in USA", href: "/countries/usa" },
      { label: "Scholarships in Canada", href: "/countries/canada" },
      { label: "Scholarships in Australia", href: "/countries/australia" },
      { label: "Scholarships in Germany", href: "/countries/germany" },
      { label: "Scholarships in Europe", href: "/countries/europe" },
      { label: "View All Countries", href: "/countries" },
    ],
  },
  {
    label: "Fields",
    href: "/fields",
    icon: BookOpen,
    dropdown: [
      { label: "Engineering & Technology", href: "/fields/engineering-technology" },
      { label: "Computer Science & IT", href: "/fields/computer-science-it" },
      { label: "Business & Management", href: "/fields/business-management" },
      { label: "Medicine & Health Sciences", href: "/fields/medicine-health" },
      { label: "Social Sciences", href: "/fields/social-sciences" },
      { label: "Arts & Humanities", href: "/fields/arts-humanities" },
      { label: "Natural Sciences", href: "/fields/natural-sciences" },
      { label: "Law", href: "/fields/law" },
    ],
  },
  {
    label: "Fully Funded",
    href: "/fully-funded",
    icon: Award,
    dropdown: [
      { label: "Fully Funded Bachelor's", href: "/fully-funded?level=bachelors" },
      { label: "Fully Funded Master's", href: "/fully-funded?level=masters" },
      { label: "Fully Funded PhD", href: "/fully-funded?level=phd" },
      { label: "Government-Funded Scholarships", href: "/fully-funded?type=government" },
      { label: "International Scholarships", href: "/fully-funded?type=international" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    icon: FileText,
    dropdown: [
      { label: "Scholarship Guides", href: "/resources/guides" },
      { label: "Application Tips", href: "/resources/application-tips" },
      { label: "SOP & Personal Statement", href: "/resources/sop-personal-statement" },
      { label: "Recommendation Letters", href: "/resources/recommendation-letters" },
      { label: "IELTS & TOEFL Preparation", href: "/resources/ielts-toefl" },
      { label: "Visa Guides", href: "/resources/visa-guides" },
      { label: "FAQs", href: "/faq" },
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
            {navItems.map((item) => {
              const hasDropdown = item.dropdown && item.dropdown.length > 0;
              const isOpen = activeDropdown === item.label;

              return (
                <div
                  key={item.label}
                  className="relative"
                  role="none"
                  ref={(el) => { dropdownRefs.current[item.label] = el; }}
                >
                  <button
                    type="button"
                    onClick={() => hasDropdown && setActiveDropdown(isOpen ? null : item.label)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary-50 text-primary-700"
                        : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900",
                      isOpen && "bg-primary-50 text-primary-700"
                    )}
                    aria-haspopup={hasDropdown ? "menu" : undefined}
                    aria-expanded={hasDropdown ? isOpen : undefined}
                    aria-controls={hasDropdown ? `nav-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}` : undefined}
                  >
                    {item.label}
                    {hasDropdown && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {hasDropdown && isOpen && (
                    <div
                      id={`nav-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="absolute left-0 top-full min-w-[220px] rounded-xl border border-secondary-200 bg-white py-2 shadow-card-elevated z-50 animate-slide-in"
                      role="menu"
                    >
                      <Link
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-3 border-b border-secondary-100 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                        onClick={() => setActiveDropdown(null)}
                      >
                        View all {item.label}
                      </Link>
                      {item.dropdown?.map((ddItem) => (
                        <Link
                          key={ddItem.label}
                          href={ddItem.href}
                          role="menuitem"
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 transition-colors",
                            isActive(ddItem.href)
                              ? "bg-primary-50 text-primary-700 font-medium"
                              : "hover:bg-secondary-50 hover:text-secondary-900"
                          )}
                          onClick={() => setActiveDropdown(null)}
                        >
                          <span className="relative">
                            {isActive(ddItem.href) && (
                              <span className="absolute -left-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary-600" />
                            )}
                            {ddItem.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <Flex align="center" gap="sm">
            <Link href="/scholarships" className="hidden sm:flex">
              <Button variant="ghost" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                Search Scholarships
              </Button>
            </Link>
            {isAuthenticated ? (
              <Flex align="center" gap="sm">
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary-100">
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasDropdown = item.dropdown && item.dropdown.length > 0;
                const isMobileOpen = mobileOpenDropdown === item.label;

                return (
                  <div key={item.label} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasDropdown) {
                          setIsMobileMenuOpen(false);
                        } else {
                          setMobileOpenDropdown(isMobileOpen ? null : item.label);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-left",
                        isActive(item.href)
                          ? "bg-primary-50 text-primary-700"
                          : "text-secondary-600 hover:bg-secondary-100"
                      )}
                      aria-haspopup={hasDropdown}
                      aria-expanded={isMobileOpen}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                      {hasDropdown && (
                        <ChevronRight
                          className={cn(
                            "ml-auto h-5 w-5 shrink-0 transition-transform duration-200",
                            isMobileOpen && "rotate-90"
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {hasDropdown && (
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
                          {item.dropdown?.map((ddItem) => (
                            <Link
                              key={ddItem.label}
                              href={ddItem.href}
                              role="menuitem"
                              onClick={() => {
                                setMobileOpenDropdown(null);
                                setIsMobileMenuOpen(false);
                              }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 transition-colors rounded-r-lg",
                                isActive(ddItem.href)
                                  ? "bg-primary-50 text-primary-700 font-medium"
                                  : "hover:bg-secondary-50 hover:text-secondary-900"
                              )}
                            >
                              <span className="relative">
                                {isActive(ddItem.href) && (
                                  <span className="absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary-600" />
                                )}
                                {ddItem.label}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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