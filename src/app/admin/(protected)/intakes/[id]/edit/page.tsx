import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui/primitives";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IntakeForm } from "@/components/admin/intakes/IntakeForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intake = await prisma.intake.findUnique({ where: { id }, select: { name: true } });
  return { title: intake ? `Edit ${intake.name}` : "Not found" };
}

export default async function AdminIntakeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await requireStaff();

  const intake = await prisma.intake.findUnique({ where: { id } });
  if (!intake) notFound();

  const searchParams = new URLSearchParams();
  searchParams.set("saved", "1");

  return (
    <>
      <PageHeader
        title={intake.name}
        description="Edit this academic intake period."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Intakes", href: "/admin/intakes" },
          { label: intake.name },
        ]}
      />

      <IntakeForm mode="edit" intake={intake} />
    </>
  );
}