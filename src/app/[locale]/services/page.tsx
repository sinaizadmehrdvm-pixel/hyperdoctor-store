import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Moon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getServices } from "@/lib/queries";

export default async function ServicesPage() {
  const [locale, t, c] = await Promise.all([
    getLocale(),
    getTranslations("services"),
    getTranslations("common"),
  ]);
  const services = await getServices();

  return (
    <main className="flex-1 py-12">
      <Container>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("title")}</h1>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {services.map((service) => {
            const name = locale === "fa" ? service.nameFa : service.nameEn;
            const description =
              locale === "fa" ? service.descriptionFa : service.descriptionEn;
            return (
              <div
                key={service.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-video bg-navy">
                  {service.image ? (
                    <Image
                      src={service.image}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 640px) 45vw, 90vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Moon className="h-10 w-10 text-primary-glow" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-lg font-bold text-foreground">{name}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted line-clamp-3">
                    {description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    {service.price ? (
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {service.priceIsFrom ? `${t("priceFrom")} ` : ""}
                        {formatPrice(service.price, locale)} {c("currency")}
                      </span>
                    ) : (
                      <span />
                    )}
                    <LinkButton href={`/services/${service.slug}`} size="sm">
                      {t("bookNow")}
                    </LinkButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
