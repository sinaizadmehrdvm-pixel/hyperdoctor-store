"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "FAILED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const status = String(formData.get("status"));
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as (typeof VALID_STATUSES)[number] },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
