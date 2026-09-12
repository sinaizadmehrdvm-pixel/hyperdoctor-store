import Link from "next/link";
import {
  BadgeDollarSign,
  CheckCircle2,
  CircleAlert,
  FileText,
  ImageOff,
  Languages,
  PackageCheck,
  ShieldCheck,
  Store,
  Warehouse,
} from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import { adminNumber, type AdminLocale } from "@/lib/admin-i18n";

type Branch = {
  id: string;
  code: string;
  nameFa: string;
  nameTr: string;
  nameEn: string;
  nameAr: string;
  currency: string;
  published: boolean;
  default: boolean;
  salesEnabled: boolean;
  paymentGateway: string;
};

type Summary = {
  stagingItems: number;
  verifiedIdentities: number;
  promotedStagingItems: number;
  needsReviewStagingItems: number;
  technicalSourceBlockedStagingItems: number;
  products: number;
  sourceBackedProducts: number;
  fourLanguageNameProducts: number;
  fourLanguageDescriptionProducts: number;
  productsWithVerifiedMedia: number;
  productsWithCurrentBranchPrice: number;
  productsWithEffectivePrice: number;
  productsWithAvailableInventory: number;
  productsWithVariants: number;
  publishReadyProducts: number;
  publishedProducts: number;
  activeBranchPriceRows: number;
  warehouseInventoryRows: number;
};

type Blockers = {
  sourceEvidenceMissing: number;
  translationMissing: number;
  verifiedMediaMissing: number;
  variantReviewRequired: number;
  branchNotPublished: number;
  salesDisabled: number;
  gatewayNotZarinpal: number;
  currencyNotIrt: number;
  priceMissing: number;
  stockMissing: number;
  descriptionWarning: number;
};

type Brand = {
  brand: string;
  products: number;
  sourceBacked: number;
  fullNames: number;
  fullDescriptions: number;
  verifiedMedia: number;
  currentBranchPrice: number;
  availableInventory: number;
  publishReady: number;
};

type BlockedStaging = {
  siteSku: string;
  sourceModel: string;
  status: string;
  identityStatus: string;
  errors: string[];
  warnings: string[];
  technicalSourceStatus: string | null;
};

type Preflight = {
  version: number;
  generatedAt: string;
  branch: Branch;
  summary: Summary;
  blockers: Blockers;
  byBrand: Brand[];
  blockedStaging: BlockedStaging[];
};

