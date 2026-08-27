import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requestZarinpalPayment } from "@/lib/payments/zarinpal";
import { generateOrderNumber } from "@/lib/order-number";
import { localizedName } from "@/lib/i18n-content";

const lineSchema = z.object({
  type: z.enum(["product", "service"]),
  id: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  preferredDate: z.string().optional(),
});

const checkoutSchema = z.object({
  locale: z.enum(["fa", "tr", "en", "ar"]),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(5).max(500),
  province: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(120),
  country: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
  lines: z.array(lineSchema).min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
  }
  const body = parsed.data;

  const orderItems: {
    productId?: string;
    serviceId?: string;
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    preferredDate?: Date;
  }[] = [];

  for (const line of body.lines) {
    if (line.type === "product") {
      const product = await prisma.product.findUnique({ where: { id: line.id } });
      if (!product || !product.isPublished) {
        return NextResponse.json({ error: "Product unavailable" }, { status: 409 });
      }
      if (line.quantity < product.minOrderQty) {
        return NextResponse.json({ error: `Minimum order quantity is ${product.minOrderQty}` }, { status: 409 });
      }
      if (product.maxOrderQty && line.quantity > product.maxOrderQty) {
        return NextResponse.json({ error: `Maximum order quantity is ${product.maxOrderQty}` }, { status: 409 });
      }
      if (product.stock < line.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.nameEn}` }, { status: 409 });
      }
      orderItems.push({
        productId: product.id,
        nameSnapshot: localizedName(body.locale, product),
        priceSnapshot: product.price,
        quantity: line.quantity,
      });
    } else {
      const service = await prisma.service.findUnique({ where: { id: line.id } });
      if (!service || !service.isPublished) {
        return NextResponse.json({ error: "Service unavailable" }, { status: 409 });
      }
      orderItems.push({
        serviceId: service.id,
        nameSnapshot: localizedName(body.locale, service),
        priceSnapshot: service.price ?? 0,
        quantity: line.quantity,
        preferredDate: line.preferredDate ? new Date(line.preferredDate) : undefined,
      });
    }
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  if (total <= 0) {
    return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerName: body.customerName,
      phone: body.phone,
      email: body.email || null,
      address: body.address,
      province: body.province || "",
      city: body.city,
      country: body.country || "",
      postalCode: body.postalCode || null,
      notes: body.notes || "",
      locale: body.locale,
      subtotal,
      shippingFee,
      total,
      items: { create: orderItems },
    },
  });

  try {
    const { authority, redirectUrl } = await requestZarinpalPayment({
      amountToman: total,
      description: `Hyper Doctor order ${order.orderNumber}`,
      orderNumber: order.orderNumber,
      mobile: body.phone,
      email: body.email || undefined,
    });

    await prisma.order.update({ where: { id: order.id }, data: { paymentAuthority: authority } });
    return NextResponse.json({ redirectUrl, orderNumber: order.orderNumber });
  } catch (error) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment request failed" },
      { status: 502 },
    );
  }
}
