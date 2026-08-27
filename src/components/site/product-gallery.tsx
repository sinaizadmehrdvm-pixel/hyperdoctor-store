"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { localizedAlt } from "@/lib/i18n-content";

type GalleryImage = {
  id: string;
  url: string;
  altFa: string;
  altTr?: string | null;
  altEn: string;
  altAr?: string | null;
};

export function ProductGallery({
  images,
  locale,
  fallbackAlt,
}: {
  images: GalleryImage[];
  locale: string;
  fallbackAlt: string;
}) {
  const normalized = useMemo(() => images.filter((image) => Boolean(image.url)), [images]);
  const [selectedId, setSelectedId] = useState(normalized[0]?.id ?? "");
  const selected = normalized.find((image) => image.id === selectedId) ?? normalized[0];

  if (!selected) {
    return (
      <div className="vitalis-panel flex aspect-square items-center justify-center text-muted">
        <ImageOff className="h-12 w-12" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[84px_1fr] sm:items-start">
      {normalized.length > 1 ? (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
          {normalized.map((image) => {
            const active = image.id === selected.id;
            return (
              <button
                type="button"
                key={image.id}
                onClick={() => setSelectedId(image.id)}
                className={cn(
                  "vitalis-focus relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white transition",
                  active ? "border-primary shadow-md" : "border-border hover:border-primary/40",
                )}
                aria-label={localizedAlt(locale, image, fallbackAlt)}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="vitalis-panel order-1 relative aspect-square overflow-hidden sm:order-2">
        <Image
          src={selected.url}
          alt={localizedAlt(locale, selected, fallbackAlt)}
          fill
          className="object-contain p-5 sm:p-8"
          sizes="(min-width: 1024px) 46vw, 92vw"
          priority
        />
      </div>
    </div>
  );
}
