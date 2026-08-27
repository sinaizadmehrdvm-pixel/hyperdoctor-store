import { getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowUpLeft, BookOpen, Clock3, Newspaper } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getPublishedArticles } from "@/lib/queries";

function pick(locale: string, item: any, key: "title" | "excerpt") {
  const suffix = locale === "fa" ? "Fa" : locale === "tr" ? "Tr" : locale === "ar" ? "Ar" : "En";
  return item[`${key}${suffix}`] || item[`${key}En`] || item[`${key}Fa`] || "";
}

export default async function ArticlesPage() {
  const [locale, articles] = await Promise.all([getLocale(), getPublishedArticles(24)]);
  const copy = locale === "fa"
    ? { eyebrow: "مجله علمی Hyper Doctor", title: "دانش تخصصی برای انتخاب و استفاده بهتر", body: "مقالات علمی و کاربردی درباره تجهیزات تنفسی، تست خواب، مراقبت در منزل و فناوری‌های پزشکی.", empty: "هنوز مقاله‌ای در مجله منتشر نشده است.", read: "مطالعه کامل", latest: "آخرین مقالات" }
    : locale === "tr"
      ? { eyebrow: "Hyper Doctor Bilim Dergisi", title: "Daha doğru seçim ve kullanım için uzman bilgi", body: "Solunum cihazları, uyku testi, evde bakım ve medikal teknolojiler hakkında bilimsel içerikler.", empty: "Henüz yayımlanmış makale yok.", read: "Devamını oku", latest: "Son yazılar" }
      : locale === "ar"
        ? { eyebrow: "مجلة Hyper Doctor العلمية", title: "معرفة متخصصة لاختيار واستخدام أفضل", body: "مقالات علمية وعملية عن معدات التنفس واختبارات النوم والرعاية المنزلية والتقنيات الطبية.", empty: "لا توجد مقالات منشورة بعد.", read: "قراءة المقال", latest: "أحدث المقالات" }
        : { eyebrow: "Hyper Doctor Scientific Magazine", title: "Specialist knowledge for better decisions", body: "Scientific and practical articles on respiratory equipment, sleep testing, home care and medical technology.", empty: "No articles have been published yet.", read: "Read article", latest: "Latest articles" };

  const featured = articles[0];
  const rest = featured ? articles.slice(1) : [];

  return (
    <main className="flex-1 bg-[#f5f8fb] pb-16 pt-6 sm:pt-10">
      <Container>
        <section className="relative overflow-hidden rounded-[2rem] bg-[#001736] px-6 py-10 text-white shadow-[0_24px_65px_rgba(0,23,54,.16)] sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-y-0 end-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(0,157,216,.25),transparent_62%)]" />
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">{copy.eyebrow}</p>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e3ff]/85 sm:text-base">{copy.body}</p>
          </div>
        </section>

        {featured ? (
          <section className="mt-8 grid overflow-hidden rounded-3xl border border-[#dfe4ea] bg-white shadow-[0_18px_50px_rgba(0,23,54,.06)] lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative min-h-72 bg-[#dce7f1] lg:min-h-[420px]">
              {featured.coverImage ? <Image src={featured.coverImage} alt={pick(locale, featured, "title")} fill className="object-cover" sizes="(min-width:1024px) 55vw, 100vw" priority /> : <div className="flex h-full min-h-72 items-center justify-center bg-[linear-gradient(135deg,#001736,#002b5b)]"><Newspaper className="h-16 w-16 text-[#82cfff]" /></div>}
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <span className="w-fit rounded-full bg-[#ffdada] px-3 py-1 text-[11px] font-black text-[#ba0036]">{featured.category || copy.latest}</span>
              <h2 className="mt-5 text-2xl font-black leading-[1.45] text-[#001736] sm:text-3xl">{pick(locale, featured, "title")}</h2>
              <p className="mt-4 line-clamp-4 text-sm leading-7 text-[#5f6570]">{pick(locale, featured, "excerpt")}</p>
              <Link href={`/articles/${featured.slug}`} className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-[#002b5b] px-5 text-sm font-black text-white hover:bg-[#001736]">{copy.read}<ArrowUpLeft className="h-4 w-4" /></Link>
            </div>
          </section>
        ) : (
          <section className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-[#dfe4ea] bg-white p-8 text-center shadow-[0_14px_38px_rgba(0,23,54,.045)]">
            <BookOpen className="h-12 w-12 text-[#009dd8]" />
            <h2 className="mt-5 text-xl font-black text-[#001736]">{copy.empty}</h2>
          </section>
        )}

        {rest.length > 0 ? (
          <section className="py-10 sm:py-14">
            <h2 className="mb-6 text-2xl font-black text-[#001736]">{copy.latest}</h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((article) => (
                <article key={article.id} className="overflow-hidden rounded-3xl border border-[#dfe4ea] bg-white shadow-[0_14px_38px_rgba(0,23,54,.045)]">
                  <div className="relative aspect-[16/9] bg-[#edf4fb]">{article.coverImage ? <Image src={article.coverImage} alt={pick(locale, article, "title")} fill className="object-cover" sizes="(min-width:1280px) 30vw, (min-width:768px) 45vw, 100vw" /> : <div className="flex h-full items-center justify-center"><Newspaper className="h-9 w-9 text-[#009dd8]" /></div>}</div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#747780]"><Clock3 className="h-3.5 w-3.5" />{article.category || copy.latest}</div>
                    <h3 className="mt-3 line-clamp-2 text-lg font-black leading-7 text-[#001736]">{pick(locale, article, "title")}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#5f6570]">{pick(locale, article, "excerpt")}</p>
                    <Link href={`/articles/${article.slug}`} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#ba0036]">{copy.read}<ArrowUpLeft className="h-3.5 w-3.5" /></Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
