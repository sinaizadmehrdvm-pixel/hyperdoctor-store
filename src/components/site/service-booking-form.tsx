"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MoonStar,
  Stethoscope,
  Wrench,
  Wind,
} from "lucide-react";

type ServiceOption = {
  id: string;
  slug: string;
  nameFa: string;
  nameTr?: string | null;
  nameEn: string;
  nameAr?: string | null;
  descriptionFa?: string | null;
  descriptionTr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
};

const timeSlots = ["08:00 - 09:30", "10:00 - 11:30", "13:00 - 14:30", "15:00 - 16:30", "17:00 - 18:30"];

function localize(locale: string, item: ServiceOption, field: "name" | "description") {
  const suffix = locale === "fa" ? "Fa" : locale === "tr" ? "Tr" : locale === "ar" ? "Ar" : "En";
  const value = item[`${field}${suffix}` as keyof ServiceOption];
  return String(value || item[`${field}En` as keyof ServiceOption] || item[`${field}Fa` as keyof ServiceOption] || "");
}

function iconFor(slug: string) {
  if (slug.includes("sleep")) return MoonStar;
  if (slug.includes("titration")) return Wind;
  if (slug.includes("repair") || slug.includes("installation")) return Wrench;
  return Stethoscope;
}

export function ServiceBookingForm({ services, initialSlug }: { services: ServiceOption[]; initialSlug?: string }) {
  const locale = useLocale();
  const initial = services.find((service) => service.slug === initialSlug) ?? services[0];
  const [serviceId, setServiceId] = useState(initial?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(timeSlots[1]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);
  const selected = useMemo(() => services.find((service) => service.id === serviceId), [services, serviceId]);

  const copy = locale === "fa"
    ? {
        title: "رزرو نوبت آنلاین",
        subtitle: "خدمت مورد نظر و زمان مناسب را انتخاب کنید. درخواست شما مستقیماً برای تیم هایپر دکتر ثبت می‌شود.",
        service: "۱. انتخاب نوع خدمت",
        time: "۲. انتخاب زمان",
        details: "۳. اطلاعات تماس",
        summary: "خلاصه رزرو",
        review: "اطلاعات نوبت خود را بررسی کنید",
        date: "تاریخ",
        hour: "ساعت",
        status: "وضعیت",
        pending: "در انتظار تأیید",
        confirm: "تأیید و ثبت نوبت",
        success: "درخواست رزرو با موفقیت ثبت شد. تیم هایپر دکتر برای تأیید زمان با شما تماس می‌گیرد.",
        name: "نام و نام خانوادگی",
        phone: "شماره تماس",
        email: "ایمیل (اختیاری)",
        address: "آدرس / محل ارائه خدمت (اختیاری)",
        notes: "توضیحات (اختیاری)",
        required: "لطفاً خدمت، تاریخ، ساعت، نام و شماره تماس را کامل کنید.",
      }
    : locale === "tr"
      ? {
          title: "Online Randevu",
          subtitle: "Hizmeti ve uygun zamanı seçin. Talebiniz doğrudan Hyper Doctor ekibine iletilir.",
          service: "1. Hizmet seçimi",
          time: "2. Zaman seçimi",
          details: "3. İletişim bilgileri",
          summary: "Randevu özeti",
          review: "Randevu bilgilerinizi kontrol edin",
          date: "Tarih",
          hour: "Saat",
          status: "Durum",
          pending: "Onay bekliyor",
          confirm: "Randevuyu kaydet",
          success: "Randevu talebiniz alındı. Hyper Doctor ekibi zamanı onaylamak için sizinle iletişime geçecek.",
          name: "Ad Soyad",
          phone: "Telefon",
          email: "E-posta (isteğe bağlı)",
          address: "Adres / hizmet konumu (isteğe bağlı)",
          notes: "Notlar (isteğe bağlı)",
          required: "Lütfen hizmet, tarih, saat, ad ve telefon bilgilerini tamamlayın.",
        }
      : locale === "ar"
        ? {
            title: "حجز موعد عبر الإنترنت",
            subtitle: "اختر الخدمة والوقت المناسب وسيتم إرسال الطلب مباشرة إلى فريق Hyper Doctor.",
            service: "١. اختيار الخدمة",
            time: "٢. اختيار الوقت",
            details: "٣. معلومات الاتصال",
            summary: "ملخص الحجز",
            review: "راجع معلومات الموعد",
            date: "التاريخ",
            hour: "الوقت",
            status: "الحالة",
            pending: "بانتظار التأكيد",
            confirm: "تأكيد الحجز",
            success: "تم تسجيل طلب الحجز بنجاح. سيتواصل معك فريق Hyper Doctor لتأكيد الموعد.",
            name: "الاسم الكامل",
            phone: "رقم الهاتف",
            email: "البريد الإلكتروني (اختياري)",
            address: "العنوان / موقع الخدمة (اختياري)",
            notes: "ملاحظات (اختياري)",
            required: "يرجى إكمال الخدمة والتاريخ والوقت والاسم ورقم الهاتف.",
          }
        : {
            title: "Online Booking",
            subtitle: "Choose the service and preferred time. Your request is sent directly to the Hyper Doctor team.",
            service: "1. Choose service",
            time: "2. Choose time",
            details: "3. Contact details",
            summary: "Booking summary",
            review: "Review your appointment details",
            date: "Date",
            hour: "Time",
            status: "Status",
            pending: "Pending confirmation",
            confirm: "Confirm booking",
            success: "Your booking request was registered. The Hyper Doctor team will contact you to confirm the time.",
            name: "Full name",
            phone: "Phone",
            email: "Email (optional)",
            address: "Address / service location (optional)",
            notes: "Notes (optional)",
            required: "Please complete service, date, time, name and phone.",
          };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customerName = String(form.get("customerName") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    if (!serviceId || !date || !time || customerName.length < 2 || phone.length < 8) {
      setResult({ ok: false, error: copy.required });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const response = await fetch("/api/service-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestToken: crypto.randomUUID(),
          serviceId,
          customerName,
          phone,
          email: String(form.get("email") || ""),
          preferredDate: date,
          preferredTime: time,
          address: String(form.get("address") || ""),
          notes: String(form.get("notes") || ""),
          locale,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Booking failed");
      setResult({ ok: true, id: data.bookingId });
      event.currentTarget.reset();
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : "Booking failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-8">
        <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_18px_45px_rgba(0,23,54,.05)] sm:p-7">
          <h2 className="text-xl font-black text-[#001736]">{copy.service}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {services.map((service) => {
              const active = service.id === serviceId;
              const Icon = iconFor(service.slug);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setServiceId(service.id)}
                  className={`group flex min-h-28 items-start gap-4 rounded-2xl border p-4 text-start transition ${active ? "border-[#009dd8] bg-[#d6e3ff]/35 shadow-[0_10px_25px_rgba(0,157,216,.10)]" : "border-[#dfe4ea] bg-[#f9fbfd] hover:border-[#009dd8]/55"}`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${active ? "bg-[#002b5b] text-white" : "bg-[#edf4fb] text-[#002b5b]"}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-black text-[#001736]">{localize(locale, service, "name")}</strong>
                    <span className="mt-1 block text-xs leading-6 text-[#5f6570]">{localize(locale, service, "description")}</span>
                  </span>
                  {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#009dd8]" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_18px_45px_rgba(0,23,54,.05)] sm:p-7">
          <h2 className="text-xl font-black text-[#001736]">{copy.time}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.4fr]">
            <label className="flex flex-col gap-2 text-xs font-bold text-[#43474f]">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#009dd8]" />{copy.date}</span>
              <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 text-sm text-[#001736] outline-none focus:border-[#009dd8]" />
            </label>
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold text-[#43474f]"><Clock3 className="h-4 w-4 text-[#009dd8]" />{copy.hour}</p>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => (
                  <button key={slot} type="button" onClick={() => setTime(slot)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${time === slot ? "border-[#002b5b] bg-[#002b5b] text-white" : "border-[#c4c6d0] bg-white text-[#43474f] hover:border-[#009dd8]"}`}>{slot}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <form id="service-booking-form" onSubmit={submit} className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_18px_45px_rgba(0,23,54,.05)] sm:p-7">
          <h2 className="text-xl font-black text-[#001736]">{copy.details}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field name="customerName" label={copy.name} required />
            <Field name="phone" label={copy.phone} required dir="ltr" />
            <Field name="email" label={copy.email} type="email" dir="ltr" />
            <Field name="address" label={copy.address} />
          </div>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#5f6570]">{copy.notes}</span>
            <textarea name="notes" rows={4} className="rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 py-3 text-sm text-[#001736] outline-none focus:border-[#009dd8]" />
          </label>
          {result ? (
            <div className={`mt-5 rounded-xl border p-4 text-sm font-bold ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
              {result.ok ? copy.success : result.error}
              {result.ok && result.id ? <span className="ms-2 font-mono text-xs opacity-70">#{result.id.slice(0, 8)}</span> : null}
            </div>
          ) : null}
        </form>
      </div>

      <aside className="lg:col-span-4">
        <div className="sticky top-28 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_24px_60px_rgba(0,23,54,.10)] backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#001736] text-white"><Stethoscope className="h-6 w-6" /></div>
            <h2 className="mt-4 text-xl font-black text-[#001736]">{copy.summary}</h2>
            <p className="mt-1 text-xs text-[#747780]">{copy.review}</p>
          </div>
          <dl className="mt-6 space-y-4 text-sm">
            <SummaryRow label={copy.service} value={selected ? localize(locale, selected, "name") : "—"} />
            <SummaryRow label={copy.date} value={date || "—"} />
            <SummaryRow label={copy.hour} value={time || "—"} />
            <SummaryRow label={copy.status} value={copy.pending} accent />
          </dl>
          <button form="service-booking-form" type="submit" disabled={submitting} className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#002b5b] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,43,91,.22)] transition hover:bg-[#001736] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {copy.confirm}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({ name, label, required, type = "text", dir }: { name: string; label: string; required?: boolean; type?: string; dir?: "ltr" | "rtl" }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-[#5f6570]">{label}</span>
      <input name={name} required={required} type={type} dir={dir} className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 text-sm text-[#001736] outline-none focus:border-[#009dd8]" />
    </label>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e0e3e6] pb-3 last:border-0">
      <dt className="text-xs font-bold text-[#747780]">{label}</dt>
      <dd className={`text-end text-xs font-black ${accent ? "text-[#ba0036]" : "text-[#001736]"}`}>{value}</dd>
    </div>
  );
}
