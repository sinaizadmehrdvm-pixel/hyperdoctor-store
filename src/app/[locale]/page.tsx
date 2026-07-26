import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Stethoscope,
  Wind,
  Moon,
  Syringe,
  PawPrint,
  Pill,
  HeartHandshake,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/site/product-card";
import { getCategories, getFeaturedProducts, getServices } from "@/lib/queries";

const categoryIcons: Record<string, typeof Stethoscope> = {
  MEDICAL_EQUIPMENT: Stethoscope,
  RESPIRATORY_SERVICES: Wind,
};

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const brandT = await getTranslations("brand");
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  const [categories, featured, services] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getServices(),
  ]);
  const spotlightService = services[0];

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 end-[-10%] h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-20%] start-[-10%] h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        />
        <Container className="relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <Badge variant="onNavy" className="mb-5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t("heroEyebrow")}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-8 text-navy-muted">
              {t("heroSubtitle")}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <LinkButton href="/shop" variant="primary" size="lg">
                {t("heroCtaShop")}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/services" variant="onNavy" size="lg">
                {t("heroCtaServices")}
              </LinkButton>
            </div>
          </div>
        </Container>
        <div className="border-t border-navy-border">
          <Container className="py-5">
            <p className="text-center text-xs sm:text-sm font-medium tracking-wide text-navy-muted">
              {t("trustBarTitle")}
            </p>
          </Container>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("categoriesTitle")}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.vertical] ?? Stethoscope;
              return (
                <Link
                  key={cat.id}
                  href={`/shop/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-shadow hover:shadow-lg"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {locale === "fa" ? cat.nameFa : cat.nameEn}
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Featured products */}
      {featured.length > 0 ? (
        <section className="py-16 sm:py-20 bg-muted-bg">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {t("featuredTitle")}
                </h2>
                <p className="mt-2 text-sm text-muted">{t("featuredSubtitle")}</p>
              </div>
              <LinkButton href="/shop" variant="outline" size="sm" className="shrink-0">
                {t("heroCtaShop")}
              </LinkButton>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Service spotlight */}
      {spotlightService ? (
        <section className="py-16 sm:py-20">
          <Container>
            <div className="grid gap-10 rounded-3xl bg-navy p-8 sm:p-14 text-navy-foreground lg:grid-cols-2 lg:items-center">
              <div>
                <Badge variant="onNavy" className="mb-5">
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("serviceSpotlightEyebrow")}
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {t("serviceSpotlightTitle")}
                </h2>
                <p className="mt-4 leading-7 text-navy-muted">
                  {t("serviceSpotlightBody")}
                </p>
                <LinkButton
                  href={`/services/${spotlightService.slug}`}
                  variant="primary"
                  size="lg"
                  className="mt-8"
                >
                  {t("serviceSpotlightCta")}
                  <Arrow className="h-4 w-4" aria-hidden="true" />
                </LinkButton>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/5">
                {spotlightService.image ? (
                  <Image
                    src={spotlightService.image}
                    alt={locale === "fa" ? spotlightService.nameFa : spotlightService.nameEn}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 40vw, 90vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Moon className="h-16 w-16 text-primary-glow" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      {/* Roadmap teaser */}
      <section className="py-16 sm:py-20 bg-muted-bg">
        <Container>
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="primary" className="mb-4">
              {t("roadmapEyebrow")}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("roadmapTitle")}
            </h2>
            <p className="mt-3 text-sm text-muted">{t("roadmapBody")}</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Syringe, label: t("roadmapDental") },
              { icon: PawPrint, label: t("roadmapVeterinary") },
              { icon: Pill, label: t("roadmapPharmacy") },
              { icon: HeartHandshake, label: t("roadmapNursing") },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-6 text-center opacity-80"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-bg text-muted">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <Badge variant="muted">{t("roadmapComingSoon")}</Badge>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <Container className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("ctaTitle")}
          </h2>
          <LinkButton href="/contact" variant="accent" size="lg" className="mt-7">
            {t("ctaButton")}
          </LinkButton>
          <p className="mt-6 text-xs text-muted">
            {brandT("holding")} · {brandT("subBrand")}
          </p>
        </Container>
      </section>
    </main>
  );
}
