create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated, service_role;

create or replace function app_private.storage_upload_grant_valid(p_name text, p_bucket text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists(
    select 1
    from public."StorageUploadGrant" g
    where g.bucket = p_bucket
      and g."tokenHash" = encode(digest(split_part(p_name, '/', 2), 'sha256'), 'hex')
      and g."consumedAt" is null
      and g."expiresAt" > now()
      and split_part(p_name, '/', 1) = 'admin'
  );
$$;

revoke all on function app_private.storage_upload_grant_valid(text, text) from public;
grant execute on function app_private.storage_upload_grant_valid(text, text) to anon, authenticated, service_role;

drop policy if exists ephemeral_admin_product_media_upload on storage.objects;
create policy ephemeral_admin_product_media_upload
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'product-media'
  and app_private.storage_upload_grant_valid(name, bucket_id)
);

drop function if exists public.storage_upload_grant_valid(text, text);

do $$
declare
  fn record;
begin
  for fn in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn.oid::regprocedure);
    execute format('grant execute on function %s to service_role', fn.oid::regprocedure);
  end loop;
end
$$;
