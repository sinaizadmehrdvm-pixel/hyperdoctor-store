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
    update: {
      holdingName: "VITALIS Group",
    },
    create: {
      id: 1,
      holdingName: "VITALIS Group",
      subBrandName: "Hyper Doctor",
      contactPhone: "+98 21 9100 0000",
      contactEmail: "info@hyperdoctor.ir",
      address: "تهران",
      instagramUrl: "https://instagram.com/hyperdoctor",
      telegramUrl: "https://t.me/hyperdoctor",
      whatsappUrl: "",
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
      nameFa: "پایش بیمار",
      nameEn: "Patient Monitoring",
      descriptionFa: "پالس‌اکسی‌متر، فشارسنج و تجهیزات پایش علائم حیاتی",
      descriptionEn: "Pulse oximeters, blood pressure monitors and vital-sign monitoring equipment",
      order: 3,
    },
  ];

  for (const category of categoriesData) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const sleepCategory = await prisma.category.findUniqueOrThrow({ where: { slug: "sleep-therapy" } });
  const oxygenCategory = await prisma.category.findUniqueOrThrow({ where: { slug: "oxygen-therapy" } });

  // --- Sample products ---
  const products = [
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      categoryId: sleepCategory.id,
      slug: "cpap-auto",
      nameFa: "دستگاه اتو CPAP",
      nameEn: "Auto CPAP Device",
      descriptionFa: "دستگاه اتو CPAP برای درمان آپنه انسدادی خواب با تنظیم خودکار فشار.",
      descriptionEn: "Auto CPAP device for obstructive sleep apnea with automatic pressure adjustment.",
      brand: "Hyper Doctor",
      sku: "HD-CPAP-001",
      price: 35000000,
      compareAtPrice: 39000000,
      stock: 10,
      specs: JSON.stringify({ pressure: { fa: "۴ تا ۲۰ cmH2O", en: "4-20 cmH2O" } }),
      isPublished: true,
      isFeatured: true,
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      categoryId: oxygenCategory.id,
      slug: "oxygen-concentrator-5l",
      nameFa: "اکسیژن‌ساز ۵ لیتری",
      nameEn: "5L Oxygen Concentrator",
      descriptionFa: "اکسیژن‌ساز خانگی ۵ لیتری مناسب استفاده مداوم.",
      descriptionEn: "5-liter home oxygen concentrator suitable for continuous use.",
      brand: "Hyper Doctor",
      sku: "HD-OXY-005",
      price: 28000000,
      compareAtPrice: null,
      stock: 7,
      specs: JSON.stringify({ flow: { fa: "۰.۵ تا ۵ لیتر در دقیقه", en: "0.5-5 L/min" } }),
      isPublished: true,
      isFeatured: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({ where: { sku: product.sku }, update: product, create: product });
  }

  // --- Sample service ---
  await prisma.service.upsert({
    where: { slug: "home-sleep-test" },
    update: {},
    create: {
      vertical: "RESPIRATORY_SERVICES",
      slug: "home-sleep-test",
      nameFa: "تست خواب در منزل",
      nameEn: "At-Home Sleep Test",
      descriptionFa: "انجام تست خواب در منزل با تجهیزات استاندارد و تحویل گزارش.",
      descriptionEn: "At-home sleep testing with standardized equipment and report delivery.",
      price: 2500000,
      priceIsFrom: true,
      durationMinutes: 480,
      requiresBooking: true,
      isPublished: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
