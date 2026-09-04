create table if not exists public."ServiceExecutionReport" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null unique references public."ServiceBooking"(id) on delete cascade,
  "reportType" text not null default 'INSTALLATION' check ("reportType" in ('INSTALLATION','RENTAL_HANDOVER','MAINTENANCE')),
  "visitDate" date,
  "deviceModel" text,
  "deviceSerial" text,
  "accessories" text,
  "initialCondition" text,
  "workPerformed" text,
  "settingsApplied" text,
  "testResult" text,
  "customerInstructions" text,
  "technicianName" text,
  "customerRepresentative" text,
  "nextServiceDate" date,
  status text not null default 'DRAFT' check (status in ('DRAFT','FINAL')),
  "finalizedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
alter table public."ServiceExecutionReport" enable row level security;
revoke all on public."ServiceExecutionReport" from anon, authenticated;

create or replace function public.admin_service_execution_report_detail(p_token text,p_booking_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole") then raise exception 'forbidden'; end if;
 select jsonb_build_object('booking',to_jsonb(b),'report',to_jsonb(r)) into v_result
 from (select sb.*,s."nameFa" as "serviceNameFa",s."nameTr" as "serviceNameTr",s."nameEn" as "serviceNameEn",s."nameAr" as "serviceNameAr" from public."ServiceBooking" sb join public."Service" s on s.id=sb."serviceId" where sb.id=p_booking_id) b
 left join public."ServiceExecutionReport" r on r."bookingId"=b.id;
 return v_result;
end $$;
revoke all on function public.admin_service_execution_report_detail(text,uuid) from public;
grant execute on function public.admin_service_execution_report_detail(text,uuid) to anon,authenticated;

create or replace function public.admin_save_service_execution_report(p_token text,p_booking_id uuid,p_report_type text,p_visit_date date default null,p_device_model text default null,p_device_serial text default null,p_accessories text default null,p_initial_condition text default null,p_work_performed text default null,p_settings_applied text default null,p_test_result text default null,p_customer_instructions text default null,p_technician_name text default null,p_customer_representative text default null,p_next_service_date date default null,p_status text default 'DRAFT')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_id uuid;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole") then raise exception 'forbidden'; end if;
 if p_report_type not in ('INSTALLATION','RENTAL_HANDOVER','MAINTENANCE') or p_status not in ('DRAFT','FINAL') then raise exception 'invalid report state'; end if;
 insert into public."ServiceExecutionReport"("bookingId","reportType","visitDate","deviceModel","deviceSerial",accessories,"initialCondition","workPerformed","settingsApplied","testResult","customerInstructions","technicianName","customerRepresentative","nextServiceDate",status,"finalizedAt","updatedAt")
 values(p_booking_id,p_report_type,p_visit_date,nullif(trim(coalesce(p_device_model,'')),''),nullif(trim(coalesce(p_device_serial,'')),''),nullif(trim(coalesce(p_accessories,'')),''),nullif(trim(coalesce(p_initial_condition,'')),''),nullif(trim(coalesce(p_work_performed,'')),''),nullif(trim(coalesce(p_settings_applied,'')),''),nullif(trim(coalesce(p_test_result,'')),''),nullif(trim(coalesce(p_customer_instructions,'')),''),nullif(trim(coalesce(p_technician_name,'')),''),nullif(trim(coalesce(p_customer_representative,'')),''),p_next_service_date,p_status,case when p_status='FINAL' then now() else null end,now())
 on conflict("bookingId") do update set "reportType"=excluded."reportType","visitDate"=excluded."visitDate","deviceModel"=excluded."deviceModel","deviceSerial"=excluded."deviceSerial",accessories=excluded.accessories,"initialCondition"=excluded."initialCondition","workPerformed"=excluded."workPerformed","settingsApplied"=excluded."settingsApplied","testResult"=excluded."testResult","customerInstructions"=excluded."customerInstructions","technicianName"=excluded."technicianName","customerRepresentative"=excluded."customerRepresentative","nextServiceDate"=excluded."nextServiceDate",status=excluded.status,"finalizedAt"=case when excluded.status='FINAL' then coalesce(public."ServiceExecutionReport"."finalizedAt",now()) else null end,"updatedAt"=now()
 returning id into v_id;
 return v_id;
end $$;
revoke all on function public.admin_save_service_execution_report(text,uuid,text,date,text,text,text,text,text,text,text,text,text,text,date,text) from public;
grant execute on function public.admin_save_service_execution_report(text,uuid,text,date,text,text,text,text,text,text,text,text,text,text,date,text) to anon,authenticated;
