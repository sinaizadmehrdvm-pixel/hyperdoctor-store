"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export function ContactForm() {
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const copy = locale === "fa"
    ? {
        name: "نام و نام خانوادگی",
        phone: "شماره تماس / موبایل",
        email: "ایمیل (اختیاری)",
        department: "دپارتمان مربوطه",
        message: "متن پیام",
        send: "ارسال پیام",
        success: "پیام شما با موفقیت در سیستم هایپر دکتر ثبت شد.",
        failure: "ثبت پیام انجام نشد. لطفاً دوباره تلاش کنید.",
        departments: [["GENERAL", "مشاوره عمومی"], ["SALES", "فروش تجهیزات"], ["RESPIRATORY", "خدمات تنفسی"], ["TECHNICAL", "پشتیبانی فنی"], ["WARRANTY", "گارانتی و خدمات پس از فروش"]],
      }
    : locale === "tr"
      ? {
          name: "Ad Soyad", phone: "Telefon", email: "E-posta (isteğe bağlı)", department: "İlgili bölüm", message: "Mesajınız", send: "Mesaj gönder", success: "Mesajınız Hyper Doctor sistemine kaydedildi.", failure: "Mesaj kaydedilemedi. Lütfen tekrar deneyin.",
          departments: [["GENERAL", "Genel danışmanlık"], ["SALES", "Cihaz satışları"], ["RESPIRATORY", "Solunum hizmetleri"], ["TECHNICAL", "Teknik destek"], ["WARRANTY", "Garanti ve satış sonrası"]],
        }
      : locale === "ar"
        ? {
            name: "الاسم الكامل", phone: "رقم الهاتف", email: "البريد الإلكتروني (اختياري)", department: "القسم المختص", message: "نص الرسالة", send: "إرسال الرسالة", success: "تم تسجيل رسالتك بنجاح في نظام Hyper Doctor.", failure: "تعذر تسجيل الرسالة. يرجى المحاولة مرة أخرى.",
            departments: [["GENERAL", "استشارة عامة"], ["SALES", "مبيعات المعدات"], ["RESPIRATORY", "خدمات التنفس"], ["TECHNICAL", "الدعم الفني"], ["WARRANTY", "الضمان وخدمات ما بعد البيع"]],
          }
        : {
            name: "Full name", phone: "Phone", email: "Email (optional)", department: "Department", message: "Message", send: "Send message", success: "Your message was registered in the Hyper Doctor system.", failure: "Your message could not be registered. Please try again.",
            departments: [["GENERAL", "General consultation"], ["SALES", "Equipment sales"], ["RESPIRATORY", "Respiratory services"], ["TECHNICAL", "Technical support"], ["WARRANTY", "Warranty & after-sales"]],
          };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestToken: crypto.randomUUID(),
          customerName: String(form.get("customerName") || ""),
          phone: String(form.get("phone") || ""),
          email: String(form.get("email") || ""),
          department: String(form.get("department") || "GENERAL"),
          message: String(form.get("message") || ""),
          locale,
        }),
      });
      if (!response.ok) throw new Error("failed");
      setResult({ ok: true, message: copy.success });
      event.currentTarget.reset();
    } catch {
      setResult({ ok: false, message: copy.failure });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "h-12 w-full rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none transition focus:border-[#009dd8] focus:ring-2 focus:ring-[#009dd8]/10";

  return (
    <form onSubmit={submit} className="rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_18px_50px_rgba(0,23,54,.055)] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.name}><input name="customerName" required minLength={2} maxLength={120} className={inputClass} /></Field>
        <Field label={copy.phone}><input name="phone" required minLength={8} maxLength={24} dir="ltr" className={inputClass} /></Field>
        <Field label={copy.email}><input name="email" type="email" dir="ltr" className={inputClass} /></Field>
        <Field label={copy.department}>
          <select name="department" className={inputClass}>{copy.departments.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </Field>
      </div>
      <Field label={copy.message} className="mt-4">
        <textarea name="message" required minLength={10} maxLength={3000} rows={7} className="w-full rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 py-3 text-sm leading-7 text-[#001736] outline-none transition focus:border-[#009dd8] focus:ring-2 focus:ring-[#009dd8]/10" />
      </Field>
      {result ? <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm font-bold ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}<span>{result.message}</span></div> : null}
      <button type="submit" disabled={submitting} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#002b5b] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,43,91,.18)] transition hover:bg-[#001736] disabled:opacity-60 sm:w-auto">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{copy.send}
      </button>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-black text-[#5f6570]">{label}</span>{children}</label>;
}
