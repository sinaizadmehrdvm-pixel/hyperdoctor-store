import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "مدیر سایت";

  if (!email || !password) {
    console.log("Admin seed skipped: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD when you intentionally want to create/update an admin.");
    return;
  }
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name, role: "SUPER_ADMIN", isActive: true },
    create: { email, passwordHash, name, role: "SUPER_ADMIN", isActive: true },
  });
}

async function main() {
  await seedAdmin();

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: { holdingName: "VITALIS Group", subBrandName: "Hyper Doctor" },
    create: {
      id: 1,
      holdingName: "VITALIS Group",
      subBrandName: "Hyper Doctor",
      defaultLocale: "fa",
      supportedLocales: "fa,tr,en,ar",
    },
  });

  const categoriesData = [
    {
      vertical: "RESPIRATORY_SERVICES" as const,
      slug: "sleep-therapy",
      nameFa: "تجهیزات درمان خواب",
      nameTr: "Uyku Tedavisi Ekipmanları",
      nameEn: "Sleep Therapy Equipment",
      nameAr: "معدات علاج النوم",
      descriptionFa: "دستگاه‌های CPAP، BiPAP و ماسک‌های تنفسی برای درمان آپنه خواب",
      descriptionEn: "CPAP, BiPAP devices and respiratory masks for sleep apnea therapy",
      order: 1,
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      slug: "oxygen-therapy",
      nameFa: "تجهیزات اکسیژن‌درمانی",
      nameTr: "Oksijen Tedavisi Ekipmanları",
      nameEn: "Oxygen Therapy Equipment",
      nameAr: "معدات العلاج بالأكسجين",
      descriptionFa: "کنسانتره‌های اکسیژن ثابت و پرتابل برای منزل و سفر",
      descriptionEn: "Stationary and portable oxygen concentrators for home and travel",
      order: 2,
    },
    {
      vertical: "MEDICAL_EQUIPMENT" as const,
      slug: "patient-monitoring",
      nameFa: "پایش بیمار",
      nameTr: "Hasta İzleme",
      nameEn: "Patient Monitoring",
      nameAr: "مراقبة المريض",
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

  console.log("Seed complete. No sample products are created in production seed.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
