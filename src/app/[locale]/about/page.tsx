import { getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heart, Microscope, Stethoscope } from "lucide-react";
import { Container } from "@/components/ui/container";

const HERO_IMAGE = "https://lh3.googleusercontent.com/aida/AEtjO1Xoqdt_aQ2xIlzETJ14bt_UvChuOoe_YFoIgudQEtYtM-VhEkbp2t0F0RJxLKSYvgxhz-4cPo5YzRt5woKFfnEpiJrun6uGPvOVtTp9mGQ-Wlg353ZZ_lCGwu5ERl12CQ9kM5KlDmkBf2JTMu8K_DybHuOFME1_gUvJTtz5IPMP02nI7Zo1jvYXRJaklRut36czdCfEcfIe5N8ddCHznXxPd_KP2mPrCLPJ3DPxUJtGSj4CnSNmD7iNZyp7";

export default async function AboutPage() {
  const locale = await getLocale();
  const fa = {title:"پیشرو در مراقبت‌های تنفسی. تعالی در خدمات درمانی.",body:"هایپر دکتر با تکیه بر تجربه تخصصی در تجهیزات پزشکی و خدمات سلامت، راهکارهای تنفسی و مراقبتی را با دقت، پاسخ‌گویی و پشتیبانی واقعی ارائه می‌کند.",cta:"کشف مأموریت ما",values:"ارزش‌های محوری ما",valuesSub:"مهندسی دقیق و طراحی انسان‌محور، پیشران آینده تخصص‌های پزشکی است.",cards:[["دقت بالینی","هر تجهیز و ابزار تشخیصی مطابق با استانداردهای دقیق و نیاز واقعی درمان انتخاب و معرفی می‌شود."],["انسان‌محوری","تجربه بیمار، خانواده و متخصص در مرکز طراحی خدمات و مسیرهای پشتیبانی قرار دارد."],["پیشرفت تکنولوژیک","از تجهیزات نوین تا زیرساخت دیجیتال، فناوری برای افزایش کیفیت مراقبت به‌کار گرفته می‌شود."]]};
  const en = {title:"Leading respiratory care. Excellence in health services.",body:"Hyper Doctor combines specialist medical-equipment experience with dependable respiratory and care services, built around precision, responsiveness and real support.",cta:"Discover our mission",values:"Our core values",valuesSub:"Precision engineering and human-centered design drive the future of specialist care.",cards:[["Clinical precision","Every device and diagnostic tool is selected and presented around rigorous standards and real care needs."],["Human centered","Patient, family and clinician experience stays at the center of service and support design."],["Technology progress","From modern devices to digital infrastructure, technology is used to improve the quality of care."]]};
  const tr = {title:"Solunum bakımında öncü. Sağlık hizmetlerinde mükemmellik.",body:"Hyper Doctor, uzman medikal cihaz deneyimini güvenilir solunum ve bakım hizmetleriyle; hassasiyet, hızlı yanıt ve gerçek destek odağında birleştirir.",cta:"Misyonumuzu keşfedin",values:"Temel değerlerimiz",valuesSub:"Hassas mühendislik ve insan odaklı tasarım, uzman bakımın geleceğini şekillendirir.",cards:[["Klinik hassasiyet","Her cihaz ve tanı aracı, titiz standartlar ve gerçek bakım ihtiyaçları temel alınarak seçilir ve sunulur."],["İnsan odaklı yaklaşım","Hasta, aile ve klinisyen deneyimi; hizmet ve destek tasarımının merkezinde yer alır."],["Teknolojik ilerleme","Modern cihazlardan dijital altyapıya kadar teknoloji, bakım kalitesini artırmak için kullanılır."]]};
  const ar = {title:"ريادة في رعاية الجهاز التنفسي. تميز في الخدمات الصحية.",body:"تجمع Hyper Doctor بين الخبرة المتخصصة في المعدات الطبية وخدمات التنفس والرعاية الموثوقة، مع التركيز على الدقة وسرعة الاستجابة والدعم الحقيقي.",cta:"اكتشف مهمتنا",values:"قيمنا الأساسية",valuesSub:"الهندسة الدقيقة والتصميم المتمحور حول الإنسان يقودان مستقبل الرعاية المتخصصة.",cards:[["الدقة السريرية","يتم اختيار كل جهاز وأداة تشخيصية وتقديمها وفق معايير دقيقة واحتياجات رعاية حقيقية."],["التركيز على الإنسان","تبقى تجربة المريض والأسرة والمتخصص في صميم تصميم الخدمات ومسارات الدعم."],["التقدم التقني","من الأجهزة الحديثة إلى البنية الرقمية، تُستخدم التقنية لتحسين جودة الرعاية."]]};
  const c = locale === "fa" ? fa : locale === "tr" ? tr : locale === "ar" ? ar : en;
  const icons = [Stethoscope, Heart, Microscope];

  return <main className="flex-1 bg-[#f3f6fa]">
    <section className="relative min-h-[590px] overflow-hidden bg-[#001736] text-white">
      <Image src={HERO_IMAGE} alt="Hyper Doctor respiratory care" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-[#001736]/72" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,23,54,.35),rgba(0,23,54,.78))] rtl:bg-[linear-gradient(270deg,rgba(0,23,54,.35),rgba(0,23,54,.78))]" />
      <Container className="relative z-10 flex min-h-[590px] items-center justify-center text-center">
        <div className="max-w-4xl py-16"><h1 className="text-4xl font-black leading-[1.45] drop-shadow-lg sm:text-6xl">{c.title}</h1><p className="mx-auto mt-6 max-w-3xl text-sm leading-8 text-white/78 sm:text-base">{c.body}</p><Link href="#values" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-white/35 bg-white/10 px-7 text-sm font-black text-white backdrop-blur hover:bg-white/15">{c.cta}</Link></div>
      </Container>
    </section>
    <section id="values" className="py-16 sm:py-20"><Container><div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-black text-[#001736] sm:text-4xl">{c.values}</h2><p className="mt-4 text-sm leading-7 text-[#5f6570]">{c.valuesSub}</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{c.cards.map(([title,body],index)=>{const Icon=icons[index];const dark=index===1;return <article key={title} className={`relative overflow-hidden rounded-3xl border p-7 shadow-[0_16px_45px_rgba(0,23,54,.06)] ${dark?"border-[#001736] bg-[#001736] text-white":"border-[#e0e5eb] bg-white text-[#001736]"}`}><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark?"bg-white/8 text-[#ff3971]":"bg-[#eef4fb] text-[#009dd8]"}`}><Icon className="h-6 w-6"/></span><h3 className="mt-7 text-xl font-black">{title}</h3><p className={`mt-4 text-sm leading-8 ${dark?"text-white/68":"text-[#5f6570]"}`}>{body}</p></article>})}</div></Container></section>
  </main>;
}
