import { getLocale } from "next-intl/server";
import { PageSectionRenderer } from "@/components/content/page-section-renderer";
import { getPageBySlug } from "@/lib/queries";
import { toPublicPageSections } from "@/lib/content/page-sections";

export default async function HomePage() {
  const localeValue = await getLocale();
  const locale = localeValue === "en" ? "en" : "fa";
  const page = await getPageBySlug("home");

  // Home is CMS-first. A missing/unpublished home record renders an empty main
  // instead of silently falling back to hard-coded marketing claims.
  if (!page) return <main className="flex-1" />;

  const sections = toPublicPageSections(page.sections, locale);
  return (
    <main className="flex-1">
      <PageSectionRenderer sections={sections} locale={locale} />
    </main>
  );
}
