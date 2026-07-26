import { ServiceForm } from "@/components/admin/service-form";

export default function NewServicePage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">خدمت جدید</h1>
      <ServiceForm />
    </div>
  );
}
