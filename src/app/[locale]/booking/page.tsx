import { getLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ServiceBookingForm } from "@/components/site/service-booking-form";
import { getServices } from "@/lib/queries";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const [{ service }, locale, services] = await Promise.all([
    searchParams,
    getLocale(),
    getServices(),
  ]);

  const copy = locale === "fa"
    ? {
        eyebrow: "Hyper Doctor Care",
        title: "رزرو نوبت آنلاین",
        body: "رزرو تست خواب، تیتراسیون PAP، نصب، اجاره و تعمیر تجهیزات پزشکی با ثبت مستقیم درخواست در سیستم هایپر دکتر.",
      }
    : locale === "tr"
      ? {
          eyebrow: "Hyper Doctor Care",
          title: "Online Randevu",
          body: "Uyku testi, PAP titrasyonu, kurulum, kiralama ve bakım hizmetleri için talebinizi doğrudan Hyper Doctor sistemine kaydedin.",
        }
      : locale === "ar"
        ? {
            eyebrow: "Hyper Doctor Care",
            title: "حجز موعد عبر الإنترنت",
            body: "احجز اختبار النوم ومعايرة PAP والتركيب والتأجير والصيانة مباشرة عبر نظام Hyper Doctor.",
          }
        : {
            eyebrow: "Hyper Doctor Care",
            title: "Online Service Booking",
            body: "Book sleep testing, PAP titration, installation, rental and repair services directly through the Hyper Doctor system.",
          };

  return (
    <main className="flex-1 bg-[#f5f8fb] pb-16 pt-6 sm:pt-10">
      <Container>
        <section className="relative mb-7 overflow-hidden rounded-[2rem] bg-[#001736] px-6 py-9 text-white shadow-[0_24px_65px_rgba(0,23,54,.16)] sm:px-10 lg:px-12">
          <div className="absolute inset-y-0 end-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(0,157,216,.22),transparent_62%)]" />
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{copy.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d6e3ff]/85 sm:text-base">{copy.body}</p>
          </div>
        </section>

        <ServiceBookingForm
          initialSlug={service}
          services={services.map((item) => ({
            id: item.id,
            slug: item.slug,
            nameFa: item.nameFa,
            nameTr: item.nameTr,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            descriptionFa: item.descriptionFa,
            descriptionTr: item.descriptionTr,
            descriptionEn: item.descriptionEn,
            descriptionAr: item.descriptionAr,
          }))}
        />
      </Container>
    </main>
  );
}