const C = {
  fa: {
    eyebrow: "نسخه ۲۸۳ · پیش‌پرواز انتشار",
    title: "Production Catalog Launch Preflight",
    desc: "این صفحه وضعیت واقعی Product Master را بدون ساخت داده، تغییر قیمت/موجودی یا انتشار محصول بررسی می‌کند. فقط داده‌های منبع‌دار و جاری می‌توانند وارد مرحله فروش شوند.",
    decisionBlocked: "هنوز آماده انتشار نیست",
    decisionReady: "محصول آماده انتشار وجود دارد",
    products: "Product Master",
    sourceBacked: "محصول منبع‌دار",
    verifiedMedia: "تصویر Verified",
    descriptions: "توضیح چهارزبانه",
    prices: "قیمت جاری شعبه",
    stock: "موجودی واقعی",
    ready: "آماده انتشار",
    published: "منتشرشده",
    blockers: "موانع اصلی",
    mediaGap: "تصویر معتبر کم است",
    priceGap: "قیمت جاری کم است",
    stockGap: "موجودی واقعی کم است",
    descGap: "توضیحات چهارزبانه ناقص",
    identityGap: "هویت/منبع فنی Staging نیازمند بررسی",
    brandReadiness: "آمادگی به تفکیک برند",
    brand: "برند",
    fullDesc: "توضیح کامل",
    media: "رسانه Verified",
    currentPrice: "قیمت جاری",
    inventory: "موجودی",
    blockedStaging: "Staging مسدودشده",
    reason: "علت",
    branch: "آمادگی شعبه",
    links: "اقدام بعدی",
    mediaAction: "تکمیل رسانه",
    commerceAction: "قیمت و موجودی",
    stagingAction: "بررسی Staging",
    gateAction: "Publish Gate",
    sourceStatus: "وضعیت منبع فنی",
    noBlocked: "ردیف Staging مسدودشده‌ای وجود ندارد.",
  },
  en: {
    eyebrow: "Version 283 · launch preflight",
    title: "Production Catalog Launch Preflight",
    desc: "Inspect the real Product Master without fabricating data, changing price or stock, or publishing anything. Only source-backed current data may enter commerce.",
    decisionBlocked: "Not ready to publish yet",
    decisionReady: "At least one product is publish-ready",
    products: "Product master",
    sourceBacked: "Source-backed",
    verifiedMedia: "Verified media",
    descriptions: "Four-language descriptions",
    prices: "Current branch prices",
    stock: "Real inventory",
    ready: "Publish-ready",
    published: "Published",
    blockers: "Primary blockers",
    mediaGap: "Verified media missing",
    priceGap: "Current price missing",
    stockGap: "Real inventory missing",
    descGap: "Four-language description incomplete",
    identityGap: "Staging technical source requires review",
    brandReadiness: "Readiness by brand",
    brand: "Brand",
    fullDesc: "Full descriptions",
    media: "Verified media",
    currentPrice: "Current price",
    inventory: "Inventory",
    blockedStaging: "Blocked staging rows",
    reason: "Reason",
    branch: "Branch readiness",
    links: "Next action",
    mediaAction: "Complete media",
    commerceAction: "Price & inventory",
    stagingAction: "Review staging",
    gateAction: "Publish gate",
    sourceStatus: "Technical source status",
    noBlocked: "No blocked staging rows.",
  },
  tr: {
    eyebrow: "Sürüm 283 · lansman ön kontrolü",
    title: "Production Catalog Launch Preflight",
    desc: "Veri uydurmadan, fiyat/stok değiştirmeden veya ürün yayınlamadan gerçek Product Master durumunu denetler. Ticarete yalnız kaynaklı ve güncel veri girebilir.",
    decisionBlocked: "Henüz yayına hazır değil",
    decisionReady: "En az bir ürün yayına hazır",
    products: "Product master",
    sourceBacked: "Kaynaklı ürün",
    verifiedMedia: "Doğrulanmış medya",
    descriptions: "Dört dilde açıklama",
    prices: "Güncel şube fiyatı",
    stock: "Gerçek stok",
    ready: "Yayına hazır",
    published: "Yayında",
    blockers: "Ana engeller",
    mediaGap: "Doğrulanmış medya eksik",
    priceGap: "Güncel fiyat eksik",
    stockGap: "Gerçek stok eksik",
    descGap: "Dört dilde açıklama eksik",
    identityGap: "Staging teknik kaynağı inceleme istiyor",
    brandReadiness: "Markaya göre hazırlık",
    brand: "Marka",
    fullDesc: "Tam açıklama",
    media: "Doğrulanmış medya",
    currentPrice: "Güncel fiyat",
    inventory: "Stok",
    blockedStaging: "Engelli staging satırları",
    reason: "Neden",
    branch: "Şube hazırlığı",
    links: "Sonraki işlem",
    mediaAction: "Medyayı tamamla",
    commerceAction: "Fiyat ve stok",
    stagingAction: "Staging incele",
    gateAction: "Yayın kapısı",
    sourceStatus: "Teknik kaynak durumu",
    noBlocked: "Engelli staging satırı yok.",
  },
  ar: {
    eyebrow: "الإصدار 283 · فحص ما قبل الإطلاق",
    title: "Production Catalog Launch Preflight",
    desc: "يفحص حالة Product Master الحقيقية دون إنشاء بيانات أو تغيير السعر والمخزون أو نشر المنتجات. لا تدخل التجارة إلا البيانات الحالية والموثقة بالمصدر.",
    decisionBlocked: "غير جاهز للنشر بعد",
    decisionReady: "يوجد منتج واحد على الأقل جاهز للنشر",
    products: "Product master",
    sourceBacked: "موثق بالمصدر",
    verifiedMedia: "وسائط موثقة",
    descriptions: "وصف بأربع لغات",
    prices: "سعر الفرع الحالي",
    stock: "مخزون حقيقي",
    ready: "جاهز للنشر",
    published: "منشور",
    blockers: "العوائق الرئيسية",
    mediaGap: "الوسائط الموثقة ناقصة",
    priceGap: "السعر الحالي مفقود",
    stockGap: "المخزون الحقيقي مفقود",
    descGap: "الوصف بأربع لغات غير مكتمل",
    identityGap: "مصدر Staging الفني يحتاج مراجعة",
    brandReadiness: "الجاهزية حسب العلامة",
    brand: "العلامة",
    fullDesc: "وصف كامل",
    media: "وسائط موثقة",
    currentPrice: "سعر حالي",
    inventory: "المخزون",
    blockedStaging: "صفوف Staging المحظورة",
    reason: "السبب",
    branch: "جاهزية الفرع",
    links: "الإجراء التالي",
    mediaAction: "استكمال الوسائط",
    commerceAction: "السعر والمخزون",
    stagingAction: "مراجعة Staging",
    gateAction: "بوابة النشر",
    sourceStatus: "حالة المصدر الفني",
    noBlocked: "لا توجد صفوف Staging محظورة.",
  },
} as const;

