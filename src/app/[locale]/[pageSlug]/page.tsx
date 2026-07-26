import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { getPageBySlug } from "@/lib/queries";

export default async function CmsPage({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = await params;
  const locale = await getLocale();
  const page = await getPageBySlug(pageSlug);
  if (!page) notFound();

  const title = locale === "fa" ? page.titleFa : page.titleEn;
  const content = locale === "fa" ? page.contentFa : page.contentEn;

  return (
    <main className="flex-1 py-12">
      <Container className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        <div
          className="prose prose-slate mt-8 max-w-none prose-headings:font-bold prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Container>
    </main>
  );
}
