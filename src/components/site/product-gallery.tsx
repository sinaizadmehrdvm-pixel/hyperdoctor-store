"use client";

import { useEffect, useMemo, useState } from "react";
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

export function ProductGallery({ images, locale, fallbackAlt }: { images: GalleryImage[]; locale: string; fallbackAlt: string }) {
  const normalized = useMemo(() => images.filter((image) => Boolean(image.url)), [images]);
  const [selectedId, setSelectedId] = useState(normalized[0]?.id ?? "");

  useEffect(() => {
    if (!normalized.some((image) => image.id === selectedId)) setSelectedId(normalized[0]?.id ?? "");
  }, [normalized, selectedId]);

  const selected = normalized.find((image) => image.id === selectedId) ?? normalized[0];

  if (!selected) {
    return <div className="flex min-h-[360px] items-center justify-center rounded-[1.45rem] border border-[#e0e3e6] bg-white text-[#9aa0aa] shadow-[0_16px_42px_rgba(0,23,54,.06)] sm:min-h-[430px]"><ImageOff className="h-12 w-12" aria-hidden="true" /></div>;
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-[76px_minmax(0,1fr)] sm:items-start">
      {normalized.length > 1 ? (
        <div className="order-2 flex max-w-full gap-3 overflow-x-auto pb-2 sm:order-1 sm:flex-col sm:overflow-visible sm:pb-0">
          {normalized.map((image, index) => {
            const active = image.id === selected.id;
            const alt = localizedAlt(locale, image, fallbackAlt);
            return <button type="button" key={image.id} onClick={() => setSelectedId(image.id)} className={cn("vitalis-focus relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm transition", active ? "border-[#001736] ring-2 ring-[#001736]/10" : "border-[#e0e3e6] hover:border-[#009dd8]")} aria-label={`${alt} ${index + 1}`} aria-pressed={active}><Image src={image.url} alt="" fill className="object-contain p-2" sizes="72px" /></button>;
          })}
        </div>
      ) : null}

      <div className="order-1 relative aspect-square min-h-[320px] overflow-hidden rounded-[1.4rem] border border-[#e0e3e6] bg-white shadow-[0_20px_54px_rgba(0,23,54,.075)] sm:order-2 sm:min-h-[540px] sm:aspect-auto">
        <Image src={selected.url} alt={localizedAlt(locale, selected, fallbackAlt)} fill className="object-contain p-6 sm:p-12" sizes="(min-width:1024px) 46vw,92vw" priority />
        {normalized.length > 1 ? <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2" aria-hidden="true">{normalized.slice(0, 8).map((image)=><span key={image.id} className={cn("h-2 rounded-full transition-all",image.id===selected.id?"w-6 bg-[#001736]":"w-2 bg-[#001736]/22")}/>)}</div> : null}
      </div>
    </div>
  );
}
