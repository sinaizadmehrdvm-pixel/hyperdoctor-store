import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageForm } from "@/components/admin/page-form";
import { PageSectionEditor } from "@/components/admin/page-section-editor";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.page.findUnique({
    where: { id },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">ویرایش صفحه</h1>
      <PageForm page={page} />
      <PageSectionEditor pageId={page.id} sections={page.sections} />
    </div>
  );
}
