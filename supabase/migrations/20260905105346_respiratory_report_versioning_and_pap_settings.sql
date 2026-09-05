alter table public."RespiratoryServiceReport"
  add column if not exists "therapyMode" text not null default 'NONE',
  add column if not exists "pressureMin" numeric(6,2),
  add column if not exists "pressureMax" numeric(6,2),
  add column if not exists "pressureSupport" numeric(6,2),
  add column if not exists "backupRateBpm" integer,
  add column if not exists "rampMinutes" integer,
  add column if not exists "humidifierLevel" integer,
  add column if not exists "oxygenFlowLpm" numeric(6,2),
  add column if not exists "residualAhi" numeric(7,2),
  add column if not exists "currentVersion" integer not null default 0;

alter table public."RespiratoryServiceReport" drop constraint if exists "RespiratoryServiceReport_therapyMode_check";
alter table public."RespiratoryServiceReport" add constraint "RespiratoryServiceReport_therapyMode_check" check ("therapyMode" in ('NONE','CPAP','APAP','BIPAP_S','BIPAP_ST'));
alter table public."RespiratoryServiceReport" drop constraint if exists "RespiratoryServiceReport_currentVersion_check";
alter table public."RespiratoryServiceReport" add constraint "RespiratoryServiceReport_currentVersion_check" check ("currentVersion" >= 0);

create table if not exists public."RespiratoryServiceReportVersion" (
  id uuid primary key default gen_random_uuid(),
  "reportId" uuid not null references public."RespiratoryServiceReport"(id) on delete cascade,
  "bookingId" uuid not null references public."ServiceBooking"(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null check (status in ('DRAFT','FINAL')),
  snapshot jsonb not null,
  "createdBy" text references public."AdminUser"(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  unique("reportId", version)
);
create index if not exists "RespiratoryServiceReportVersion_bookingId_idx" on public."RespiratoryServiceReportVersion"("bookingId", version desc);
alter table public."RespiratoryServiceReportVersion" enable row level security;
revoke all on public."RespiratoryServiceReportVersion" from public, anon, authenticated;

create or replace function public.admin_respiratory_report_detail_v2(p_token text,p_booking_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype;v_booking jsonb;v_report jsonb;v_versions jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole") then raise exception 'forbidden'; end if;
 select to_jsonb(b) into v_booking from public."ServiceBooking" b where b.id=p_booking_id::uuid;
 if v_booking is null then return null; end if;
 select to_jsonb(r) into v_report from public."RespiratoryServiceReport" r where r."bookingId"=p_booking_id::uuid;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'version',v.version,'status',v.status,'createdAt',v."createdAt",'createdBy',v."createdBy",'snapshot',v.snapshot) order by v.version desc),'[]'::jsonb) into v_versions from public."RespiratoryServiceReportVersion" v where v."bookingId"=p_booking_id::uuid;
 return jsonb_build_object('booking',v_booking,'report',v_report,'versions',v_versions);
end $$;

