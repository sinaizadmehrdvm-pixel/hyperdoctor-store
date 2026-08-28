"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ImageOff, Play } from "lucide-react";
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
  const selected = normalized.find((image) => image.id === selectedId) ?? normalized[0];

  if (!selected) {
    return <div className="flex min-h-[430px] items-center justify-center rounded-[1.45rem] border border-[#e0e3e6] bg-white text-[#9aa0aa] shadow-[0_16px_42px_rgba(0,23,54,.06)]"><ImageOff className="h-12 w-12" /></div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[76px_1fr] sm:items-start">
      {normalized.length > 1 ? (
        <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
          {normalized.map((image) => {
            const active = image.id === selected.id;
            return <button type="button" key={image.id} onClick={() => setSelectedId(image.id)} className={cn("vitalis-focus relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm transition", active ? "border-[#001736] ring-2 ring-[#001736]/10" : "border-[#e0e3e6] hover:border-[#009dd8]")} aria-label={localizedAlt(locale,image,fallbackAlt)}><Image src={image.url} alt="" fill className="object-contain p-2" sizes="72px" /></button>;
          })}
        </div>
      ) : null}

      <div className="order-1 relative min-h-[420px] overflow-hidden rounded-[1.4rem] border border-[#e0e3e6] bg-white shadow-[0_20px_54px_rgba(0,23,54,.075)] sm:order-2 sm:min-h-[540px]">
        <Image src={selected.url} alt={localizedAlt(locale,selected,fallbackAlt)} fill className="object-contain p-8 sm:p-12" sizes="(min-width:1024px) 46vw,92vw" priority />
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/76 text-[#001736] opacity-0 shadow-xl backdrop-blur transition group-hover:opacity-100 sm:opacity-100"><Play className="ms-0.5 h-5 w-5 fill-current" /></span>
        {normalized.length > 1 ? <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">{normalized.slice(0,6).map((image)=><button key={image.id} type="button" onClick={()=>setSelectedId(image.id)} aria-label={localizedAlt(locale,image,fallbackAlt)} className={cn("h-2 rounded-full transition-all",image.id===selected.id?"w-6 bg-[#001736]":"w-2 bg-[#001736]/22")}/>)}</div> : null}
      </div>
    </div>
  );
}
