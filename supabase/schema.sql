-- Execute uma vez no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (category in ('Perfume','Colônia','Sabonete','Desodorante','Kit','Roupas','Acessórios')),
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2) check (old_price is null or old_price >= 0),
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.admins where user_id = auth.uid()) $$;

alter table public.admins enable row level security;
alter table public.products enable row level security;

create policy "admin lê seu acesso" on public.admins
for select to authenticated using (user_id = auth.uid());

create policy "catálogo público" on public.products
for select to anon, authenticated using (active or public.is_admin());

create policy "admin cadastra produtos" on public.products
for insert to authenticated with check (public.is_admin());

create policy "admin altera produtos" on public.products
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin exclui produtos" on public.products
for delete to authenticated using (public.is_admin());

insert into storage.buckets (id,name,public)
values ('product-images','product-images',true)
on conflict (id) do update set public = true;

create policy "fotos públicas" on storage.objects
for select to public using (bucket_id = 'product-images');

create policy "admin envia fotos" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin altera fotos" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_admin());

create policy "admin exclui fotos" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- Depois de criar a conta da sua mãe em Authentication > Users,
-- troque o e-mail abaixo e execute apenas este comando:
-- insert into public.admins(user_id)
-- select id from auth.users where email = 'EMAIL_DA_SUA_MAE'
-- on conflict do nothing;
