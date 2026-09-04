# Loja da Dedeia

Loja virtual em Next.js pronta para Vercel, com catálogo público e administração protegida em `/admin`.

## Ativação

1. Crie um projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Execute `supabase/mobile-upgrade.sql` para ativar categorias editáveis, estoque e registro de aparelhos.
4. Em Authentication > Users, crie a conta da administradora.
5. Execute o último comando comentado do SQL, usando o e-mail cadastrado.
6. Na Vercel, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
7. Faça o deploy. A loja fica em `/` e a administração em `/admin`.

O site e o aplicativo Android compartilham autenticação, banco e imagens pelo mesmo Supabase.

O projeto Android está em `mobile`. Veja `mobile/README.md` para testar no Galaxy A32 e gerar o APK.
