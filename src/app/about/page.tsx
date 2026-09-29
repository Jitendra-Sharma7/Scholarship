"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Globe, Users, TrendingUp, Heart, Mail } from "lucide-react";
import { Container } from "@/components/layout/Layout";

export default function AboutPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <Container size="md">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-950">About Global Scholarship Hub</h1>
          <p className="mt-3 text-base text-gray-600 max-w-2xl mx-auto">
            A global scholarship discovery platform helping students worldwide access verified funding opportunities for higher education.
          </p>
        </div>

        <div className="space-y-8">
          {/* Mission */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Global Scholarship Hub was created to democratize access to global education funding. We believe financial constraints should never prevent talented students from pursuing their academic dreams. By aggregating verified scholarships from governments, universities, foundations, and NGOs worldwide, we provide a centralized, trustworthy platform for scholarship discovery.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Verification First",
                description: "Every opportunity is manually verified with official sources. We never fabricate deadlines, requirements, or funding amounts.",
              },
              {
                icon: Globe,
                title: "Global Accessibility",
                description: "Students from every country deserve equal access to information about international education funding.",
              },
              {
                icon: Users,
                title: "Student-Centered",
                description: "We charge students nothing. Our revenue comes from ethical partnerships, never from manipulating search results.",
              },
              {
                icon: TrendingUp,
                title: "Transparent Matching",
                description: "Our AI matching shows clear reasons for recommendations. We distinguish informational matches from guaranteed eligibility.",
              },
            ].map((value) => (
              <div key={value.title} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <value.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{value.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Platform Impact (2026)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { label: "Active Scholarships", value: "1,200+" },
                { label: "Countries Covered", value: "85+" },
                { label: "Total Annual Funding", value: "$45M+" },
                { label: "Students Helped", value: "50,000+" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-extrabold text-primary-700">{stat.value}</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
            <Heart className="h-10 w-10 text-primary-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Built for Students, by Education Advocates</h2>
            <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
              Have questions, found an issue, or want to partner with us? We&apos;d love to hear from you.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Mail className="h-4 w-4" />
              Contact Us
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
