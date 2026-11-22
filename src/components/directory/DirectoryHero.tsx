"use client";

import { GraduationCap, Globe, BookOpen } from "lucide-react";

interface DirectoryHeroProps {
  subtitle?: string;
}

export function DirectoryHero({ subtitle }: DirectoryHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div className="absolute inset-0 bg-[url('/globe.svg')] bg-center bg-no-repeat opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-transparent" />
      
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] max-w-[700px] opacity-10">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        </svg>
      </div>

      <div className="absolute right-8 top-20 w-72 h-72 opacity-10">
        <GraduationCap className="w-full h-full text-white" />
      </div>
      <div className="absolute right-24 bottom-20 w-48 h-48 opacity-10">
        <Globe className="w-full h-full text-white" />
      </div>
      <div className="absolute right-48 top-40 w-40 h-40 opacity-10">
        <BookOpen className="w-full h-full text-white" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white mb-4">
            <GraduationCap className="h-4 w-4" />
            Scholarship Directory
          </span>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl leading-tight">
            Scholarship Directory
          </h1>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl">
            {subtitle || "Explore thousands of scholarships from top universities worldwide. Filter by country, field, degree level, and funding type to find your perfect opportunity."}
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}