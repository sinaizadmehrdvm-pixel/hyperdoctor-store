import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Moon, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { BookServiceButton } from "@/components/site/book-service-button";
import { formatPrice } from "@/lib/utils";
import { getServiceBySlug } from "@/lib/queries";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [locale, t, c] = await Promise.all([
    getLocale(),
    getTranslations("services"),
    getTranslations("common"),
  ]);

  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const name = locale === "fa" ? service.nameFa : service.nameEn;
  const description = locale === "fa" ? service.descriptionFa : service.descriptionEn;

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-navy">
            {service.image ? (
              <Image
                src={service.image}
                alt={name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, 90vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Moon className="h-16 w-16 text-primary-glow" aria-hidden="true" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {service.price ? (
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  {service.priceIsFrom ? `${t("priceFrom")} ` : ""}
                  {formatPrice(service.price, locale)}{" "}
                  <span className="text-sm font-medium text-muted">{c("currency")}</span>
                </span>
              ) : null}
              {service.durationMinutes ? (
                <Badge variant="muted">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {service.durationMinutes} {t("minutes")}
                </Badge>
              ) : null}
            </div>

            {service.requiresBooking ? (
              <p className="mt-3 text-xs text-muted">{t("requiresBooking")}</p>
            ) : null}

            {description ? (
              <p className="mt-6 leading-7 text-muted whitespace-pre-line">
                {description}
              </p>
            ) : null}

            <div className="mt-8">
              <BookServiceButton
                id={service.id}
                nameFa={service.nameFa}
                nameEn={service.nameEn}
                price={service.price ?? 0}
                image={service.image}
                requiresBooking={service.requiresBooking}
              />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
