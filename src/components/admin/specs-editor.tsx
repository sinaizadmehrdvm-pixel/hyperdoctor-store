"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type SpecRow = { key: string; fa: string; tr: string; en: string; ar: string };

function parseInitial(json: string): SpecRow[] {
  try {
    const parsed = JSON.parse(json) as Record<string, string | Partial<Omit<SpecRow, "key">>>;
    return Object.entries(parsed).map(([key, value]) => {
      if (typeof value === "string") {
        return { key, fa: value, tr: value, en: value, ar: value };
      }
      return {
        key,
        fa: value.fa ?? "",
        tr: value.tr ?? "",
        en: value.en ?? "",
        ar: value.ar ?? "",
      };
    });
  } catch {
    return [];
  }
}

export function SpecsEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [rows, setRows] = useState<SpecRow[]>(() => parseInitial(defaultValue ?? "{}"));

  const serialized = JSON.stringify(
    Object.fromEntries(
      rows
        .filter((row) => row.key.trim())
        .map((row) => [row.key.trim(), { fa: row.fa, tr: row.tr, en: row.en, ar: row.ar }]),
    ),
  );

  function update(index: number, patch: Partial<SpecRow>) {
    setRows((previous) => previous.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <fieldset className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold text-muted">مشخصات فنی چندزبانه</legend>
      <input type="hidden" name={name} value={serialized} />

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="rounded-xl border border-border bg-muted-bg/50 p-3">
            <div className="grid gap-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto]">
              <input
                placeholder="ویژگی / کلید"
                value={row.key}
                onChange={(event) => update(index, { key: event.target.value })}
                className="vitalis-focus h-10 rounded-lg border border-border bg-white px-2.5 text-xs"
              />
              <input
                placeholder="مقدار فارسی"
                value={row.fa}
                onChange={(event) => update(index, { fa: event.target.value })}
                className="vitalis-focus h-10 rounded-lg border border-border bg-white px-2.5 text-xs"
              />
              <input
                placeholder="Türkçe değer"
                dir="ltr"
                value={row.tr}
                onChange={(event) => update(index, { tr: event.target.value })}
                className="vitalis-focus h-10 rounded-lg border border-border bg-white px-2.5 text-xs"
              />
              <input
                placeholder="English value"
                dir="ltr"
                value={row.en}
                onChange={(event) => update(index, { en: event.target.value })}
                className="vitalis-focus h-10 rounded-lg border border-border bg-white px-2.5 text-xs"
              />
              <input
                placeholder="القيمة العربية"
                value={row.ar}
                onChange={(event) => update(index, { ar: event.target.value })}
                className="vitalis-focus h-10 rounded-lg border border-border bg-white px-2.5 text-xs"
              />
              <button
                type="button"
                onClick={() => setRows((previous) => previous.filter((_, i) => i !== index))}
                className="vitalis-focus flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-accent/10 hover:text-accent"
                aria-label="حذف مشخصه"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((previous) => [...previous, { key: "", fa: "", tr: "", en: "", ar: "" }])}
        className="vitalis-focus mt-3 flex min-h-10 w-fit items-center gap-1.5 rounded-xl border border-dashed border-border px-4 text-xs font-bold text-foreground transition hover:border-primary/40 hover:bg-muted-bg"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        افزودن مشخصه
      </button>
    </fieldset>
  );
}
