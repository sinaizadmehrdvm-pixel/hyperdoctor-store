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
      <div className="flex min-h-[420px] items-center justify-center rounded-[1.75rem] border border-[#e3e2e5] bg-[#efedf0] text-[#74777f] shadow-[0_18px_48px_rgba(4,27,58,.06)]">
        <ImageOff className="h-12 w-12" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[82px_1fr] sm:items-start">
      {normalized.length > 1 ? (
        <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
          {normalized.map((image) => {
            const active = image.id === selected.id;
            return (
              <button
                type="button"
                key={image.id}
                onClick={() => setSelectedId(image.id)}
                className={cn(
                  "vitalis-focus relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[1rem] border-2 bg-white/80 shadow-sm backdrop-blur transition",
                  active ? "border-black shadow-[0_8px_22px_rgba(4,27,58,.14)]" : "border-transparent hover:border-[#7184a9]",
                )}
                aria-label={localizedAlt(locale, image, fallbackAlt)}
              >
                <Image src={image.url} alt="" fill className="object-contain p-2" sizes="78px" />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="order-1 relative min-h-[380px] overflow-hidden rounded-[1.75rem] border border-[#e3e2e5] bg-[#efedf0] shadow-[0_22px_60px_rgba(4,27,58,.08)] sm:order-2 sm:min-h-[520px]">
        <div className="absolute inset-x-0 top-0 h-20 bg-white/35 backdrop-blur-sm" />
        <Image
          src={selected.url}
          alt={localizedAlt(locale, selected, fallbackAlt)}
          fill
          className="object-contain p-8 sm:p-12"
          sizes="(min-width: 1024px) 48vw, 92vw"
          priority
        />
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
          {normalized.slice(0, 4).map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedId(image.id)}
              aria-label={localizedAlt(locale, image, fallbackAlt)}
              className={cn("h-2 w-2 rounded-full transition", image.id === selected.id ? "bg-black" : "bg-black/25")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
