import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";

type ProductCardData = {
  slug: string;
  nameFa: string;
  nameEn: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: { url: string; altFa: string; altEn: string }[];
};

export async function ProductCard({ product }: { product: ProductCardData }) {
  const locale = await getLocale();
  const t = await getTranslations("shop");
  const c = await getTranslations("common");
  const name = locale === "fa" ? product.nameFa : product.nameEn;
  const image = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square bg-muted-bg">
        {image ? (
          <Image
            src={image.url}
            alt={locale === "fa" ? image.altFa : image.altEn}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
        {product.stock <= 0 ? (
          <Badge variant="accent" className="absolute top-3 start-3">
            {t("outOfStock")}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{name}</h3>
        <div className="mt-auto flex items-baseline gap-2 tabular-nums">
          <span className="text-base font-bold text-foreground">
            {formatPrice(product.price, locale)}
          </span>
          <span className="text-xs text-muted">{c("currency")}</span>
          {product.compareAtPrice ? (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.compareAtPrice, locale)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
