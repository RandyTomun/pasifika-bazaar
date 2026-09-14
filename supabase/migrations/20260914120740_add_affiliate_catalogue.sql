alter table public.products
  add column if not exists product_type text not null default 'affiliate'
    check (product_type in ('affiliate', 'owned')),
  add column if not exists retailer text
    check (retailer in ('Amazon', 'eBay', 'AliExpress', 'Pasifika Bazaar')),
  add column if not exists affiliate_url text,
  add column if not exists original_price_aud_cents integer
    check (original_price_aud_cents is null or original_price_aud_cents >= 0),
  add column if not exists rating numeric(2,1)
    check (rating is null or (rating >= 0 and rating <= 5)),
  add column if not exists review_count integer not null default 0
    check (review_count >= 0);

alter table public.products
  add constraint affiliate_products_require_retailer_and_url
  check (
    product_type = 'owned'
    or (retailer is not null and affiliate_url ~ '^https://')
  ) not valid;

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  retailer text not null,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_product_created_idx
  on public.affiliate_clicks(product_id, created_at desc);

alter table public.affiliate_clicks enable row level security;

grant select on public.products to anon, authenticated;
revoke all on public.affiliate_clicks from anon, authenticated;
grant select on public.affiliate_clicks to authenticated;

create policy "Admins view affiliate clicks"
on public.affiliate_clicks for select
to authenticated
using (
  exists (
    select 1 from public.admins
    where admins.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
