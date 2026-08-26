"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

type GalleryImage = { id: string; url: string; altFa: string; altEn: string };

export function ProductGallery({ images, locale }: { images: GalleryImage[]; locale: "fa" | "en" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const isRtl = locale === "fa";

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted-bg">
        <div className="flex h-full items-center justify-center text-muted">
          <ImageOff className="h-12 w-12" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];
  const move = (delta: number) => setActiveIndex((current) => (current + delta + images.length) % images.length);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (images.length < 2) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(isRtl ? 1 : -1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(isRtl ? -1 : 1);
    }
  }

  return (
    <div className="space-y-3" onKeyDown={onKeyDown} tabIndex={images.length > 1 ? 0 : -1} aria-label={locale === "fa" ? "گالری تصاویر محصول" : "Product image gallery"}>
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-muted-bg"
        onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null || images.length < 2) return;
          const end = event.changedTouches[0]?.clientX ?? touchStart.current;
          const distance = end - touchStart.current;
          touchStart.current = null;
          if (Math.abs(distance) < 40) return;
          const visualDelta = distance > 0 ? -1 : 1;
          move(isRtl ? -visualDelta : visualDelta);
        }}
      >
        <Image
          key={active.id}
          src={active.url}
          alt={locale === "fa" ? active.altFa : active.altEn}
          fill
          className="object-contain p-3"
          sizes="(min-width: 1024px) 45vw, 90vw"
          priority={activeIndex === 0}
        />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move(isRtl ? 1 : -1)}
              aria-label={locale === "fa" ? "تصویر قبلی" : "Previous image"}
              className="absolute start-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md backdrop-blur hover:bg-white"
            >
              {isRtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => move(isRtl ? -1 : 1)}
              aria-label={locale === "fa" ? "تصویر بعدی" : "Next image"}
              className="absolute end-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md backdrop-blur hover:bg-white"
            >
              {isRtl ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            <span className="absolute bottom-3 end-3 rounded-full bg-navy/75 px-2.5 py-1 text-xs font-semibold text-white" aria-live="polite">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={locale === "fa" ? "انتخاب تصویر" : "Choose image"}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${locale === "fa" ? "تصویر" : "Image"} ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-muted-bg ${index === activeIndex ? "border-primary" : "border-transparent"}`}
            >
              <Image src={image.url} alt="" fill className="object-contain p-1" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
