"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, GraduationCap, Building2, Globe, BookOpen, Award, FileText, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store/useStore";

const navItems = [
  {
    label: "Scholarships",
    href: "/scholarships",
    icon: GraduationCap,
    items: [
      { label: "All Scholarships", href: "/scholarships", icon: GraduationCap },
      { label: "Fully Funded Scholarships", href: "/scholarships?funding=fully-funded", icon: Award },
      { label: "Partially Funded Scholarships", href: "/scholarships?funding=partial-tuition", icon: Award },
      { label: "Undergraduate Scholarships", href: "/scholarships?degree=Undergraduate", icon: GraduationCap },
      { label: "Master's Scholarships", href: "/scholarships?degree=Master's", icon: GraduationCap },
      { label: "PhD Scholarships", href: "/scholarships?degree=PhD", icon: GraduationCap },
      { label: "Postdoctoral Scholarships", href: "/scholarships?degree=Postdoctoral", icon: GraduationCap },
      { label: "Government Scholarships", href: "/scholarships?provider=government", icon: Building2 },
    ],
  },
  {
    label: "Universities",
    href: "/universities",
    icon: Building2,
    items: [
      { label: "Top Universities", href: "/universities", icon: Award },
      { label: "Universities by Country", href: "/universities?view=by-country", icon: Globe },
      { label: "Universities by Ranking", href: "/universities?view=by-ranking", icon: Award },
      { label: "University Scholarships", href: "/universities?view=scholarships", icon: GraduationCap },
      { label: "Popular Universities", href: "/universities?view=popular", icon: Building2 },
    ],
  },
  {
    label: "Countries",
    href: "/countries",
    icon: Globe,
    items: [
      { label: "Scholarships in United Kingdom", href: "/scholarships?country=gb", icon: Globe },
      { label: "Scholarships in USA", href: "/scholarships?country=us", icon: Globe },
      { label: "Scholarships in Canada", href: "/scholarships?country=ca", icon: Globe },
      { label: "Scholarships in Australia", href: "/scholarships?country=au", icon: Globe },
      { label: "Scholarships in Germany", href: "/scholarships?country=de", icon: Globe },
      { label: "Scholarships in Europe", href: "/scholarships?region=europe", icon: Globe },
      { label: "View All Countries", href: "/countries", icon: Globe },
    ],
  },
  {
    label: "Fields of Study",
    href: "/fields",
    icon: BookOpen,
    items: [
      { label: "Engineering & Technology", href: "/fields/engineering", icon: Building2 },
      { label: "Computer Science & IT", href: "/fields/computer-science", icon: GraduationCap },
      { label: "Business & Management", href: "/fields/business", icon: Building2 },
      { label: "Medicine & Health Sciences", href: "/fields/medicine", icon: Award },
      { label: "Social Sciences", href: "/fields/social-sciences", icon: BookOpen },
      { label: "Arts & Humanities", href: "/fields/arts", icon: BookOpen },
      { label: "Natural Sciences", href: "/fields/natural-sciences", icon: GraduationCap },
      { label: "Law", href: "/fields/law", icon: FileText },
    ],
  },
  {
    label: "Fully Funded",
    href: "/fully-funded",
    icon: Award,
    items: [
      { label: "Fully Funded Bachelor's", href: "/fully-funded?degree=Undergraduate", icon: GraduationCap },
      { label: "Fully Funded Master's", href: "/fully-funded?degree=Master's", icon: GraduationCap },
      { label: "Fully Funded PhD", href: "/fully-funded?degree=PhD", icon: GraduationCap },
      { label: "Government-Funded Scholarships", href: "/fully-funded?provider=government", icon: Building2 },
      { label: "International Scholarships", href: "/fully-funded?scope=international", icon: Globe },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    icon: FileText,
    items: [
      { label: "Scholarship Guides", href: "/resources?category=guides", icon: BookOpen },
      { label: "Application Tips", href: "/resources?category=tips", icon: Award },
      { label: "SOP & Personal Statement", href: "/resources?category=sop", icon: FileText },
      { label: "Recommendation Letters", href: "/resources?category=references", icon: FileText },
      { label: "IELTS & TOEFL Preparation", href: "/resources?category=english", icon: GraduationCap },
      { label: "Visa Guides", href: "/resources?category=visa", icon: Globe },
      { label: "FAQs", href: "/faq", icon: FileText },
    ],
  },
];

export function DirectoryHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pathname = usePathname();
  const router = useRouter();

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
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      let clickedInside = false;
      
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && ref.contains(target)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const handleMobileItemClick = () => {
    setIsMobileMenuOpen(false);
    setOpenMobileDropdown(null);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/95 backdrop-blur-sm transition-shadow",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <SiteLogo tone="dark" size={40} />

          <nav className="hidden items-center gap-1 lg:flex" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              const ref = (el: HTMLDivElement | null) => {
                dropdownRefs.current[item.label] = el;
              };

              return (
                <div key={item.label} className="relative" ref={ref}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                    )}
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  </Link>

                  {openDropdown === item.label && (
                    <div
                      ref={ref}
                      className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-secondary-200 bg-white py-2 shadow-lg animate-slide-in"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                      role="menu"
                    >
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href + "/");
                        return (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                              isSubActive
                                ? "bg-primary-50 text-primary-700"
                                : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                            )}
                            role="menuitem"
                          >
                            <SubIcon className="h-4 w-4 shrink-0" />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/scholarships" className="hidden sm:flex">
              <Button variant="ghost" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                Search Scholarships
              </Button>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden text-sm font-medium text-secondary-700 md:block">
                    {userName || "User"}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-lg px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-100 sm:block"
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
              className="-mr-2 rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 lg:hidden"
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
          <div id="mobile-nav" className="lg:hidden animate-slide-down border-t border-secondary-200">
            <div className="max-h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                const isOpen = openMobileDropdown === item.label;

                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => setOpenMobileDropdown(isOpen ? null : item.label)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-base font-medium",
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-secondary-600 hover:bg-secondary-100"
                      )}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>

                    {isOpen && (
                      <div className="mt-1 ml-8 space-y-1 border-l-2 border-secondary-200 pl-3 animate-slide-down">
                        {item.items.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href + "/");
                          return (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              onClick={handleMobileItemClick}
                              className={cn(
                                "flex items-center gap-2 px-2 py-2 text-sm transition-colors",
                                isSubActive
                                  ? "bg-primary-50 text-primary-700"
                                  : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                              )}
                            >
                              <SubIcon className="h-4 w-4 shrink-0" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="mt-4 flex flex-col gap-2 border-t border-secondary-200 pt-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" onClick={handleMobileItemClick}>
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
                    <Link href="/auth/login" onClick={handleMobileItemClick}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={handleMobileItemClick}>
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