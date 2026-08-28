CREATE OR REPLACE FUNCTION public.attach_order_payment_authority(p_order_number text,p_checkout_token uuid,p_authority text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
 if p_authority is null or char_length(trim(p_authority))<5 then return false; end if;
 update public."Order"
 set "paymentAuthority"=trim(p_authority),
     "reservationExpiresAt"=greatest("reservationExpiresAt",now()+interval '60 minutes'),
     "updatedAt"=now()
 where "orderNumber"=p_order_number and "checkoutToken"=p_checkout_token
   and status='PENDING_PAYMENT'::"OrderStatus"
   and "reservationExpiresAt">now()
   and ("paymentAuthority" is null or "paymentAuthority"=trim(p_authority));
 return found;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_result(p_order_number text,p_result_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_order public."Order"%rowtype;
BEGIN
 select * into v_order from public."Order" where "orderNumber"=p_order_number and "resultToken"=p_result_token limit 1;
 if not found then return null; end if;
 return jsonb_build_object(
  'orderNumber',v_order."orderNumber",'status',v_order.status::text,'total',v_order.total,'currency',v_order.currency,'locale',v_order.locale,'paymentRefId',v_order."paymentRefId",
  'reservationExpiresAt',v_order."reservationExpiresAt",
  'reservationExpired',(v_order.status='PENDING_PAYMENT'::"OrderStatus" and v_order."reservationExpiresAt" is not null and v_order."reservationExpiresAt"<=now())
 );
END;
$function$;
