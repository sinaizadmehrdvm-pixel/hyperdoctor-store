"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const n=(v:FormDataEntryValue|null)=>{const s=String(v??"").trim();if(!s)return null;const x=Number(s);return Number.isFinite(x)?x:null};
const i=(v:FormDataEntryValue|null)=>{const x=n(v);return x==null?null:Math.trunc(x)};
const s=(f:FormData,k:string)=>String(f.get(k)||"").trim();
export async function saveRespiratoryReport(bookingId:string,formData:FormData){
 const reportType=s(formData,"reportType")||"SLEEP_TEST",status=s(formData,"status")||"DRAFT",therapyMode=s(formData,"therapyMode")||"NONE";
 if(!["SLEEP_TEST","TITRATION"].includes(reportType)||!["DRAFT","FINAL"].includes(status)||!["NONE","CPAP","APAP","BIPAP_S","BIPAP_ST"].includes(therapyMode))return;
 await adminRpc("admin_upsert_respiratory_report_v2",{p_booking_id:bookingId,p_report_type:reportType,p_study_date:s(formData,"studyDate")||null,p_height_cm:n(formData.get("heightCm")),p_weight_kg:n(formData.get("weightKg")),p_ahi:n(formData.get("ahi")),p_odi:n(formData.get("odi")),p_avg_spo2:n(formData.get("avgSpo2")),p_min_spo2:n(formData.get("minSpo2")),p_t90_minutes:n(formData.get("t90Minutes")),p_total_recording_minutes:n(formData.get("totalRecordingMinutes")),p_cpap_pressure:n(formData.get("cpapPressure")),p_ipap:n(formData.get("ipap")),p_epap:n(formData.get("epap")),p_leak_lpm:n(formData.get("leakLpm")),p_mask_type:s(formData,"maskType"),p_device_model:s(formData,"deviceModel"),p_device_serial:s(formData,"deviceSerial"),p_findings:s(formData,"findings"),p_recommendation:s(formData,"recommendation"),p_technician_name:s(formData,"technicianName"),p_physician_name:s(formData,"physicianName"),p_status:status,p_therapy_mode:therapyMode,p_pressure_min:n(formData.get("pressureMin")),p_pressure_max:n(formData.get("pressureMax")),p_pressure_support:n(formData.get("pressureSupport")),p_backup_rate_bpm:i(formData.get("backupRateBpm")),p_ramp_minutes:i(formData.get("rampMinutes")),p_humidifier_level:i(formData.get("humidifierLevel")),p_oxygen_flow_lpm:n(formData.get("oxygenFlowLpm")),p_residual_ahi:n(formData.get("residualAhi"))});
 revalidatePath(`/admin/bookings/${bookingId}/respiratory-report`);revalidatePath(`/admin/bookings/${bookingId}`);
}
