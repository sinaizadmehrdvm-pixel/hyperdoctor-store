import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/site/product-card";
import { getCategories, getFeaturedProducts, getServices } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-data";
import type { PublicPageSection } from "@/lib/content/page-sections";

function SectionBackground({ section }: { section: PublicPageSection }) {
  if (!section.backgroundUrl) return null;
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <Image src={section.backgroundUrl} alt="" fill className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-navy/65" />
    </div>
  );
}

function SectionShell({ section, children, dark = false }: { section: PublicPageSection; children: React.ReactNode; dark?: boolean }) {
  return (
    <section className={`relative isolate overflow-hidden py-12 sm:py-16 ${section.backgroundUrl || dark ? "text-white" : "text-foreground"}`}>
      <SectionBackground section={section} />
      <Container>{children}</Container>
    </section>
  );
}

function Body({ text, muted = false }: { text: string; muted?: boolean }) {
  if (!text) return null;
  return <p className={`mt-4 max-w-3xl whitespace-pre-line leading-8 ${muted ? "text-muted" : "text-current/80"}`}>{text}</p>;
}

function Cta({ section }: { section: PublicPageSection }) {
  if (!section.ctaLabel || !section.ctaHref) return null;
  const classes = "mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90";
  if (section.ctaHref.startsWith("http")) {
    return <a href={section.ctaHref} className={classes}>{section.ctaLabel}</a>;
  }
  return <Link href={section.ctaHref} className={classes}>{section.ctaLabel}</Link>;
}

export async function PageSectionRenderer({ sections, locale }: { sections: PublicPageSection[]; locale: "fa" | "en" }) {
  const needsCategories = sections.some((section) => section.type === "categoryGrid");
  const needsProducts = sections.some((section) => section.type === "productGrid");
  const needsServices = sections.some((section) => section.type === "serviceGrid");
  const needsContact = sections.some((section) => section.type === "contact");
  const [categories, products, services, site] = await Promise.all([
    needsCategories ? getCategories() : Promise.resolve([]),
    needsProducts ? getFeaturedProducts(8) : Promise.resolve([]),
    needsServices ? getServices() : Promise.resolve([]),
    needsContact ? getSiteSettings() : Promise.resolve(null),
  ]);

  return (
    <>
      {sections.map((section) => {
        if (section.type === "hero") {
          return (
            <SectionShell key={section.id} section={section} dark={Boolean(section.backgroundUrl)}>
              <div className="max-w-4xl py-8 sm:py-14">
                {section.title ? <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{section.title}</h1> : null}
                <Body text={section.body} />
                <Cta section={section} />
              </div>
            </SectionShell>
          );
        }

        if (section.type === "categoryGrid") {
          return (
            <SectionShell key={section.id} section={section}>
              {section.title ? <h2 className="text-2xl font-bold">{section.title}</h2> : null}
              <Body text={section.body} muted={!section.backgroundUrl} />
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                  <Link key={category.id} href={`/shop/${category.slug}`} className="rounded-2xl border border-border bg-card p-5 text-foreground transition hover:shadow-lg">
                    <h3 className="font-bold">{locale === "fa" ? category.nameFa : category.nameEn}</h3>
                    <p className="mt-2 text-xs text-muted">{category._count.products} {locale === "fa" ? "کالا" : "products"}</p>
                  </Link>
                ))}
              </div>
              <Cta section={section} />
            </SectionShell>
          );
        }

        if (section.type === "productGrid") {
          return (
            <SectionShell key={section.id} section={section}>
              {section.title ? <h2 className="text-2xl font-bold">{section.title}</h2> : null}
              <Body text={section.body} muted={!section.backgroundUrl} />
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
              <Cta section={section} />
            </SectionShell>
          );
        }

        if (section.type === "serviceGrid") {
          return (
            <SectionShell key={section.id} section={section}>
              {section.title ? <h2 className="text-2xl font-bold">{section.title}</h2> : null}
              <Body text={section.body} muted={!section.backgroundUrl} />
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => {
                  const name = locale === "fa" ? service.nameFa : service.nameEn;
                  const description = locale === "fa" ? service.descriptionFa : service.descriptionEn;
                  return (
                    <Link key={service.id} href={`/services/${service.slug}`} className="rounded-2xl border border-border bg-card p-5 text-foreground transition hover:shadow-lg">
                      <h3 className="font-bold">{name}</h3>
                      {description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{description}</p> : null}
                    </Link>
                  );
                })}
              </div>
              <Cta section={section} />
            </SectionShell>
          );
        }

        if (section.type === "cta") {
          return (
            <SectionShell key={section.id} section={section} dark={Boolean(section.backgroundUrl)}>
              <div className="rounded-2xl border border-border/60 bg-card/90 p-6 text-foreground shadow-sm backdrop-blur sm:p-8">
                {section.title ? <h2 className="text-2xl font-bold">{section.title}</h2> : null}
                <Body text={section.body} muted />
                <Cta section={section} />
              </div>
            </SectionShell>
          );
        }

        if (section.type === "contact") {
          return (
            <SectionShell key={section.id} section={section}>
              {section.title ? <h2 className="text-2xl font-bold">{section.title}</h2> : null}
              <Body text={section.body} muted={!section.backgroundUrl} />
              {site ? (
                <div className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
                  {site.contactPhone ? <a className="rounded-xl border border-border bg-card p-4 text-foreground" dir="ltr" href={`tel:${site.contactPhone}`}>{site.contactPhone}</a> : null}
                  {site.contactPhone2 ? <a className="rounded-xl border border-border bg-card p-4 text-foreground" dir="ltr" href={`tel:${site.contactPhone2}`}>{site.contactPhone2}</a> : null}
                  {site.respiratoryPhone ? <a className="rounded-xl border border-border bg-card p-4 text-foreground" dir="ltr" href={`tel:${site.respiratoryPhone}`}>{site.respiratoryPhone}</a> : null}
                  {site.contactEmail ? <a className="rounded-xl border border-border bg-card p-4 text-foreground" dir="ltr" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> : null}
                  {site.address ? <div className="rounded-xl border border-border bg-card p-4 text-foreground sm:col-span-2">{site.address}</div> : null}
                </div>
              ) : null}
              <Cta section={section} />
            </SectionShell>
          );
        }

        return (
          <SectionShell key={section.id} section={section}>
            {section.title ? <h2 className="text-2xl font-bold">{section.title}</h2> : null}
            <Body text={section.body} muted={!section.backgroundUrl} />
            <Cta section={section} />
          </SectionShell>
        );
      })}
    </>
  );
}
