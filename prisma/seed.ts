import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Admin user ---
  const passwordHash = await bcrypt.hash("HyperDoctor@2026", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@hyperdoctor.ir" },
    update: {},
    create: {
      email: "admin@hyperdoctor.ir",
      passwordHash,
      name: "مدیر سایت",
      role: "SUPER_ADMIN",
    },
  });

  // --- Site settings ---
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      holdingName: "Vetrix Holding",
      subBrandName: "Hyper Doctor",
      contactPhone: "+98 21 9100 0000",
      contactEmail: "info@hyperdoctor.ir",
      address: "تهران، خیابان ولیعصر، برج پزشکی وترکس، طبقه ۴",
      instagramUrl: "https://instagram.com/hyperdoctor",
      telegramUrl: "https://t.me/hyperdoctor",
      whatsappUrl: "https://wa.me/982191000000",
      defaultLocale: "fa",
    },
  });

  // --- Categories ---
  const categoriesData = [
    {
      vertical: "RESPIRATORY_SERVICES" as const,
      slug: "sleep-therapy",
      nameFa: "تجهیزات درمان خواب",
      nameEn: "Sleep Therapy Equipment",
      descriptionFa: "دستگاه‌های CPAP، BiPAP و ماسک‌های تنفسی برای درمان آپنه خواب",
      descriptionEn: "CPAP, BiPAP devices and respiratory masks for sleep apnea therapy",
      order: 1,
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      slug: "oxygen-therapy",
      nameFa: "تجهیزات اکسیژن‌درمانی",
      nameEn: "Oxygen Therapy Equipment",
      descriptionFa: "کنسانتره‌های اکسیژن ثابت و پرتابل برای منزل و سفر",
      descriptionEn: "Stationary and portable oxygen concentrators for home and travel",
      order: 2,
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      slug: "patient-monitoring",
      nameFa: "پایش علائم حیاتی",
      nameEn: "Patient Monitoring",
      descriptionFa: "پالس اکسیمتر، فشارسنج و دستگاه‌های پایش خانگی",
      descriptionEn: "Pulse oximeters, blood pressure monitors and home monitoring devices",
      order: 3,
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      slug: "mobility-aids",
      nameFa: "لوازم توان‌بخشی",
      nameEn: "Mobility & Rehab Aids",
      descriptionFa: "ویلچر، واکر و تجهیزات کمک‌حرکتی",
      descriptionEn: "Wheelchairs, walkers and mobility rehabilitation aids",
      order: 4,
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    categories[c.slug] = cat.id;
  }

  // --- Products ---
  const productsData = [
    {
      vertical: "RESPIRATORY_SERVICES" as const,
      categorySlug: "sleep-therapy",
      slug: "resmed-airsense-11",
      nameFa: "دستگاه CPAP رزمد AirSense 11",
      nameEn: "ResMed AirSense 11 CPAP Machine",
      descriptionFa:
        "دستگاه CPAP هوشمند با رطوبت‌ساز داخلی و اتصال اپلیکیشن موبایل برای پایش کیفیت خواب. مناسب درمان آپنه انسدادی خواب.",
      descriptionEn:
        "Smart CPAP machine with built-in humidifier and mobile app connectivity for sleep quality tracking. Suitable for obstructive sleep apnea therapy.",
      brand: "ResMed",
      sku: "RM-AS11-001",
      price: 48500000,
      compareAtPrice: 52000000,
      stock: 12,
      isFeatured: true,
      specs: {
        "وزن": { fa: "۸۳۰ گرم", en: "830 g" },
        "رطوبت‌ساز": { fa: "دارد (داخلی)", en: "Built-in" },
        "گارانتی": { fa: "۲۴ ماه", en: "24 months" },
      },
    },
    {
      vertical: "RESPIRATORY_SERVICES" as const,
      categorySlug: "sleep-therapy",
      slug: "philips-dreamwear-mask",
      nameFa: "ماسک بینی DreamWear فیلیپس",
      nameEn: "Philips DreamWear Nasal Mask",
      descriptionFa: "ماسک سبک و بدون فشار روی صورت با قاب زیر بینی، مناسب خواب در هر وضعیتی.",
      descriptionEn: "Lightweight, minimal-contact nasal mask with under-the-nose frame, comfortable in any sleep position.",
      brand: "Philips Respironics",
      sku: "PH-DW-002",
      price: 6200000,
      compareAtPrice: null,
      stock: 34,
      isFeatured: false,
      specs: {
        "سایز": { fa: "S / M / L", en: "S / M / L" },
        "جنس": { fa: "سیلیکون پزشکی", en: "Medical-grade silicone" },
      },
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      categorySlug: "oxygen-therapy",
      slug: "philips-everflo-concentrator",
      nameFa: "کنسانتره اکسیژن ثابت EverFlo",
      nameEn: "Philips EverFlo Stationary Oxygen Concentrator",
      descriptionFa: "کنسانتره اکسیژن خانگی با صدای کم و مصرف انرژی بهینه، جریان تا ۵ لیتر در دقیقه.",
      descriptionEn: "Home oxygen concentrator with low noise and optimized power consumption, flow up to 5 L/min.",
      brand: "Philips Respironics",
      sku: "PH-EF-003",
      price: 62000000,
      compareAtPrice: null,
      stock: 8,
      isFeatured: true,
      specs: {
        "حداکثر جریان": { fa: "۵ لیتر در دقیقه", en: "5 L/min" },
        "سطح صدا": { fa: "۴۰ دسی‌بل", en: "40 dB" },
        "گارانتی": { fa: "۳۶ ماه", en: "36 months" },
      },
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      categorySlug: "oxygen-therapy",
      slug: "inogen-one-g5",
      nameFa: "کنسانتره اکسیژن پرتابل Inogen One G5",
      nameEn: "Inogen One G5 Portable Oxygen Concentrator",
      descriptionFa: "کوچک‌ترین و سبک‌ترین کنسانتره پرتابل، مناسب سفر و فعالیت روزمره با باتری قابل تعویض.",
      descriptionEn: "The smallest and lightest portable concentrator, ideal for travel and daily activity with a swappable battery.",
      brand: "Inogen",
      sku: "IN-G5-004",
      price: 118000000,
      compareAtPrice: 125000000,
      stock: 4,
      isFeatured: true,
      specs: {
        "وزن": { fa: "۲ کیلوگرم", en: "2 kg" },
        "زمان کارکرد باتری": { fa: "تا ۶.۵ ساعت", en: "Up to 6.5 hours" },
      },
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      categorySlug: "patient-monitoring",
      slug: "masimo-pulse-oximeter",
      nameFa: "پالس اکسیمتر انگشتی Masimo",
      nameEn: "Masimo Fingertip Pulse Oximeter",
      descriptionFa: "اندازه‌گیری دقیق اشباع اکسیژن خون (SpO2) و ضربان قلب با صفحه نمایش OLED.",
      descriptionEn: "Accurate blood oxygen saturation (SpO2) and heart rate measurement with an OLED display.",
      brand: "Masimo",
      sku: "MS-PO-005",
      price: 3800000,
      compareAtPrice: null,
      stock: 46,
      isFeatured: false,
      specs: {
        "دقت SpO2": { fa: "±2%", en: "±2%" },
        "باتری": { fa: "۲ عدد AAA", en: "2× AAA" },
      },
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      categorySlug: "mobility-aids",
      slug: "lightweight-wheelchair",
      nameFa: "ویلچر سبک تاشو",
      nameEn: "Lightweight Folding Wheelchair",
      descriptionFa: "ویلچر آلومینیومی سبک با قابلیت تاشدن سریع، مناسب استفاده روزمره و سفر.",
      descriptionEn: "Lightweight aluminum wheelchair with quick-fold design, suitable for daily use and travel.",
      brand: "Hyper Doctor",
      sku: "HD-WC-006",
      price: 15500000,
      compareAtPrice: null,
      stock: 0,
      isFeatured: false,
      specs: {
        "وزن": { fa: "۱۲ کیلوگرم", en: "12 kg" },
        "حداکثر وزن کاربر": { fa: "۱۲۰ کیلوگرم", en: "120 kg" },
      },
    },
  ];

  for (const p of productsData) {
    const { categorySlug, specs, ...rest } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...rest, categoryId: categories[categorySlug], specs: JSON.stringify(specs), isPublished: true },
      create: { ...rest, categoryId: categories[categorySlug], specs: JSON.stringify(specs), isPublished: true },
    });
  }

  // --- Services ---
  const servicesData = [
    {
      vertical: "RESPIRATORY_SERVICES" as const,
      slug: "home-sleep-test",
      nameFa: "تست خواب در منزل (Sleep Test)",
      nameEn: "At-Home Sleep Test",
      descriptionFa:
        "کارشناس هایپر دکتر با دستگاه استاندارد پلی‌سومنوگرافی به محل شما مراجعه کرده، کیفیت خواب و علائم آپنه را طی یک شب بررسی می‌کند. نتیجه همراه با گزارش پزشکی ظرف ۴۸ ساعت تحویل داده می‌شود.",
      descriptionEn:
        "A Hyper Doctor specialist visits your home with standardized polysomnography equipment to evaluate sleep quality and apnea symptoms overnight. Results with a medical report are delivered within 48 hours.",
      price: 3500000,
      priceIsFrom: true,
      durationMinutes: 480,
      requiresBooking: true,
    },
    {
      vertical: "RESPIRATORY_SERVICES" as const,
      slug: "cpap-setup-consultation",
      nameFa: "مشاوره و راه‌اندازی دستگاه CPAP",
      nameEn: "CPAP Setup & Consultation",
      descriptionFa:
        "آموزش حضوری نحوه استفاده صحیح از دستگاه CPAP، تنظیم فشار مناسب و انتخاب ماسک متناسب با چهره شما.",
      descriptionEn:
        "In-person training on correct CPAP usage, pressure adjustment, and mask fitting tailored to your face.",
      price: 1200000,
      priceIsFrom: false,
      durationMinutes: 60,
      requiresBooking: true,
    },
    {
      vertical: "RESPIRATORY_SERVICES" as const,
      slug: "home-oxygen-therapy-setup",
      nameFa: "نصب و راه‌اندازی اکسیژن‌درمانی در منزل",
      nameEn: "Home Oxygen Therapy Setup",
      descriptionFa: "نصب کنسانتره اکسیژن در منزل، آموزش خانواده و برنامه‌ریزی سرویس دوره‌ای دستگاه.",
      descriptionEn: "Home installation of an oxygen concentrator, family training, and scheduled maintenance planning.",
      price: 2000000,
      priceIsFrom: true,
      durationMinutes: 90,
      requiresBooking: true,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { ...s, isPublished: true },
      create: { ...s, isPublished: true },
    });
  }

  // --- Pages ---
  const pagesData = [
    {
      slug: "about",
      titleFa: "درباره ما",
      titleEn: "About Us",
      contentFa:
        "<h2>درباره هایپر دکتر</h2><p>هایپر دکتر بخش پخش تجهیزات پزشکی زیرمجموعه هلدینگ ورتریکس است که با هدف ارائه تجهیزات پزشکی اصل و خدمات تنفسی باکیفیت به بیماران و مراکز درمانی سراسر کشور فعالیت می‌کند.</p><p>هلدینگ ورتریکس در حال گسترش فعالیت خود به حوزه‌های دندانپزشکی، دامپزشکی، داروخانه و خدمات پرستاری است.</p>",
      contentEn:
        "<h2>About Hyper Doctor</h2><p>Hyper Doctor is the medical equipment distribution arm of Vetrix Holding, providing genuine medical devices and high-quality respiratory services to patients and clinics nationwide.</p><p>Vetrix Holding is expanding into dental, veterinary, pharmacy, and nursing care services.</p>",
      showInNav: true,
      navOrder: 1,
    },
    {
      slug: "contact",
      titleFa: "تماس با ما",
      titleEn: "Contact Us",
      contentFa:
        "<h2>راه‌های ارتباطی</h2><p>برای مشاوره خرید تجهیزات پزشکی یا رزرو خدمات تنفسی، از طریق شماره تماس یا ایمیل درج‌شده در پایین سایت با ما در ارتباط باشید.</p>",
      contentEn:
        "<h2>Get in Touch</h2><p>For medical equipment purchasing advice or to book respiratory services, reach us via the phone number or email listed in the site footer.</p>",
      showInNav: true,
      navOrder: 2,
    },
    {
      slug: "warranty",
      titleFa: "گارانتی و خدمات پس از فروش",
      titleEn: "Warranty & After-Sales Service",
      contentFa:
        "<h2>گارانتی محصولات</h2><p>تمامی محصولات هایپر دکتر دارای گارانتی اصالت و سلامت فیزیکی کالا هستند. مدت گارانتی هر محصول در صفحه اختصاصی آن درج شده است.</p>",
      contentEn:
        "<h2>Product Warranty</h2><p>All Hyper Doctor products come with a warranty covering authenticity and physical condition. Warranty duration is listed on each product's page.</p>",
      showInNav: true,
      navOrder: 3,
    },
  ];

  for (const p of pagesData) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: { ...p, isPublished: true },
      create: { ...p, isPublished: true },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@hyperdoctor.ir / HyperDoctor@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
