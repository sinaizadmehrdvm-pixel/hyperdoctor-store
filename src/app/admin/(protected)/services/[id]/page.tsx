import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/service-form";
import { adminRpc } from "@/lib/admin-data";

type ServiceDetail = {
  id: string;
  vertical: string;
  slug: string;
  nameFa: string;
  nameTr: string;
  nameEn: string;
  nameAr: string;
  descriptionFa: string;
  descriptionTr: string;
  descriptionEn: string;
  descriptionAr: string;
  image?: string | null;
  price?: number | null;
  priceIsFrom: boolean;
  durationMinutes?: number | null;
  requiresBooking: boolean;
  isPublished: boolean;
};

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await adminRpc<ServiceDetail | null>("admin_service_detail", { p_id: id });
  if (!service) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-black text-foreground">ویرایش خدمت</h1>
      <ServiceForm service={service} />
    </div>
  );
}
