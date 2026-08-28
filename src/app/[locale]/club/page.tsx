import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Bell,
  Diamond,
  Gift,
  Headphones,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { customerRpc, getCustomerSession } from "@/lib/customer-auth";

type Device = {
  id: string;
  serialNumber: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  productNameFa?: string | null;
  productNameEn?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
};
type Offer = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  expiresAt?: string | null;
};
type Club = {
  profile: { fullName: string };
  lifetimeSpend: number;
  points: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  nextTierPoints: number;
  spendPerPoint: number;
  devices: Device[];
  offers: Offer[];
};

const tierLabels: Record<Club["tier"], Record<string, string>> = {
  BRONZE: { fa: "برنزی", en: "Bronze", tr: "Bronz", ar: "برونزي" },
  SILVER: { fa: "نقره‌ای", en: "Silver", tr: "Gümüş", ar: "فضي" },
  GOLD: { fa: "طلایی", en: "Gold", tr: "Altın", ar: "ذهبي" },
  PLATINUM: { fa: "پلاتینیوم", en: "Platinum", tr: "Platin", ar: "بلاتيني" },
};

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale === "ar" ? "ar" : locale === "tr" ? "tr-TR" : "en-US").format(value);
}

function copy(locale: string) {
  if (locale === "tr") return {
    title: "Müşteri Kulübü", welcome: "Özel panelinize hoş geldiniz.", loyalty: "Hyper Doctor Loyalty", points: "Toplam puan", current: "Mevcut seviye", next: "sonraki seviyeye", spend: "Onaylanmış alışveriş", devices: "Kayıtlı cihaz merkezi", emptyDevices: "Hesabınıza bağlı kayıtlı garanti cihazı yok.", offers: "Aktif fırsatlar", emptyOffers: "Şu anda aktif bir teklif yok.", special: "Özel teklif", consult: "Ücretsiz danışmanlık", consultBody: "Uzman ekibimizle bir görüşme planlayın.", book: "Randevu al", account: "Hesabım", login: "Giriş yap", register: "Kayıt ol", guest: "Gerçek puan, seviye, cihaz ve fırsatları görmek için hesabınıza giriş yapın.", warranty: "Garanti bitişi" };
  if (locale === "ar") return {
    title: "نادي العملاء", welcome: "مرحباً بك في لوحتك الخاصة.", loyalty: "Hyper Doctor Loyalty", points: "إجمالي النقاط", current: "المستوى الحالي", next: "حتى المستوى التالي", spend: "قيمة المشتريات المعتمدة", devices: "مركز الأجهزة المسجلة", emptyDevices: "لا توجد أجهزة ضمان مرتبطة بحسابك.", offers: "العروض النشطة", emptyOffers: "لا توجد عروض نشطة حالياً.", special: "عرض خاص", consult: "استشارة مجانية", consultBody: "احجز جلسة مع فريقنا المتخصص.", book: "حجز موعد", account: "الحساب", login: "تسجيل الدخول", register: "إنشاء حساب", guest: "سجّل الدخول لعرض النقاط والمستوى والأجهزة والعروض الحقيقية.", warranty: "الضمان حتى" };
  if (locale === "en") return {
    title: "Customer Club", welcome: "Welcome to your private dashboard.", loyalty: "Hyper Doctor Loyalty", points: "Total points", current: "Current tier", next: "to next tier", spend: "Verified lifetime spend", devices: "Registered device center", emptyDevices: "No warranty device is linked to your account yet.", offers: "Active offers", emptyOffers: "There are no active offers right now.", special: "Special offer", consult: "Free consultation", consultBody: "Book a session with our specialist team.", book: "Book appointment", account: "My account", login: "Sign in", register: "Create account", guest: "Sign in to view your real points, tier, registered devices and active offers.", warranty: "Warranty until" };
  return {
    title: "باشگاه مشتریان", welcome: "به پنل اختصاصی خود خوش آمدید.", loyalty: "Hyper Doctor Loyalty", points: "امتیاز کل", current: "سطح فعلی", next: "امتیاز تا سطح بعد", spend: "ارزش خرید تأییدشده", devices: "مرکز کنترل دستگاه", emptyDevices: "هنوز تجهیزی با گارانتی به حساب شما متصل نشده است.", offers: "پیشنهادهای فعال", emptyOffers: "در حال حاضر پیشنهاد فعالی وجود ندارد.", special: "پیشنهاد ویژه", consult: "مشاوره رایگان", consultBody: "یک جلسه با متخصصین تجهیزات و خدمات تنفسی رزرو کنید.", book: "رزرو نوبت", account: "پنل کاربری", login: "ورود به حساب", register: "ثبت‌نام", guest: "برای مشاهده امتیاز واقعی، سطح وفاداری، تجهیزات ثبت‌شده و پیشنهادهای فعال وارد حساب کاربری شوید.", warranty: "گارانتی تا" };
}

