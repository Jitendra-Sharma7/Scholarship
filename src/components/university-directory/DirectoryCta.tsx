"use client";

import Link from "next/link";
import { ArrowRight, Mail, Phone, Globe } from "lucide-react";

export function DirectoryCta() {
  return (
    <section className="mt-16 lg:mt-24 overflow-hidden">
      <div className="rounded-2xl border border-[#1747D1] bg-gradient-to-br from-[#1747D1] via-[#102B63] to-[#0f1b3d] p-8 lg:p-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Globe className="h-6 w-6 text-[#1747D1]" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
          Your Global Education Partner
        </h2>
        <p className="text-[#d7e3ff] text-lg leading-relaxed max-w-[620px] mx-auto mb-8 opacity-90">
          Get expert guidance, compare options, and take the next step towards
          your dream university.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1747D1] shadow-lg transition-all hover:bg-[#FFFFFF]/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#102B63]"
          >
            <ArrowRight className="h-4 w-4" />
            Contact Us
          </Link>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-[#9db2e8]/80">
          <span className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            support@globalscholarships.example
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-4 w-4" />
            +1 (555) 010-2030
          </span>
        </div>
      </div>
    </section>
  );
}
