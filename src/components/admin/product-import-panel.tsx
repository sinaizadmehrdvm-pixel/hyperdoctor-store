"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors?: { line: number; sku: string; error: string }[];
};

export function ProductImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function runImport() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/products/import", { method: "POST", body });
      const data = await response.json();
      if (!response.ok && !data.created && !data.updated) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-foreground">ورود گروهی محصولات با CSV</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
              فایل قالب را پر کن و یکجا همه کالاها، قیمت، موجودی، چهار زبان، مشخصات فنی و لینک تصاویر را وارد کن. اگر SKU از قبل وجود داشته باشد همان محصول به‌روزرسانی می‌شود.
            </p>
          </div>
          <Link
            href="/templates/product-import-template.csv"
            target="_blank"
            className="vitalis-focus inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-muted-bg px-4 text-xs font-bold text-foreground hover:border-primary/30"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            دانلود قالب CSV
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted-bg/60 p-6 text-center">
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const selected = event.target.files?.[0] ?? null; setFile(selected); setResult(null); setError(null); }} />
          <UploadCloud className="mx-auto h-9 w-9 text-primary-glow" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-foreground">{file ? file.name : "یک فایل CSV انتخاب کن"}</p>
          <p className="mt-1 text-xs text-muted">حداکثر 5MB · UTF-8 · هر ردیف یک محصول</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="vitalis-focus min-h-10 rounded-xl border border-border bg-white px-4 text-xs font-bold text-foreground hover:bg-muted-bg">انتخاب فایل</button>
            <button type="button" onClick={runImport} disabled={!file || busy} className="vitalis-focus inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-white hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
              {busy ? "در حال ورود..." : "شروع ورود کالاها"}
            </button>
          </div>
        </div>
      </section>

      {result ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />ورود فایل انجام شد</div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center"><Stat label="جدید" value={result.created} /><Stat label="به‌روزرسانی" value={result.updated} /><Stat label="خطا" value={result.failed} /></div>
          {result.errors?.length ? <div className="mt-5 max-h-72 overflow-auto rounded-xl border border-amber-200 bg-white p-3"><p className="mb-2 flex items-center gap-1.5 text-xs font-black text-amber-800"><AlertTriangle className="h-4 w-4" aria-hidden="true" />ردیف‌های نیازمند اصلاح</p><ul className="space-y-1 text-xs text-muted">{result.errors.map((item, index) => <li key={`${item.line}-${index}`}>ردیف {item.line} {item.sku ? `(${item.sku})` : ""}: {item.error}</li>)}</ul></div> : null}
        </section>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

      <section className="rounded-2xl border border-border bg-white p-5 text-sm leading-7 text-muted">
        <h3 className="font-black text-foreground">نکات مهم قبل از Import</h3>
        <p className="mt-2">ابتدا دسته‌بندی‌های مورد استفاده را در پنل بساز. مقدار <code className="rounded bg-muted-bg px-1.5 py-0.5 text-xs">categorySlug</code> باید دقیقاً با Slug دسته‌بندی یکی باشد. برای چند تصویر، آدرس تصاویر را در ستون <code className="rounded bg-muted-bg px-1.5 py-0.5 text-xs">imageUrls</code> با علامت ; جدا کن.</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-white p-3"><div className="text-xl font-black text-foreground tabular-nums">{value}</div><div className="mt-1 text-xs text-muted">{label}</div></div>;
}