export default async function ClubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = copy(locale);
  const session = await getCustomerSession();

  if (!session) {
    return (
      <main className="min-h-[78vh] bg-[#02070b] py-10 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111a] p-8 shadow-[0_30px_80px_rgba(0,0,0,.35)] sm:p-12">
            <div className="absolute -end-16 -top-20 h-72 w-72 rounded-full bg-[#003f7f]/35 blur-3xl" />
            <div className="absolute -bottom-24 start-1/4 h-64 w-64 rounded-full bg-[#9d0030]/25 blur-3xl" />
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><Star className="h-8 w-8 text-[#82cfff]" /></div>
              <p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">{c.loyalty}</p>
              <h1 className="mt-3 text-3xl font-black sm:text-5xl">{c.title}</h1>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-8 text-white/60">{c.guest}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={`/${locale}/account/login`} className="rounded-xl bg-[#009dd8] px-6 py-3 text-sm font-black text-white shadow-lg">{c.login}</Link>
                <Link href={`/${locale}/account/register`} className="rounded-xl border border-white/15 bg-white/8 px-6 py-3 text-sm font-black text-white">{c.register}</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const data = await customerRpc<Club>("customer_club_dashboard");
  const progress = data.tier === "PLATINUM" ? 100 : Math.max(4, Math.min(100, Math.round((data.points / Math.max(1, data.points + data.nextTierPoints)) * 100)));
  const tier = tierLabels[data.tier][locale] || tierLabels[data.tier].en;

  return (
    <main className="min-h-screen bg-[#02070b] pb-16 text-white">
      <div className="border-b border-white/8 bg-[#050b11]/95 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#82cfff]">{c.loyalty}</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">{c.title}</h1></div>
          <div className="flex items-center gap-2"><span className="hidden text-xs text-white/55 sm:block">{data.profile.fullName}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"><Bell className="h-4 w-4" /></span></div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-black sm:text-4xl">{data.profile.fullName}</h2><p className="mt-2 text-sm text-white/50">{c.welcome}</p></div>
          <Link href={`/${locale}/account`} className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-xs font-black text-white/85"><ArrowLeft className="h-4 w-4" />{c.account}</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-[#17446f]/55 bg-[linear-gradient(145deg,#072746,#0a2038_55%,#0b1c2d)] p-6 shadow-[0_24px_70px_rgba(0,32,72,.35)] sm:p-8">
            <div className="absolute -end-12 -top-10 h-64 w-64 rounded-full border-[30px] border-[#87aefc]/20" />
            <div className="relative z-10 grid gap-8 sm:grid-cols-[1fr_220px] sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-[#82cfff]"><Diamond className="h-5 w-5" /><span className="text-xs font-black">{c.loyalty}</span></div>
                <div className="mt-6 text-5xl font-black tabular-nums">{formatNumber(data.points, locale)}</div><div className="mt-1 text-xs text-white/55">{c.points}</div>
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-center justify-between gap-3 text-xs"><span className="text-white/50">{c.current}</span><strong className="text-[#9fc4ff]">{tier}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#8db6ff]" style={{ width: `${progress}%` }} /></div><div className="mt-3 text-[11px] text-white/45">{data.nextTierPoints > 0 ? `${formatNumber(data.nextTierPoints, locale)} ${c.next}` : "MAX"}</div></div>
              </div>
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-full border-[9px] border-[#375b83] bg-[#081a2c] shadow-[inset_0_0_40px_rgba(115,169,255,.08)]"><div className="absolute inset-[-9px] rounded-full border-[9px] border-transparent border-e-[#95b9ff] border-t-[#95b9ff]" style={{ transform: `rotate(${Math.round(progress * 1.8)}deg)` }} /><div className="relative text-center"><div className="text-4xl font-black tabular-nums">{formatNumber(data.points, locale)}</div><div className="mt-2 text-xs text-white/45">{c.points}</div></div></div>
            </div>
            <div className="relative z-10 mt-6 rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[11px] text-white/45">{c.spend}</p><p className="mt-1 text-xl font-black">{formatNumber(data.lifetimeSpend, locale)}</p></div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#080e14] p-6 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-8">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#101b25]"><MonitorCog className="h-5 w-5 text-[#9fc4ff]" /></span><div><h2 className="text-lg font-black">{c.devices}</h2><p className="mt-1 text-xs text-white/35">{data.devices.length} device</p></div></div>
            <div className="mt-5 space-y-3">{data.devices.slice(0, 3).map((d) => <article key={d.id} className="rounded-2xl border border-white/10 bg-[#111820] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{d.productNameFa || d.productNameEn || "Medical Device"}</h3><p className="mt-1 text-xs text-white/40">{[d.brand, d.modelNumber].filter(Boolean).join(" · ") || "—"}</p></div><span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-400">{d.status}</span></div><div className="mt-4 grid gap-2 text-[11px] text-white/45 sm:grid-cols-2"><span dir="ltr">SN: {d.serialNumber}</span><span>{c.warranty} {new Date(d.expiresAt).toLocaleDateString(locale)}</span></div></article>)}{!data.devices.length ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-xs text-white/40">{c.emptyDevices}</div> : null}</div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[#080e14] p-6 sm:p-8"><div className="flex items-center gap-3"><Gift className="h-5 w-5 text-[#ff6f9b]" /><h2 className="text-lg font-black">{c.offers}</h2></div><div className="mt-5 grid gap-4 md:grid-cols-2">{data.offers.slice(0, 4).map((o) => <article key={o.id} className="relative overflow-hidden rounded-2xl border border-[#a20b3c]/35 bg-[radial-gradient(circle_at_100%_0%,rgba(186,0,54,.25),transparent_45%),#0d1117] p-5"><span className="inline-flex rounded-full bg-[#d60045] px-3 py-1 text-[10px] font-black">{c.special}</span><div className="mt-5 text-2xl font-black">{o.type === "PERCENT" ? `${formatNumber(o.value, locale)}%` : formatNumber(o.value, locale)}</div><div className="mt-5 flex items-center justify-between gap-3"><code className="rounded-lg border border-dashed border-white/20 bg-black/15 px-3 py-2 text-xs font-black text-[#ffd6e3]">{o.code}</code>{o.expiresAt ? <span className="text-[10px] text-white/35">{new Date(o.expiresAt).toLocaleDateString(locale)}</span> : null}</div></article>)}{!data.offers.length ? <div className="md:col-span-2 rounded-2xl border border-dashed border-white/15 p-8 text-center text-xs text-white/40">{c.emptyOffers}</div> : null}</div></section>
          <aside className="rounded-[2rem] border border-white/10 bg-[#080e14] p-6 sm:p-8"><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#111820]"><Headphones className="h-5 w-5 text-[#9fc4ff]" /></span><h2 className="mt-5 text-xl font-black">{c.consult}</h2><p className="mt-3 text-sm leading-7 text-white/50">{c.consultBody}</p><Link href={`/${locale}/booking`} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-black text-white hover:bg-white/10">{c.book}</Link><div className="mt-7 grid grid-cols-3 gap-2">{[[Activity,"24/7"],[ShieldCheck,"Secure"],[Sparkles,"VIP"]].map(([Icon,label])=>{const I=Icon as typeof Activity;return <div key={String(label)} className="rounded-xl bg-white/[.035] p-3 text-center"><I className="mx-auto h-4 w-4 text-[#82cfff]"/><span className="mt-2 block text-[10px] text-white/40">{String(label)}</span></div>})}</div></aside>
        </div>
      </div>
    </main>
  );
}
