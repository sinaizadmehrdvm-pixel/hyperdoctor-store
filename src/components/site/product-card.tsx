import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { localizedAlt, localizedName } from "@/lib/i18n-content";
import { Badge } from "@/components/ui/badge";
import { ImageOff, ArrowUpRight } from "lucide-react";

type ProductCardData = {
  slug: string;
  nameFa: string;
  nameTr?: string | null;
  nameEn: string;
  nameAr?: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isNewArrival?: boolean;
  brand?: string;
  images: {
    url: string;
    altFa: string;
    altTr?: string | null;
    altEn: string;
    altAr?: string | null;
  }[];
};

export async function ProductCard({ product }: { product: ProductCardData }) {
  const locale = await getLocale();
  const t = await getTranslations("shop");
  const c = await getTranslations("common");
  const name = localizedName(locale, product);
  const image = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="vitalis-panel vitalis-interactive group flex min-h-full flex-col overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-muted-bg">
        {image ? (
          <Image
            src={image.url}
            alt={localizedAlt(locale, image, name)}
            fill
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.035]"
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ImageOff className="h-9 w-9" aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {product.stock <= 0 ? (
              <Badge variant="accent">{t("outOfStock")}</Badge>
            ) : null}
            {product.isNewArrival ? (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                NEW
              </span>
            ) : null}
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/80 text-primary opacity-0 shadow-sm backdrop-blur transition-all group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        {product.brand ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-glow">
            {product.brand}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-bold leading-6 text-foreground sm:text-base">
          {name}
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-3 tabular-nums">
          <span className="text-base font-black text-primary sm:text-lg">
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
