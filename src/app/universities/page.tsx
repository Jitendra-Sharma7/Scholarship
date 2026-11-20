import { GraduationCap } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { UniversitiesBrowser } from "@/components/public/UniversitiesBrowser";
import { getPublicUniversities } from "@/lib/data/public";
import { prisma } from "@/lib/prisma";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

export const metadata = pageMetadata({
  title: "University Directory - Top Universities Offering Scholarships",
  description:
    "Browse universities that offer scholarships to international students. Compare rankings, tuition, admission requirements and the scholarship schemes available at each institution.",
  path: "/universities",
});

export default async function UniversitiesPage() {
  const [universities, countriesResult] = await Promise.all([
    getPublicUniversities(),
    prisma.university.findMany({
      where: { publishStatus: "PUBLISHED", deletedAt: null },
      select: { country: { select: { name: true } } },
      distinct: ["countryId"],
      orderBy: { country: { name: "asc" } },
    }),
  ]);

  const countries = countriesResult
    .map((u) => u.country?.name)
    .filter((c): c is string => Boolean(c))
    .sort();

  return (
    <div className="bg-gray-50/50 min-h-screen py-10">
      <JsonLd
        data={itemListSchema({
          name: "Universities offering scholarships",
          items: universities.map((u) => ({
            name: u.name,
            path: `/universities/${u.id}`,
            description: u.description,
          })),
        })}
      />
      <Container>
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 mb-3">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Academic Institutions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">
            Global University Directory
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Explore world-renowned research universities and their dedicated international student
            scholarship schemes.
          </p>
        </div>

        <UniversitiesBrowser universities={universities} countries={countries} />
      </Container>
    </div>
  );
}
