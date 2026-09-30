import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Optional admin provisioning ---
  // Never ship a default password. Provision explicitly from deployment secrets.
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if ((adminEmail && !adminPassword) || (!adminEmail && adminPassword)) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be provided together.");
  }
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: { passwordHash, name: process.env.ADMIN_NAME?.trim() || "مدیر سایت", role: "SUPER_ADMIN" },
      create: { email: adminEmail, passwordHash, name: process.env.ADMIN_NAME?.trim() || "مدیر سایت", role: "SUPER_ADMIN" },
    });
  }

  // --- Site settings ---
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {
      holdingName: "VITALIS Group", subBrandName: "Hyper Doctor",
      contactPhone: "04432257238", contactPhone2: "04432254578", respiratoryPhone: "09149483873",
      contactEmail: "hyperdoctor@gmail.com", address: "ارومیه خیام شمالی کوچه صناعی آذرسرا5 همکف",
      whatsappUrl: "https://wa.me/989149498352", defaultLocale: "fa",
    },
    create: {
      id: 1, holdingName: "VITALIS Group", subBrandName: "Hyper Doctor",
      contactPhone: "04432257238", contactPhone2: "04432254578", respiratoryPhone: "09149483873",
      contactEmail: "hyperdoctor@gmail.com", address: "ارومیه خیام شمالی کوچه صناعی آذرسرا5 همکف",
      whatsappUrl: "https://wa.me/989149498352", defaultLocale: "fa",
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

  // Product/service catalog is intentionally not seeded: only approved source data belongs in production.\n\n  // --- Pages ---
  const pagesData = [
    {
      slug: "about",
      titleFa: "درباره ما",
      titleEn: "About Us",
      contentFa:
        "<h2>درباره هایپر دکتر</h2><p>هایپر دکتر بخش پخش تجهیزات پزشکی زیرمجموعه هلدینگ VITALIS است که با هدف ارائه تجهیزات پزشکی اصل و خدمات تنفسی باکیفیت به بیماران و مراکز درمانی سراسر کشور فعالیت می‌کند.</p><p>هلدینگ VITALIS در حال گسترش فعالیت خود به حوزه‌های دندانپزشکی، دامپزشکی، داروخانه و خدمات پرستاری است.</p>",
      contentEn:
        "<h2>About Hyper Doctor</h2><p>Hyper Doctor is the medical equipment distribution arm of VITALIS Holding, providing genuine medical devices and high-quality respiratory services to patients and clinics nationwide.</p><p>VITALIS Holding is expanding into dental, veterinary, pharmacy, and nursing care services.</p>",
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

  // Migrate the core informational pages to the managed section renderer.
  const aboutPage = await prisma.page.findUniqueOrThrow({ where: { slug: "about" } });
  const contactPage = await prisma.page.findUniqueOrThrow({ where: { slug: "contact" } });
  const warrantyPage = await prisma.page.findUniqueOrThrow({ where: { slug: "warranty" } });

  const managedSections = [
    { page: aboutPage, type: "hero", titleFa: "درباره هایپر دکتر", titleEn: "About Hyper Doctor", bodyFa: "هایپر دکتر، بخش تجهیزات پزشکی VITALIS Group است.", bodyEn: "Hyper Doctor is the medical equipment division of VITALIS Group." },
    { page: aboutPage, type: "richText", titleFa: "فعالیت ما", titleEn: "What we do", bodyFa: "تأمین تجهیزات پزشکی و ارائه خدمات تخصصی تنفسی برای بیماران و مراکز درمانی.", bodyEn: "Medical equipment supply and specialist respiratory services for patients and healthcare centres." },
    { page: contactPage, type: "contact", titleFa: "تماس با هایپر دکتر", titleEn: "Contact Hyper Doctor", bodyFa: "برای مشاوره خرید تجهیزات پزشکی یا خدمات تنفسی با ما در ارتباط باشید.", bodyEn: "Contact us for medical equipment purchasing advice or respiratory services." },
    { page: warrantyPage, type: "richText", titleFa: "گارانتی و خدمات پس از فروش", titleEn: "Warranty & After-Sales Service", bodyFa: "شرایط گارانتی هر کالا باید مطابق اطلاعات تأییدشده همان محصول در صفحه محصول اعلام شود.", bodyEn: "Warranty terms must follow the approved information shown for each individual product." },
  ];

  for (const item of managedSections) {
    await prisma.page.update({ where: { id: item.page.id }, data: { template: "sections" } });
    const existing = await prisma.pageSection.findFirst({ where: { pageId: item.page.id, sortOrder: item.page.id === aboutPage.id && item.type === "richText" ? 1 : 0 } });
    const data = {
      pageId: item.page.id,
      type: item.type,
      sortOrder: item.page.id === aboutPage.id && item.type === "richText" ? 1 : 0,
      enabled: true,
      status: "PUBLISHED",
      titleFa: item.titleFa,
      titleEn: item.titleEn,
      bodyFa: item.bodyFa,
      bodyEn: item.bodyEn,
    };
    if (existing) await prisma.pageSection.update({ where: { id: existing.id }, data });
    else await prisma.pageSection.create({ data });
  }

  console.log("Seed complete.");
  console.log(adminEmail ? `Admin provisioned: ${adminEmail}` : "Admin provisioning skipped.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
