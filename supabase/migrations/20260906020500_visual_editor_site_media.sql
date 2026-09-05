-- Version 230 — dedicated public media bucket for the visual site editor.
-- Uploads are performed only by authenticated admin server routes using the
-- Supabase service-role credential. Public users only need read access to
-- published image URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
