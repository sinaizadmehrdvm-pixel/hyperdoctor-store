create or replace function public.admin_support_tickets(p_token text, p_search text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_admin jsonb; v_result jsonb;
begin
  v_admin:=public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  select coalesce(jsonb_agg(x order by x."createdAt" desc),'[]'::jsonb) into v_result
  from (
    select t.id,t."ticketNo",t.subject,t.category,t.status::text as status,t.priority::text as priority,
      t."guestName",t."guestPhone",t."guestEmail",t."deviceInfo",t.locale,t."createdAt",t."updatedAt",
      c."fullName" as "customerName",c.phone as "customerPhone",c.email as "customerEmail",
      coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'senderType',m."senderType",'senderName',m."senderName",'body',m.body,'attachmentUrl',m."attachmentUrl",'createdAt',m."createdAt") order by m."createdAt") from public."TicketMessage" m where m."ticketId"=t.id),'[]'::jsonb) as messages
    from public."SupportTicket" t
    left join public."Customer" c on c.id=t."customerId"
    where coalesce(p_search,'')=''
      or t."ticketNo" ilike '%'||p_search||'%'
      or t.subject ilike '%'||p_search||'%'
      or coalesce(t.category,'') ilike '%'||p_search||'%'
      or coalesce(t."guestName",'') ilike '%'||p_search||'%'
      or coalesce(t."guestPhone",'') ilike '%'||p_search||'%'
      or coalesce(t."guestEmail",'') ilike '%'||p_search||'%'
      or coalesce(c."fullName",'') ilike '%'||p_search||'%'
      or coalesce(c.phone,'') ilike '%'||p_search||'%'
      or coalesce(c.email,'') ilike '%'||p_search||'%'
  ) x;
  return v_result;
end $function$;
