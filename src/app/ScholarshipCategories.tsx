"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Award, GraduationCap, BookOpen, FlaskConical, Landmark, Globe, Briefcase, Microscope, Palette, Leaf, Brain, Database } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Layout";

const categories = [
  {
    id: "fully-funded",
    name: "Fully Funded Scholarships",
    description: "Complete financial coverage including tuition, living expenses, and travel",
    icon: Award,
    href: "/scholarships?funding=fully-funded",
    count: null,
    color: "bg-success-100 text-success-600",
    iconBg: "bg-success-100",
    iconColor: "text-success-600",
  },
  {
    id: "undergraduate",
    name: "Undergraduate Scholarships",
    description: "Bachelor's degree funding for international students worldwide",
    icon: GraduationCap,
    href: "/scholarships?degree=Undergraduate",
    count: null,
    color: "bg-primary-100 text-primary-600",
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
  },
  {
    id: "masters",
    name: "Master's Scholarships",
    description: "Postgraduate funding for master's programs across all disciplines",
    icon: BookOpen,
    href: "/scholarships?degree=Master's",
    count: null,
    color: "bg-blue-100 text-blue-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "phd",
    name: "PhD Scholarships",
    description: "Doctoral research funding with stipends and research grants",
    icon: FlaskConical,
    href: "/scholarships?degree=PhD",
    count: null,
    color: "bg-purple-100 text-purple-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "government",
    name: "Government Scholarships",
    description: "State-sponsored programs like Chevening, DAAD, Fulbright, and more",
    icon: Landmark,
    href: "/scholarships?type=government",
    count: null,
    color: "bg-amber-100 text-amber-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    id: "university",
    name: "University Scholarships",
    description: "Institutional awards from top universities worldwide",
    icon: Globe,
    href: "/scholarships?type=university",
    count: null,
    color: "bg-indigo-100 text-indigo-600",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    id: "research",
    name: "Research Scholarships",
    description: "Funding for research projects, fellowships, and academic research",
    icon: Microscope,
    href: "/scholarships?type=research",
    count: null,
    color: "bg-rose-100 text-rose-600",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    id: "international",
    name: "International Scholarships",
    description: "Cross-border opportunities for global study experiences",
    icon: Briefcase,
    href: "/scholarships?type=international",
    count: null,
    color: "bg-teal-100 text-teal-600",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
];

export function ScholarshipCategories() {
  return (
    <section className="bg-white py-16 sm:py-24" aria-labelledby="categories-heading">
      <Container>
        <div className="mb-8 sm:mb-12 flex flex-col justify-between sm:flex-row sm:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
              Scholarship Categories
            </div>
            <h2 id="categories-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-secondary-900">
              Explore Scholarships by Category
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary-500">
              Find the right scholarship type for your academic journey. Each category offers unique opportunities and benefits.
            </p>
          </div>
          <Link href="/scholarships" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            View all categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group rounded-2xl border border-secondary-200 bg-white p-6 shadow-card transition-all hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors" style={{ backgroundColor: category.iconBg?.replace("bg-", "") + "20", color: category.iconColor?.replace("text-", "") }}>
                <category.icon className="h-7 w-7" style={{ color: category.iconColor?.replace("text-", "") }} />
              </div>
              <h3 className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">{category.name}</h3>
              <p className="mt-2 text-sm text-secondary-600">{category.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${category.color}`}>
                  Explore
                  <ArrowRight className="h-3 w-3 ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}