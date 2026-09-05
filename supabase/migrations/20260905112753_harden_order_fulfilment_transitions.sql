create or replace function public.admin_update_order_fulfilment(p_token text,p_id text,p_shipping_method text,p_tracking_code text,p_status text default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_current public."OrderStatus"; v_next public."OrderStatus"; v_method text; v_code text; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 v_method:=left(btrim(coalesce(p_shipping_method,'')),120); v_code:=left(btrim(coalesce(p_tracking_code,'')),120); select status into v_current from public."Order" where id=p_id for update; if not found then raise exception 'order not found'; end if;
 v_next:=case when nullif(btrim(coalesce(p_status,'')),'') is null then v_current else upper(btrim(p_status))::public."OrderStatus" end;
 if v_current='PAID'::public."OrderStatus" and v_next not in ('PAID'::public."OrderStatus",'PROCESSING'::public."OrderStatus") then raise exception 'invalid order transition'; end if;
 if v_current='PROCESSING'::public."OrderStatus" and v_next not in ('PROCESSING'::public."OrderStatus",'SHIPPED'::public."OrderStatus") then raise exception 'invalid order transition'; end if;
 if v_current='SHIPPED'::public."OrderStatus" and v_next not in ('SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") then raise exception 'invalid order transition'; end if;
 if v_current='COMPLETED'::public."OrderStatus" and v_next<>'COMPLETED'::public."OrderStatus" then raise exception 'invalid order transition'; end if;
 if v_current not in ('PAID'::public."OrderStatus",'PROCESSING'::public."OrderStatus",'SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") then raise exception 'order not fulfilment-ready'; end if;
 if v_next in ('SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") and v_method='' then raise exception 'shipping method required'; end if;
 update public."Order" set status=v_next,"shippingMethod"=v_method,"trackingCode"=v_code,"shippedAt"=case when v_next in ('SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") then coalesce("shippedAt",now()) else "shippedAt" end,"completedAt"=case when v_next='COMPLETED'::public."OrderStatus" then coalesce("completedAt",now()) else "completedAt" end,"updatedAt"=now() where id=p_id;
 select jsonb_build_object('id',id,'status',status::text,'shippingMethod',"shippingMethod",'trackingCode',"trackingCode",'shippedAt',"shippedAt",'completedAt',"completedAt") into v_result from public."Order" where id=p_id; return v_result;
end $$;
revoke all on function public.admin_update_order_fulfilment(text,text,text,text,text) from public; grant execute on function public.admin_update_order_fulfilment(text,text,text,text,text) to anon,authenticated;
