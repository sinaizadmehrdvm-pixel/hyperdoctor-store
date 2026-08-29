drop policy if exists public_read_published_articles on public."Article";

create policy public_read_published_articles
on public."Article"
for select
to anon, authenticated
using (
  "isPublished" = true
  and ("publishedAt" is null or "publishedAt" <= now())
);
