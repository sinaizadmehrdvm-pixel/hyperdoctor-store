create table if not exists public."RespiratoryServiceReport" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null unique references public."ServiceBooking"(id) on delete cascade,
  "reportType" text not null check ("reportType" in ('SLEEP_TEST','TITRATION')),
  "studyDate" date,
  "heightCm" numeric(6,2), "weightKg" numeric(6,2), bmi numeric(6,2),
  ahi numeric(7,2), odi numeric(7,2), "avgSpo2" numeric(5,2), "minSpo2" numeric(5,2),
  "t90Minutes" numeric(8,2), "totalRecordingMinutes" numeric(8,2),
  "cpapPressure" numeric(6,2), ipap numeric(6,2), epap numeric(6,2), "leakLpm" numeric(7,2),
  "maskType" text not null default '', "deviceModel" text not null default '', "deviceSerial" text not null default '',
  findings text not null default '', recommendation text not null default '', "technicianName" text not null default '', "physicianName" text not null default '',
  status text not null default 'DRAFT' check (status in ('DRAFT','FINAL')), "finalizedAt" timestamptz,
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create index if not exists "RespiratoryServiceReport_reportType_idx" on public."RespiratoryServiceReport"("reportType");
alter table public."RespiratoryServiceReport" enable row level security;
revoke all on table public."RespiratoryServiceReport" from anon, authenticated;

create or replace function public.admin_respiratory_report_detail(p_token text,p_booking_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_booking jsonb; v_report jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole") then raise exception 'forbidden'; end if;
 select to_jsonb(b) into v_booking from public."ServiceBooking" b where b.id=p_booking_id::uuid;
 if v_booking is null then return null; end if;
 select to_jsonb(r) into v_report from public."RespiratoryServiceReport" r where r."bookingId"=p_booking_id::uuid;
 return jsonb_build_object('booking',v_booking,'report',v_report);
end $$;
revoke all on function public.admin_respiratory_report_detail(text,text) from public;
grant execute on function public.admin_respiratory_report_detail(text,text) to anon,authenticated;

create or replace function public.admin_upsert_respiratory_report(
 p_token text,p_booking_id text,p_report_type text,p_study_date date,p_height_cm numeric,p_weight_kg numeric,p_ahi numeric,p_odi numeric,
 p_avg_spo2 numeric,p_min_spo2 numeric,p_t90_minutes numeric,p_total_recording_minutes numeric,p_cpap_pressure numeric,p_ipap numeric,p_epap numeric,p_leak_lpm numeric,
 p_mask_type text,p_device_model text,p_device_serial text,p_findings text,p_recommendation text,p_technician_name text,p_physician_name text,p_status text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_id uuid; v_bmi numeric(6,2); v_final timestamptz;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole") then raise exception 'forbidden'; end if;
 if not exists(select 1 from public."ServiceBooking" where id=p_booking_id::uuid) then raise exception 'booking_not_found'; end if;
 if p_report_type not in ('SLEEP_TEST','TITRATION') then raise exception 'invalid_report_type'; end if;
 if p_status not in ('DRAFT','FINAL') then raise exception 'invalid_status'; end if;
 if p_avg_spo2 is not null and (p_avg_spo2<0 or p_avg_spo2>100) then raise exception 'invalid_avg_spo2'; end if;
 if p_min_spo2 is not null and (p_min_spo2<0 or p_min_spo2>100) then raise exception 'invalid_min_spo2'; end if;
 if p_height_cm is not null and p_height_cm>0 and p_weight_kg is not null and p_weight_kg>0 then v_bmi:=round(p_weight_kg/power(p_height_cm/100.0,2),2); end if;
 if p_status='FINAL' then v_final:=now(); end if;
 insert into public."RespiratoryServiceReport"("bookingId","reportType","studyDate","heightCm","weightKg",bmi,ahi,odi,"avgSpo2","minSpo2","t90Minutes","totalRecordingMinutes","cpapPressure",ipap,epap,"leakLpm","maskType","deviceModel","deviceSerial",findings,recommendation,"technicianName","physicianName",status,"finalizedAt","updatedAt")
 values(p_booking_id::uuid,p_report_type,p_study_date,p_height_cm,p_weight_kg,v_bmi,p_ahi,p_odi,p_avg_spo2,p_min_spo2,p_t90_minutes,p_total_recording_minutes,p_cpap_pressure,p_ipap,p_epap,p_leak_lpm,coalesce(p_mask_type,''),coalesce(p_device_model,''),coalesce(p_device_serial,''),coalesce(p_findings,''),coalesce(p_recommendation,''),coalesce(p_technician_name,''),coalesce(p_physician_name,''),p_status,v_final,now())
 on conflict("bookingId") do update set "reportType"=excluded."reportType","studyDate"=excluded."studyDate","heightCm"=excluded."heightCm","weightKg"=excluded."weightKg",bmi=excluded.bmi,ahi=excluded.ahi,odi=excluded.odi,"avgSpo2"=excluded."avgSpo2","minSpo2"=excluded."minSpo2","t90Minutes"=excluded."t90Minutes","totalRecordingMinutes"=excluded."totalRecordingMinutes","cpapPressure"=excluded."cpapPressure",ipap=excluded.ipap,epap=excluded.epap,"leakLpm"=excluded."leakLpm","maskType"=excluded."maskType","deviceModel"=excluded."deviceModel","deviceSerial"=excluded."deviceSerial",findings=excluded.findings,recommendation=excluded.recommendation,"technicianName"=excluded."technicianName","physicianName"=excluded."physicianName",status=excluded.status,"finalizedAt"=case when excluded.status='FINAL' then coalesce(public."RespiratoryServiceReport"."finalizedAt",now()) else null end,"updatedAt"=now()
 returning id into v_id;
 return jsonb_build_object('id',v_id,'bookingId',p_booking_id,'status',p_status);
end $$;
revoke all on function public.admin_upsert_respiratory_report(text,text,text,date,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text,text) from public;
grant execute on function public.admin_upsert_respiratory_report(text,text,text,date,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text,text) to anon,authenticated;
