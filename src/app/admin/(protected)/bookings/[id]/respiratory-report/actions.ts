"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const n=(v:FormDataEntryValue|null)=>{const s=String(v??"").trim();if(!s)return null;const x=Number(s);return Number.isFinite(x)?x:null};
export async function saveRespiratoryReport(bookingId:string,formData:FormData){
 const reportType=String(formData.get("reportType")||"SLEEP_TEST");const status=String(formData.get("status")||"DRAFT");
 if(!["SLEEP_TEST","TITRATION"].includes(reportType)||!["DRAFT","FINAL"].includes(status))return;
 await adminRpc("admin_upsert_respiratory_report",{p_booking_id:bookingId,p_report_type:reportType,p_study_date:String(formData.get("studyDate")||"")||null,p_height_cm:n(formData.get("heightCm")),p_weight_kg:n(formData.get("weightKg")),p_ahi:n(formData.get("ahi")),p_odi:n(formData.get("odi")),p_avg_spo2:n(formData.get("avgSpo2")),p_min_spo2:n(formData.get("minSpo2")),p_t90_minutes:n(formData.get("t90Minutes")),p_total_recording_minutes:n(formData.get("totalRecordingMinutes")),p_cpap_pressure:n(formData.get("cpapPressure")),p_ipap:n(formData.get("ipap")),p_epap:n(formData.get("epap")),p_leak_lpm:n(formData.get("leakLpm")),p_mask_type:String(formData.get("maskType")||""),p_device_model:String(formData.get("deviceModel")||""),p_device_serial:String(formData.get("deviceSerial")||""),p_findings:String(formData.get("findings")||""),p_recommendation:String(formData.get("recommendation")||""),p_technician_name:String(formData.get("technicianName")||""),p_physician_name:String(formData.get("physicianName")||""),p_status:status});
 revalidatePath(`/admin/bookings/${bookingId}/respiratory-report`);revalidatePath(`/admin/bookings/${bookingId}`);
}