create or replace function public.admin_upsert_respiratory_report_v2(
 p_token text,p_booking_id text,p_report_type text,p_study_date date,p_height_cm numeric,p_weight_kg numeric,
 p_ahi numeric,p_odi numeric,p_avg_spo2 numeric,p_min_spo2 numeric,p_t90_minutes numeric,p_total_recording_minutes numeric,
 p_cpap_pressure numeric,p_ipap numeric,p_epap numeric,p_leak_lpm numeric,p_mask_type text,p_device_model text,p_device_serial text,
 p_findings text,p_recommendation text,p_technician_name text,p_physician_name text,p_status text,
 p_therapy_mode text default 'NONE',p_pressure_min numeric default null,p_pressure_max numeric default null,p_pressure_support numeric default null,
 p_backup_rate_bpm integer default null,p_ramp_minutes integer default null,p_humidifier_level integer default null,p_oxygen_flow_lpm numeric default null,p_residual_ahi numeric default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype;v_id uuid;v_bmi numeric(6,2);v_final timestamptz;v_next_version integer;v_snapshot jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole") then raise exception 'forbidden'; end if;
 if not exists(select 1 from public."ServiceBooking" where id=p_booking_id::uuid) then raise exception 'booking_not_found'; end if;
 if p_report_type not in ('SLEEP_TEST','TITRATION') then raise exception 'invalid_report_type'; end if;
 if p_status not in ('DRAFT','FINAL') then raise exception 'invalid_status'; end if;
 if coalesce(p_therapy_mode,'NONE') not in ('NONE','CPAP','APAP','BIPAP_S','BIPAP_ST') then raise exception 'invalid_therapy_mode'; end if;
 if p_avg_spo2 is not null and (p_avg_spo2<0 or p_avg_spo2>100) then raise exception 'invalid_avg_spo2'; end if;
 if p_min_spo2 is not null and (p_min_spo2<0 or p_min_spo2>100) then raise exception 'invalid_min_spo2'; end if;
 if p_ahi is not null and p_ahi<0 or p_odi is not null and p_odi<0 or p_residual_ahi is not null and p_residual_ahi<0 then raise exception 'invalid_index'; end if;
 if p_total_recording_minutes is not null and p_total_recording_minutes<0 or p_t90_minutes is not null and p_t90_minutes<0 then raise exception 'invalid_duration'; end if;
 if p_t90_minutes is not null and p_total_recording_minutes is not null and p_t90_minutes>p_total_recording_minutes then raise exception 't90_exceeds_recording'; end if;
 if p_pressure_min is not null and p_pressure_max is not null and p_pressure_min>p_pressure_max then raise exception 'invalid_pressure_range'; end if;
 if p_backup_rate_bpm is not null and (p_backup_rate_bpm<0 or p_backup_rate_bpm>80) then raise exception 'invalid_backup_rate'; end if;
 if p_ramp_minutes is not null and (p_ramp_minutes<0 or p_ramp_minutes>120) then raise exception 'invalid_ramp'; end if;
 if p_humidifier_level is not null and (p_humidifier_level<0 or p_humidifier_level>20) then raise exception 'invalid_humidifier'; end if;
 if p_height_cm is not null and p_height_cm>0 and p_weight_kg is not null and p_weight_kg>0 then v_bmi:=round(p_weight_kg/power(p_height_cm/100.0,2),2); end if;
 if p_status='FINAL' then v_final:=now(); end if;
 select r.id,r."currentVersion"+1 into v_id,v_next_version from public."RespiratoryServiceReport" r where r."bookingId"=p_booking_id::uuid for update;
 if not found then v_id:=gen_random_uuid();v_next_version:=1; end if;
 insert into public."RespiratoryServiceReport"(id,"bookingId","reportType","studyDate","heightCm","weightKg",bmi,ahi,odi,"avgSpo2","minSpo2","t90Minutes","totalRecordingMinutes","cpapPressure",ipap,epap,"leakLpm","maskType","deviceModel","deviceSerial",findings,recommendation,"technicianName","physicianName",status,"finalizedAt","therapyMode","pressureMin","pressureMax","pressureSupport","backupRateBpm","rampMinutes","humidifierLevel","oxygenFlowLpm","residualAhi","currentVersion","updatedAt") values(v_id,p_booking_id::uuid,p_report_type,p_study_date,p_height_cm,p_weight_kg,v_bmi,p_ahi,p_odi,p_avg_spo2,p_min_spo2,p_t90_minutes,p_total_recording_minutes,p_cpap_pressure,p_ipap,p_epap,p_leak_lpm,coalesce(p_mask_type,''),coalesce(p_device_model,''),coalesce(p_device_serial,''),coalesce(p_findings,''),coalesce(p_recommendation,''),coalesce(p_technician_name,''),coalesce(p_physician_name,''),p_status,v_final,coalesce(p_therapy_mode,'NONE'),p_pressure_min,p_pressure_max,p_pressure_support,p_backup_rate_bpm,p_ramp_minutes,p_humidifier_level,p_oxygen_flow_lpm,p_residual_ahi,v_next_version,now())
 on conflict("bookingId") do update set "reportType"=excluded."reportType","studyDate"=excluded."studyDate","heightCm"=excluded."heightCm","weightKg"=excluded."weightKg",bmi=excluded.bmi,ahi=excluded.ahi,odi=excluded.odi,"avgSpo2"=excluded."avgSpo2","minSpo2"=excluded."minSpo2","t90Minutes"=excluded."t90Minutes","totalRecordingMinutes"=excluded."totalRecordingMinutes","cpapPressure"=excluded."cpapPressure",ipap=excluded.ipap,epap=excluded.epap,"leakLpm"=excluded."leakLpm","maskType"=excluded."maskType","deviceModel"=excluded."deviceModel","deviceSerial"=excluded."deviceSerial",findings=excluded.findings,recommendation=excluded.recommendation,"technicianName"=excluded."technicianName","physicianName"=excluded."physicianName",status=excluded.status,"finalizedAt"=case when excluded.status='FINAL' then coalesce(public."RespiratoryServiceReport"."finalizedAt",now()) else null end,"therapyMode"=excluded."therapyMode","pressureMin"=excluded."pressureMin","pressureMax"=excluded."pressureMax","pressureSupport"=excluded."pressureSupport","backupRateBpm"=excluded."backupRateBpm","rampMinutes"=excluded."rampMinutes","humidifierLevel"=excluded."humidifierLevel","oxygenFlowLpm"=excluded."oxygenFlowLpm","residualAhi"=excluded."residualAhi","currentVersion"=excluded."currentVersion","updatedAt"=now();
 select to_jsonb(r) into v_snapshot from public."RespiratoryServiceReport" r where r.id=v_id;
 insert into public."RespiratoryServiceReportVersion"("reportId","bookingId",version,status,snapshot,"createdBy") values(v_id,p_booking_id::uuid,v_next_version,p_status,v_snapshot,v_admin.id);
 return jsonb_build_object('id',v_id,'bookingId',p_booking_id,'status',p_status,'version',v_next_version);
end $$;

revoke all on function public.admin_respiratory_report_detail_v2(text,text) from public;
revoke all on function public.admin_upsert_respiratory_report_v2(text,text,text,date,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text,text,text,numeric,numeric,numeric,integer,integer,integer,numeric,numeric) from public;
grant execute on function public.admin_respiratory_report_detail_v2(text,text) to anon,authenticated;
grant execute on function public.admin_upsert_respiratory_report_v2(text,text,text,date,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text,text,text,numeric,numeric,numeric,integer,integer,integer,numeric,numeric) to anon,authenticated;
