import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageForm } from "@/components/admin/page-form";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">ویرایش صفحه</h1>
      <PageForm page={page} />
    </div>
  );
}
