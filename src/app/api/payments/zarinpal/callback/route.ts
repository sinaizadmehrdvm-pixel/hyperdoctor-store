import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyZarinpalPayment } from "@/lib/payments/zarinpal";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const orderNumber = url.searchParams.get("order");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!authority || !orderNumber) {
    return NextResponse.redirect(`${site}/fa/order/unknown/result?status=fail`);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order || order.paymentAuthority !== authority) {
    return NextResponse.redirect(`${site}/fa/order/${orderNumber}/result?status=fail`);
  }

  const resultUrl = (result: "success" | "fail") =>
    `${site}/${order.locale}/order/${order.orderNumber}/result?status=${result}`;

  // Already processed (e.g. user refreshed the callback) — don't re-verify or
  // decrement stock twice, just report the known outcome.
  if (order.status === "PAID") {
    return NextResponse.redirect(resultUrl("success"));
  }

  if (status !== "OK") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(resultUrl("fail"));
  }

  const verification = await verifyZarinpalPayment({
    amountToman: order.total,
    authority,
  });

  if (!verification.success) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(resultUrl("fail"));
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paymentRefId: verification.refId },
    }),
    ...order.items
      .filter((item) => item.productId)
      .map((item) =>
        prisma.product.update({
          where: { id: item.productId! },
          data: { stock: { decrement: item.quantity } },
        })
      ),
  ]);

  return NextResponse.redirect(resultUrl("success"));
}
