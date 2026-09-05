"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ImageIcon, Link2, Search, Upload, X } from "lucide-react";

export type EditorMediaAsset = {
  id: string;
  url: string;
  altFa?: string;
  altTr?: string;
  altEn?: string;
  altAr?: string;
  width?: number | null;
  height?: number | null;
  createdAt?: string;
};

type Props = {
  open: boolean;
  assets: EditorMediaAsset[];
  locale: "fa" | "tr" | "en" | "ar";
  onClose: () => void;
  onSelect: (asset: EditorMediaAsset) => void;
  onUploaded: (asset: EditorMediaAsset) => void;
};

const ratioMap: Record<string, number | null> = { original: null, square: 1, landscape: 16 / 9, classic: 4 / 3, portrait: 4 / 5 };
const copy = {
  fa: { title: "رسانه", library: "کتابخانه", upload: "آپلود و برش", search: "جستجو در تصاویر...", drop: "تصویر را اینجا رها کنید یا انتخاب کنید", choose: "انتخاب فایل", ratio: "نسبت تصویر", original: "اصلی", square: "۱:۱", landscape: "۱۶:۹", classic: "۴:۳", portrait: "۴:۵", zoom: "بزرگنمایی", x: "موقعیت افقی", y: "موقعیت عمودی", alt: "متن جایگزین فارسی", send: "برش و آپلود", external: "یا آدرس تصویر", use: "استفاده از آدرس", uploading: "در حال آپلود...", empty: "تصویری پیدا نشد", error: "آپلود انجام نشد." },
  en: { title: "Media", library: "Library", upload: "Upload & crop", search: "Search images...", drop: "Drop an image here or choose a file", choose: "Choose file", ratio: "Aspect ratio", original: "Original", square: "1:1", landscape: "16:9", classic: "4:3", portrait: "4:5", zoom: "Zoom", x: "Horizontal position", y: "Vertical position", alt: "Persian alt text", send: "Crop & upload", external: "Or image URL", use: "Use URL", uploading: "Uploading...", empty: "No image found", error: "Upload failed." },
  tr: { title: "Medya", library: "Kütüphane", upload: "Yükle ve kırp", search: "Görsellerde ara...", drop: "Görseli buraya bırakın veya dosya seçin", choose: "Dosya seç", ratio: "En-boy oranı", original: "Orijinal", square: "1:1", landscape: "16:9", classic: "4:3", portrait: "4:5", zoom: "Yakınlaştır", x: "Yatay konum", y: "Dikey konum", alt: "Farsça alternatif metin", send: "Kırp ve yükle", external: "Veya görsel URL", use: "URL kullan", uploading: "Yükleniyor...", empty: "Görsel bulunamadı", error: "Yükleme başarısız." },
  ar: { title: "الوسائط", library: "المكتبة", upload: "رفع وقص", search: "البحث في الصور...", drop: "أفلت الصورة هنا أو اختر ملفاً", choose: "اختيار ملف", ratio: "نسبة الأبعاد", original: "الأصلية", square: "1:1", landscape: "16:9", classic: "4:3", portrait: "4:5", zoom: "تكبير", x: "الموضع الأفقي", y: "الموضع العمودي", alt: "النص البديل الفارسي", send: "قص ورفع", external: "أو رابط الصورة", use: "استخدام الرابط", uploading: "جارٍ الرفع...", empty: "لا توجد صورة", error: "فشل الرفع." },
} as const;

