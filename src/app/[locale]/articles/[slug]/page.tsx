import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Newspaper, Tag } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getArticleBySlug, getPublishedArticles } from "@/lib/queries";

function pick(locale: string, item: any, key: "title" | "excerpt" | "content") {
  const suffix = locale === "fa" ? "Fa" : locale === "tr" ? "Tr" : locale === "ar" ? "Ar" : "En";
  return item[`${key}${suffix}`] || item[`${key}En`] || item[`${key}Fa`] || "";
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [locale, article, latest] = await Promise.all([getLocale(), getArticleBySlug(slug), getPublishedArticles(5)]);
  if (!article) notFound();

  const title = pick(locale, article, "title");
  const excerpt = pick(locale, article, "excerpt");
  const content = pick(locale, article, "content");
  const related = latest.filter((item) => item.id !== article.id).slice(0, 3);
  const copy = locale === "fa"
    ? { back: "بازگشت به مجله", related: "پیشنهاد سردبیر", category: "دسته‌بندی", tags: "برچسب‌ها", empty: "محتوای این مقاله هنوز تکمیل نشده است." }
    : locale === "tr"
      ? { back: "Dergiye dön", related: "Editörün seçtikleri", category: "Kategori", tags: "Etiketler", empty: "Bu makalenin içeriği henüz tamamlanmadı." }
      : locale === "ar"
        ? { back: "العودة إلى المجلة", related: "اختيارات المحرر", category: "التصنيف", tags: "الوسوم", empty: "لم يكتمل محتوى هذه المقالة بعد." }
        : { back: "Back to magazine", related: "Editor picks", category: "Category", tags: "Tags", empty: "This article content has not been completed yet." };

  const date = article.publishedAt || article.createdAt;
  const tagList = String(article.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);

  return (
    <main className="flex-1 bg-[#f5f8fb] pb-16 pt-6 sm:pt-10">
      <Container>
        <Link href="/articles" className="inline-flex items-center gap-2 text-xs font-black text-[#5f6570] hover:text-[#001736]"><ArrowLeft className="h-4 w-4" />{copy.back}</Link>

        <header className="mx-auto mt-6 max-w-5xl text-center">
          <span className="inline-flex rounded-full bg-[#d6e3ff] px-3 py-1 text-[11px] font-black text-[#002b5b]">{article.category || "Hyper Doctor"}</span>
          <h1 className="mt-5 text-3xl font-black leading-[1.45] text-[#001736] sm:text-5xl">{title}</h1>
          {excerpt ? <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-[#5f6570] sm:text-base">{excerpt}</p> : null}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#747780]">
            {date ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{new Date(date).toLocaleDateString(locale)}</span> : null}
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />Hyper Doctor Magazine</span>
          </div>
        </header>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[#dfe4ea] bg-white shadow-[0_18px_50px_rgba(0,23,54,.06)]">
          <div className="relative aspect-[16/7] min-h-72 bg-[#001736]">
            {article.coverImage ? <Image src={article.coverImage} alt={title} fill className="object-cover" sizes="(min-width:1024px) 1200px, 100vw" priority /> : <div className="flex h-full min-h-72 items-center justify-center bg-[linear-gradient(135deg,#001736,#002b5b)]"><Newspaper className="h-20 w-20 text-[#82cfff]" /></div>}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <article className="rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_14px_38px_rgba(0,23,54,.045)] sm:p-9">
            {content ? (
              <div className="prose prose-slate max-w-none prose-headings:text-[#001736] prose-headings:font-black prose-p:leading-8 prose-a:text-[#ba0036]" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center"><BookOpen className="h-11 w-11 text-[#009dd8]" /><p className="mt-4 text-sm font-bold text-[#5f6570]">{copy.empty}</p></div>
            )}
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.045)]">
              <h2 className="text-sm font-black text-[#001736]">{copy.category}</h2>
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#5f6570]"><Newspaper className="h-4 w-4 text-[#009dd8]" />{article.category || "Hyper Doctor"}</p>
              {tagList.length > 0 ? <><h3 className="mt-5 text-sm font-black text-[#001736]">{copy.tags}</h3><div className="mt-3 flex flex-wrap gap-2">{tagList.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#f1f4f7] px-3 py-1.5 text-[11px] font-bold text-[#5f6570]"><Tag className="h-3 w-3" />{tag}</span>)}</div></> : null}
            </div>

            {related.length > 0 ? <div className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.045)]"><h2 className="text-sm font-black text-[#001736]">{copy.related}</h2><div className="mt-4 space-y-4">{related.map((item) => <Link key={item.id} href={`/articles/${item.slug}`} className="block border-b border-[#e0e3e6] pb-4 last:border-0 last:pb-0"><p className="line-clamp-2 text-xs font-black leading-6 text-[#001736]">{pick(locale, item, "title")}</p></Link>)}</div></div> : null}
          </aside>
        </div>
      </Container>
    </main>
  );
}