function branchName(branch: Branch, locale: AdminLocale) {
  return ({ fa: branch.nameFa, tr: branch.nameTr, en: branch.nameEn, ar: branch.nameAr }[locale] || branch.nameEn || branch.code);
}

function Metric({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-black ${good ? "text-emerald-700" : "text-[#001736]"}`}>{value}</p>
    </div>
  );
}

function Gap({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700">{icon}</span>
        <span className="text-sm font-black">{label}</span>
      </div>
      <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700">{value}</span>
    </div>
  );
}

export default async function CatalogPreflightPage() {
  const locale = await currentAdminLocale();
  const t = C[locale];
  const data = await adminRpc<Preflight>("admin_catalog_launch_preflight_v283");
  const summary = data.summary;
  const blockers = data.blockers;
  const anyReady = summary.publishReadyProducts > 0;
  const branchReady = data.branch.published && data.branch.salesEnabled && data.branch.currency === "IRT" && data.branch.paymentGateway === "ZARINPAL";

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="rounded-3xl border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#e80346]">{t.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black text-[#001736]">{t.title}</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">{t.desc}</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${anyReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
            {anyReady ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
            {anyReady ? t.decisionReady : t.decisionBlocked}
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={t.products} value={adminNumber(summary.products, locale)} />
        <Metric label={t.sourceBacked} value={`${adminNumber(summary.sourceBackedProducts, locale)} / ${adminNumber(summary.products, locale)}`} good={summary.sourceBackedProducts === summary.products} />
        <Metric label={t.verifiedMedia} value={`${adminNumber(summary.productsWithVerifiedMedia, locale)} / ${adminNumber(summary.products, locale)}`} />
        <Metric label={t.descriptions} value={`${adminNumber(summary.fourLanguageDescriptionProducts, locale)} / ${adminNumber(summary.products, locale)}`} />
        <Metric label={t.prices} value={`${adminNumber(summary.productsWithCurrentBranchPrice, locale)} / ${adminNumber(summary.products, locale)}`} />
        <Metric label={t.stock} value={`${adminNumber(summary.productsWithAvailableInventory, locale)} / ${adminNumber(summary.products, locale)}`} />
        <Metric label={t.ready} value={adminNumber(summary.publishReadyProducts, locale)} good={summary.publishReadyProducts > 0} />
        <Metric label={t.published} value={adminNumber(summary.publishedProducts, locale)} />
      </div>

      <section className="rounded-3xl border bg-[#f7fafd] p-5">
        <h2 className="flex items-center gap-2 font-black text-[#001736]"><ShieldCheck className="h-5 w-5 text-[#e80346]" />{t.blockers}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Gap icon={<ImageOff className="h-5 w-5" />} label={t.mediaGap} value={adminNumber(blockers.verifiedMediaMissing, locale)} />
          <Gap icon={<BadgeDollarSign className="h-5 w-5" />} label={t.priceGap} value={adminNumber(blockers.priceMissing, locale)} />
          <Gap icon={<Warehouse className="h-5 w-5" />} label={t.stockGap} value={adminNumber(blockers.stockMissing, locale)} />
          <Gap icon={<Languages className="h-5 w-5" />} label={t.descGap} value={adminNumber(blockers.descriptionWarning, locale)} />
          <Gap icon={<FileText className="h-5 w-5" />} label={t.identityGap} value={adminNumber(summary.technicalSourceBlockedStagingItems, locale)} />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border bg-white">
        <div className="border-b p-5"><h2 className="font-black text-[#001736]">{t.brandReadiness}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-50 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 text-start">{t.brand}</th>
                <th className="px-4 py-3 text-end">{t.products}</th>
                <th className="px-4 py-3 text-end">{t.fullDesc}</th>
                <th className="px-4 py-3 text-end">{t.media}</th>
                <th className="px-4 py-3 text-end">{t.currentPrice}</th>
                <th className="px-4 py-3 text-end">{t.inventory}</th>
                <th className="px-4 py-3 text-end">{t.ready}</th>
              </tr>
            </thead>
            <tbody>
              {data.byBrand.map((row) => (
                <tr key={row.brand} className="border-t">
                  <td className="px-4 py-3 font-black">{row.brand}</td>
                  <td className="px-4 py-3 text-end">{adminNumber(row.products, locale)}</td>
                  <td className="px-4 py-3 text-end">{adminNumber(row.fullDescriptions, locale)}</td>
                  <td className="px-4 py-3 text-end">{adminNumber(row.verifiedMedia, locale)}</td>
                  <td className="px-4 py-3 text-end">{adminNumber(row.currentBranchPrice, locale)}</td>
                  <td className="px-4 py-3 text-end">{adminNumber(row.availableInventory, locale)}</td>
                  <td className="px-4 py-3 text-end font-black">{adminNumber(row.publishReady, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-black text-[#001736]"><FileText className="h-5 w-5 text-[#009dd8]" />{t.blockedStaging}</h2>
          <div className="mt-4 space-y-3">
            {data.blockedStaging.map((row) => (
              <div key={row.siteSku} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs font-black text-[#009dd8]">{row.siteSku}</code>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800">{row.status}</span>
                </div>
                <p className="mt-2 text-xs text-muted">{row.sourceModel}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.errors.map((error) => <span key={error} className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">{error}</span>)}
                </div>
                {row.technicalSourceStatus ? <p className="mt-3 text-[11px] text-muted">{t.sourceStatus}: {row.technicalSourceStatus}</p> : null}
              </div>
            ))}
            {!data.blockedStaging.length ? <p className="text-sm text-muted">{t.noBlocked}</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border bg-[#f7fafd] p-5">
          <h2 className="flex items-center gap-2 font-black text-[#001736]"><Store className="h-5 w-5 text-[#009dd8]" />{t.branch}</h2>
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{branchName(data.branch, locale)} · {data.branch.code}</p>
                <p className="mt-1 text-xs text-muted">{data.branch.currency} · {data.branch.paymentGateway}</p>
              </div>
              {branchReady ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <CircleAlert className="h-6 w-6 text-amber-600" />}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-3">published=<b>{String(data.branch.published)}</b></div>
              <div className="rounded-xl bg-slate-50 p-3">sales=<b>{String(data.branch.salesEnabled)}</b></div>
              <div className="rounded-xl bg-slate-50 p-3">prices=<b>{adminNumber(summary.activeBranchPriceRows, locale)}</b></div>
              <div className="rounded-xl bg-slate-50 p-3">inventory rows=<b>{adminNumber(summary.warehouseInventoryRows, locale)}</b></div>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-black text-[#001736]">{t.links}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/admin/media" className="rounded-xl border bg-white px-4 py-3 text-xs font-black hover:border-[#009dd8]">{t.mediaAction}</Link>
            <Link href="/admin/commerce" className="rounded-xl border bg-white px-4 py-3 text-xs font-black hover:border-[#009dd8]">{t.commerceAction}</Link>
            <Link href="/admin/products/staging" className="rounded-xl border bg-white px-4 py-3 text-xs font-black hover:border-[#009dd8]">{t.stagingAction}</Link>
            <Link href="/admin/products/launch" className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-xs font-black hover:border-emerald-500"><PackageCheck className="h-4 w-4" />{t.gateAction}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
