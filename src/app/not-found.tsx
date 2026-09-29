import Link from "next/link";
import { Telescope } from "lucide-react";
import { Container } from "@/components/layout/Layout";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-16">
      <div className="bg-primary-50 rounded-full p-6 mb-6">
        <Telescope strokeWidth={1.5} className="h-16 w-16 text-primary-600" />
      </div>
      <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
        Page Not Found
      </h2>
      <p className="text-gray-600 text-lg mb-8 max-w-md">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed in the first place.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          href="/scholarships"
          className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md"
        >
          Browse Scholarships
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Return Home
        </Link>
      </div>
    </Container>
  );
}
