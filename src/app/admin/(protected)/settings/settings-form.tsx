"use client";

import { startTransition, useActionState, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { AdminLocale } from "@/lib/admin-i18n";
import { updateSiteSettings, type SettingsActionState } from "./actions";

const copy = {
  fa: { saving: "در حال ذخیره…", saved: "تغییرات با موفقیت ذخیره شد.", invalid: "لطفاً مقدار فیلد مشخص‌شده را اصلاح کنید.", failed: "ذخیره انجام نشد. اطلاعات را بررسی و دوباره تلاش کنید.", uploading: "لطفاً تا پایان آپلود تصویر صبر کنید.", email: "ایمیل معتبر وارد کنید؛ مانند name@example.com.", url: "لینک شبکه اجتماعی باید با https:// یا http:// شروع شود." },
  en: { saving: "Saving…", saved: "Changes saved successfully.", invalid: "Please correct the highlighted field.", failed: "Could not save. Check the information and try again.", uploading: "Please wait for the image upload to finish.", email: "Enter a valid email, such as name@example.com.", url: "Social links must start with https:// or http://." },
  tr: { saving: "Kaydediliyor…", saved: "Değişiklikler kaydedildi.", invalid: "Lütfen işaretli alanı düzeltin.", failed: "Kaydedilemedi. Bilgileri kontrol edip tekrar deneyin.", uploading: "Lütfen görsel yüklemesinin tamamlanmasını bekleyin.", email: "name@example.com gibi geçerli bir e-posta girin.", url: "Sosyal bağlantılar https:// veya http:// ile başlamalıdır." },
  ar: { saving: "جارٍ الحفظ…", saved: "تم حفظ التغييرات بنجاح.", invalid: "يرجى تصحيح الحقل المحدد.", failed: "تعذر الحفظ. راجع المعلومات وحاول مرة أخرى.", uploading: "يرجى انتظار اكتمال رفع الصورة.", email: "أدخل بريداً صالحاً مثل name@example.com.", url: "يجب أن تبدأ الروابط بـ https:// أو http://." },
};
const initialState: SettingsActionState = { status: "idle" };

export function SettingsForm({ locale, saveLabel, children }: { locale: AdminLocale; saveLabel: string; children: ReactNode }) {
  const [state, action, pending] = useActionState(updateSiteSettings, initialState);
  const [localError, setLocalError] = useState("");
  const [edited, setEdited] = useState(false);
  const t = copy[locale];
  const message = localError || (!edited && !pending ? state.status === "success" ? t.saved : state.status === "error" ? state.error === "invalid_contact_email" ? t.email : state.error?.endsWith("_url") ? t.url : t.failed : "" : "");
  const success = !localError && state.status === "success";

  return <form action={action} className="max-w-5xl space-y-5 pb-20" aria-busy={pending}
    onChange={() => { setEdited(true); setLocalError(""); }}
    onInvalid={() => setLocalError(t.invalid)}
    onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      if (event.currentTarget.querySelector('[data-uploading="true"]')) {
        setLocalError(t.uploading);
        return;
      }
      const data = new FormData(event.currentTarget);
      setLocalError("");
      setEdited(false);
      // Manual dispatch preserves entered values when the server rejects a save.
      startTransition(() => action(data));
    }}>
    <fieldset disabled={pending} className="min-w-0 space-y-5 border-0 p-0">{children}</fieldset>
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
      <p role={success ? "status" : "alert"} aria-live="polite" className={`text-sm font-bold ${success ? "text-emerald-700" : "text-accent"}`}>{message}</p>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {pending ? t.saving : saveLabel}
      </button>
    </div>
  </form>;
}
