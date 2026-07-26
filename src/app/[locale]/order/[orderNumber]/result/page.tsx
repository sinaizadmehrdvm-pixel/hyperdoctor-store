import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { ClearCartOnSuccess } from "@/components/site/clear-cart-on-success";
import { prisma } from "@/lib/prisma";

export default async function OrderResultPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const t = await getTranslations("orderResult");

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) notFound();

  const success = order.status === "PAID";

  return (
    <main className="flex-1 py-20">
      {success ? <ClearCartOnSuccess /> : null}
      <Container className="max-w-lg text-center">
        {success ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden="true" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-accent" aria-hidden="true" />
        )}
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          {success ? t("successTitle") : t("failTitle")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {success ? t("successBody") : t("failBody")}
        </p>
        <p className="mt-6 rounded-lg bg-muted-bg px-4 py-3 text-sm font-semibold tabular-nums">
          {t("orderNumber")}: {order.orderNumber}
        </p>
        <LinkButton href="/" className="mt-8">
          {t("backHome")}
        </LinkButton>
      </Container>
    </main>
  );
}
