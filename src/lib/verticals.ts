import type { AdminLocale } from "@/lib/admin-i18n";

export const VERTICAL_OPTIONS = [
  { value: "MEDICAL_EQUIPMENT", label: "تجهیزات پزشکی", labels: { fa: "تجهیزات پزشکی", tr: "Tıbbi cihazlar", en: "Medical equipment", ar: "المعدات الطبية" } },
  { value: "RESPIRATORY_SERVICES", label: "خدمات تنفسی", labels: { fa: "خدمات تنفسی", tr: "Solunum hizmetleri", en: "Respiratory services", ar: "خدمات التنفس" } },
  { value: "DENTAL", label: "دندانپزشکی (آینده)", labels: { fa: "دندانپزشکی (آینده)", tr: "Diş hekimliği (gelecek)", en: "Dental (future)", ar: "طب الأسنان (مستقبلاً)" } },
  { value: "VETERINARY", label: "دامپزشکی (آینده)", labels: { fa: "دامپزشکی (آینده)", tr: "Veterinerlik (gelecek)", en: "Veterinary (future)", ar: "الطب البيطري (مستقبلاً)" } },
  { value: "PHARMACY", label: "داروخانه (آینده)", labels: { fa: "داروخانه (آینده)", tr: "Eczane (gelecek)", en: "Pharmacy (future)", ar: "الصيدلية (مستقبلاً)" } },
  { value: "NURSING", label: "پرستاری (آینده)", labels: { fa: "پرستاری (آینده)", tr: "Hemşirelik (gelecek)", en: "Nursing (future)", ar: "التمريض (مستقبلاً)" } },
] as const;

export function verticalLabel(value: string, locale: AdminLocale) {
  const item = VERTICAL_OPTIONS.find((option) => option.value === value);
  return item?.labels[locale] ?? value;
}

export function verticalOptions(locale: AdminLocale) {
  return VERTICAL_OPTIONS.map((option) => ({ value: option.value, label: option.labels[locale] }));
}
