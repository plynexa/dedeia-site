# Loja da Dedeia

Loja virtual em Next.js pronta para Vercel, com catálogo público e administração protegida em `/admin`.

## Ativação

1. Crie um projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Em Authentication > Users, crie a conta da administradora.
4. Execute o último comando comentado do SQL, usando o e-mail cadastrado.
5. Na Vercel, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
6. Faça o deploy. A loja fica em `/` e a administração em `/admin`.

O site e o aplicativo Android compartilham autenticação, banco e imagens pelo mesmo Supabase.
