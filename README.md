# Loja da Dedeia

Loja virtual em Next.js pronta para Vercel, com catálogo público e administração protegida em `/admin`.

## Ativação

1. Crie um projeto no Supabase.
2. Execute somente `supabase/schema.sql` no SQL Editor. Ele prepara todas as tabelas públicas e pode ser repetido sem apagar produtos.
3. Em Authentication > Users, crie a conta da administradora.
4. Adicione o `user_id` criado à tabela `public.admins`.
5. Se o Storage estiver habilitado no projeto, execute `supabase/storage-setup.sql` para liberar as fotos.
6. Na Vercel, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
7. Faça o deploy. A loja fica em `/` e a administração em `/admin`.

O site e o aplicativo Android compartilham autenticação, banco e imagens pelo mesmo Supabase.

O projeto Android está em `mobile`. Veja `mobile/README.md` para testar no Galaxy A32 e gerar o APK.
