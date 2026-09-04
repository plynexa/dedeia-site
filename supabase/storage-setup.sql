-- CONFIGURAÇÃO SEGURA DAS FOTOS
-- Se o Storage não estiver habilitado, este arquivo não gera erro e não altera
-- nenhuma tabela do schema public.

do $setup$
begin
  if to_regclass('storage.buckets') is null
     or to_regclass('storage.objects') is null then
    raise notice 'Storage ainda não está habilitado neste projeto. Nenhuma alteração foi feita.';
    return;
  end if;

  execute $sql$
    insert into storage.buckets (id, name, public)
    values ('product-images', 'product-images', true)
    on conflict (id) do update set public = true
  $sql$;

  execute $sql$drop policy if exists "fotos públicas" on storage.objects$sql$;
  execute $sql$
    create policy "fotos públicas" on storage.objects
    for select to public using (bucket_id = 'product-images')
  $sql$;

  execute $sql$drop policy if exists "admin envia fotos" on storage.objects$sql$;
  execute $sql$
    create policy "admin envia fotos" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'product-images' and private.is_admin())
  $sql$;

  execute $sql$drop policy if exists "admin altera fotos" on storage.objects$sql$;
  execute $sql$
    create policy "admin altera fotos" on storage.objects
    for update to authenticated
    using (bucket_id = 'product-images' and private.is_admin())
    with check (bucket_id = 'product-images' and private.is_admin())
  $sql$;

  execute $sql$drop policy if exists "admin exclui fotos" on storage.objects$sql$;
  execute $sql$
    create policy "admin exclui fotos" on storage.objects
    for delete to authenticated
    using (bucket_id = 'product-images' and private.is_admin())
  $sql$;
end
$setup$;

select case
  when to_regclass('storage.buckets') is null then
    'STORAGE_NAO_DISPONIVEL: as tabelas da loja continuam funcionando normalmente.'
  else
    'STORAGE_CONFIGURADO: bucket product-images pronto.'
end as resultado;
