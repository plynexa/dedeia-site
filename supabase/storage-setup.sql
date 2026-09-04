-- Execute somente quando a área Storage estiver disponível no projeto Supabase.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos públicas" on storage.objects;
create policy "fotos públicas" on storage.objects
for select to public using (bucket_id = 'product-images');

drop policy if exists "admin envia fotos" on storage.objects;
create policy "admin envia fotos" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin altera fotos" on storage.objects;
create policy "admin altera fotos" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin exclui fotos" on storage.objects;
create policy "admin exclui fotos" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());
