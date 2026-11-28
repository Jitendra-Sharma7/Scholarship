"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Clock, Euro, MapPin, BookOpen } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { PublicScholarship } from "@/lib/data/public";

interface CourseCardProps {
  course: PublicScholarship;
}

function formatTuition(amount: number | null, currency: string | null): string {
  if (!amount) return "Not specified";
  const curr = currency || "EUR";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: curr,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(duration: string | null): string {
  if (!duration) return "Not specified";
  return duration;
}

export function CourseCard({ course }: CourseCardProps) {
  const primaryDegree = course.degreeLevels[0] || "Not specified";
  const primaryField = course.fields[0] || "Not specified";
  const studyMode = course.studyMode || "Not specified";

  return (
    <Link
      href={`/scholarships/${course.slug}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-secondary-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary-300 hover:shadow-card-hover"
    >
      {/* Course Image/University Logo */}
      {(course.coverImage || course.logo) && (
        <div className="mb-4 -mx-5 -mt-5 rounded-t-2xl overflow-hidden">
          <Image
            src={course.coverImage || course.logo || ""}
            alt={course.universityName || "University"}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            width={480}
            height={160}
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      <div>
        {/* Top Badges & Meta */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Course Type Badge */}
            {course.studyType && (
              <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                {course.studyType}
              </span>
            )}
            {/* Funding Badge */}
            <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs uppercase tracking-wider ${
              course.fundingType === "fully-funded"
                ? "bg-success-50 text-success-700 border-success-200 font-semibold"
                : course.fundingType === "fully-tuition"
                ? "bg-primary-50 text-primary-700 border-primary-200"
                : "bg-warning-50 text-warning-700 border-warning-200"
            }`}>
              {course.fundingType.replace("-", " ")}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold leading-snug text-secondary-900 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h3>

        {/* University & Location */}
        <p className="mt-1 text-sm text-secondary-600">
          {course.universityName || course.providerName || "Official Organization"}
          {course.city && ` • ${course.city}`}
          {course.countryName && `, ${course.countryName}`}
        </p>

        {/* Key Info Pills */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-secondary-600 sm:grid-cols-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2">
            <GraduationCap className="h-3.5 w-3.5 text-secondary-400 shrink-0" />
            <span className="truncate" title={course.degreeLevels.join(", ")}>
              {primaryDegree}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2">
            <BookOpen className="h-3.5 w-3.5 text-secondary-400 shrink-0" />
            <span className="truncate" title={course.fields.join(", ")}>
              {primaryField}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2">
            <CountryFlag
              code={course.countryCode}
              name={course.countryName ?? undefined}
              size="xs"
            />
            <span className="truncate" title={course.countryName || "Global"}>
              {course.countryName || "Global"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2">
            <Clock className="h-3.5 w-3.5 text-secondary-400 shrink-0" />
            <span className="truncate">{formatDuration(course.duration)}</span>
          </div>

          {course.fundingAmount && (
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2 sm:col-span-2">
              <Euro className="h-3.5 w-3.5 text-secondary-400 shrink-0" />
              <span className="truncate font-medium">{formatTuition(course.fundingAmount, course.currency)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2 sm:col-span-2">
            <MapPin className="h-3.5 w-3.5 text-secondary-400 shrink-0" />
            <span className="truncate capitalize">{studyMode.toLowerCase()}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="mt-3 text-xs leading-relaxed text-secondary-500 line-clamp-2">
          {course.shortDescription || course.description}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 border-t border-secondary-100 pt-3.5 flex items-center justify-between gap-2">
        <span className="text-xs text-secondary-500">
          {course.intake && `Intake: ${course.intake}`}
        </span>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}