async function imageFromFile(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { img, url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export function MediaStudioModal({ open, assets, locale, onClose, onSelect, onUploaded }: Props) {
  const t = copy[locale];
  const rtl = locale === "fa" || locale === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [ratio, setRatio] = useState("original");
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [altFa, setAltFa] = useState("");
  const [external, setExternal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => `${a.url} ${a.altFa || ""} ${a.altEn || ""}`.toLowerCase().includes(q));
  }, [assets, query]);

  if (!open) return null;

  const selectFile = async (next: File | null) => {
    setError("");
    if (!next) return;
    if (!/^image\/(jpeg|png|webp)$/.test(next.type) || next.size > 8 * 1024 * 1024) {
      setError(t.error);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const loaded = await imageFromFile(next);
    setFile(next);
    setPreviewUrl(loaded.url);
    setNatural({ width: loaded.img.naturalWidth, height: loaded.img.naturalHeight });
    setZoom(1);
    setPosX(50);
    setPosY(50);
  };

  const cropAndUpload = async () => {
    if (!file || !previewUrl) return;
    setBusy(true);
    setError("");
    try {
      const img = new Image();
      img.src = previewUrl;
      await img.decode();
      const targetRatio = ratioMap[ratio];
      let cropW = img.naturalWidth / zoom;
      let cropH = img.naturalHeight / zoom;
      if (targetRatio) {
        if (cropW / cropH > targetRatio) cropW = cropH * targetRatio;
        else cropH = cropW / targetRatio;
      }
      const maxX = img.naturalWidth - cropW;
      const maxY = img.naturalHeight - cropH;
      const sx = Math.max(0, Math.min(maxX, maxX * (posX / 100)));
      const sy = Math.max(0, Math.min(maxY, maxY * (posY / 100)));
      const scale = Math.min(1, 2000 / Math.max(cropW, cropH));
      const outW = Math.max(1, Math.round(cropW * scale));
      const outH = Math.max(1, Math.round(cropH * scale));
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas_unavailable");
      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
      if (!blob) throw new Error("encode_failed");
      const body = new FormData();
      body.set("file", new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "image"}.webp`, { type: "image/webp" }));
      body.set("altFa", altFa);
      body.set("width", String(outW));
      body.set("height", String(outH));
      const response = await fetch("/api/admin/editor-media", { method: "POST", body });
      if (!response.ok) throw new Error(await response.text());
      const json = (await response.json()) as { asset: EditorMediaAsset };
      onUploaded(json.asset);
      onSelect(json.asset);
      onClose();
    } catch (uploadError) {
      console.error("[media-studio]", uploadError);
      setError(t.error);
    } finally {
      setBusy(false);
    }
  };

  const useExternal = () => {
    const value = external.trim();
    if (!/^https:\/\//i.test(value)) return setError(t.error);
    onSelect({ id: `external-${Date.now()}`, url: value, altFa });
    onClose();
  };

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" dir={rtl ? "rtl" : "ltr"}>
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <ImageIcon className="h-5 w-5 text-sky-600"/><h2 className="flex-1 text-base font-black text-slate-900">{t.title}</h2>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100"><X className="h-4 w-4"/></button>
      </div>
      <div className="flex gap-2 border-b border-slate-200 px-5 py-3">
        <button onClick={()=>setTab("library")} className={`rounded-xl px-4 py-2 text-xs font-black ${tab==="library"?"bg-slate-900 text-white":"bg-slate-100"}`}>{t.library}</button>
        <button onClick={()=>setTab("upload")} className={`rounded-xl px-4 py-2 text-xs font-black ${tab==="upload"?"bg-slate-900 text-white":"bg-slate-100"}`}>{t.upload}</button>
      </div>
      {tab === "library" ? <div className="min-h-0 flex-1 overflow-auto p-5">
        <label className="relative mb-4 block"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} className="h-11 w-full rounded-xl border border-slate-200 ps-10 pe-3 text-sm outline-none focus:border-sky-400"/></label>
        {filtered.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filtered.map(asset=><button key={asset.id} onClick={()=>{onSelect(asset);onClose()}} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-start hover:border-sky-400 hover:shadow-lg"><div className="aspect-[4/3] bg-slate-100"><img src={asset.url} alt={asset.altFa||""} className="h-full w-full object-cover"/></div><div className="truncate p-3 text-[11px] text-slate-600">{asset.altFa||asset.url}</div></button>)}</div> : <div className="py-20 text-center text-sm text-slate-400">{t.empty}</div>}
      </div> : <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[1.25fr_.75fr]">
        <div className="border-e border-slate-200 p-5">
          <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void selectFile(e.dataTransfer.files?.[0]||null)}} onClick={()=>inputRef.current?.click()} className="relative flex min-h-[360px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
            {previewUrl ? <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{objectPosition:`${posX}% ${posY}%`,transform:`scale(${zoom})`}}/> : <div className="relative z-10 text-center"><Upload className="mx-auto h-8 w-8 text-sky-600"/><p className="mt-3 text-sm font-bold text-slate-700">{t.drop}</p><span className="mt-3 inline-flex rounded-xl bg-white px-4 py-2 text-xs font-black shadow-sm">{t.choose}</span></div>}
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>void selectFile(e.target.files?.[0]||null)}/>
          </div>
          {natural.width>0?<p className="mt-2 text-[11px] text-slate-400">{natural.width} × {natural.height}px</p>:null}
        </div>
        <div className="space-y-5 p-5">
          <div><div className="mb-2 text-xs font-black text-slate-700">{t.ratio}</div><div className="flex flex-wrap gap-2">{Object.keys(ratioMap).map(key=><button key={key} onClick={()=>setRatio(key)} className={`rounded-lg px-3 py-2 text-[11px] font-black ${ratio===key?"bg-sky-600 text-white":"bg-slate-100"}`}>{t[key as keyof typeof t] as string}</button>)}</div></div>
          <label className="block text-xs font-bold text-slate-600">{t.zoom}<input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={e=>setZoom(Number(e.target.value))} className="mt-2 w-full"/></label>
          <label className="block text-xs font-bold text-slate-600">{t.x}<input type="range" min="0" max="100" value={posX} onChange={e=>setPosX(Number(e.target.value))} className="mt-2 w-full"/></label>
          <label className="block text-xs font-bold text-slate-600">{t.y}<input type="range" min="0" max="100" value={posY} onChange={e=>setPosY(Number(e.target.value))} className="mt-2 w-full"/></label>
          <label className="block text-xs font-bold text-slate-600">{t.alt}<input value={altFa} onChange={e=>setAltFa(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label>
          <button onClick={()=>void cropAndUpload()} disabled={!file||busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e80346] text-xs font-black text-white disabled:opacity-40"><Check className="h-4 w-4"/>{busy?t.uploading:t.send}</button>
          <div className="border-t border-slate-200 pt-4"><label className="block text-xs font-bold text-slate-600">{t.external}<div className="mt-2 flex gap-2"><input value={external} onChange={e=>setExternal(e.target.value)} dir="ltr" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs"/><button onClick={useExternal} className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[11px] font-black"><Link2 className="h-3.5 w-3.5"/>{t.use}</button></div></label></div>
          {error?<p className="text-xs font-bold text-rose-600">{error}</p>:null}
        </div>
      </div>}
    </div>
  </div>;
}
