import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, ImageOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProduct } from "./actions";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: true, category: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">محصولات</h1>
        <Link
          href="/admin/products/new"
          className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          محصول جدید
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 text-start">محصول</th>
              <th className="px-4 py-3 text-start">دسته</th>
              <th className="px-4 py-3 text-start">قیمت</th>
              <th className="px-4 py-3 text-start">موجودی</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted-bg">
                      {p.images[0] ? (
                        <Image src={p.images[0].url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-foreground">{p.nameFa}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.category.nameFa}</td>
                <td className="px-4 py-3 tabular-nums text-muted">
                  {new Intl.NumberFormat("fa-IR").format(p.price)}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{p.stock}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.isPublished ? "success" : "muted"}>
                    {p.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <DeleteButton action={deleteProduct.bind(null, p.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  هنوز محصولی ثبت نشده است.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
