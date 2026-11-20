import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Layout";
import { getPublicUniversityById, getPublicScholarships } from "@/lib/data/public";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";
import JsonLd from "@/components/seo/JsonLd";
import { UniversityDetailClient } from "./UniversityDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const university = await getPublicUniversityById(id);
  
  if (!university) {
    return { title: "University Not Found" };
  }

  return pageMetadata({
    title: `${university.name} - University Profile & Scholarships`,
    description: university.description 
      ? `${university.description.slice(0, 150)}...` 
      : `Explore ${university.name} in ${university.country}. View rankings, tuition fees, admission requirements, and ${university.scholarshipCount} scholarship opportunities for international students.`,
    path: `/universities/${id}`,
    image: university.coverImage || university.logo ? {
      url: university.coverImage || university.logo!,
      alt: university.name,
    } : undefined,
  });
}

function universitySchema(university: Awaited<ReturnType<typeof getPublicUniversityById>>): Record<string, unknown> {
  const url = `https://globalscholarships.vercel.app/universities/${university?.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${url}#university`,
    name: university?.name,
    url: university?.website || url,
    logo: university?.logo ? {
      "@type": "ImageObject",
      url: university.logo,
    } : undefined,
    description: university?.description,
    address: university?.address ? {
      "@type": "PostalAddress",
      streetAddress: university.address,
      addressLocality: university?.city,
      addressCountry: university?.country,
    } : undefined,
    contactPoint: university?.contactEmail ? {
      "@type": "ContactPoint",
      telephone: university?.contactPhone,
      email: university?.contactEmail,
      contactType: "admissions",
      availableLanguage: "English",
    } : undefined,
    ...(university?.qsRanking && {
      "knowsAbout": `QS World Ranking #${university.qsRanking}`,
    }),
  };
}

export default async function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const university = await getPublicUniversityById(id);

  if (!university) {
    notFound();
  }

  // Fetch scholarships offered by this university
  const scholarshipsResult = await getPublicScholarships({ university: id, limit: 10, sort: "deadline" });

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <JsonLd data={universitySchema(university)} />
      <JsonLd
        data={itemListSchema({
          name: `Scholarships at ${university.name}`,
          items: scholarshipsResult.data.map((s) => ({
            name: s.title,
            path: `/scholarships/${s.slug}`,
            description: s.shortDescription,
          })),
        })}
      />
      <UniversityDetailClient 
        university={university} 
        initialScholarships={scholarshipsResult}
      />
    </div>
  );
}