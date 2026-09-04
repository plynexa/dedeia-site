# Loja da Dedeia Admin — Android

Aplicativo exclusivo das administradoras da loja. Ele usa o mesmo login, produtos, categorias e imagens do site.

## Preparar o banco

1. Execute `supabase/schema.sql` no SQL Editor se o banco ainda estiver vazio.
2. Execute `supabase/mobile-upgrade.sql` para liberar categorias, estoque, arquivo e registro de aparelhos.
3. Quando o Storage do Supabase estiver disponível, execute `supabase/storage-setup.sql` para liberar as fotos.
4. Crie a usuária em Authentication e inclua seu `user_id` em `public.admins`.

## Rodar no Galaxy A32

1. Copie `.env.example` para `.env` e use os mesmos valores públicos configurados na Vercel.
2. Rode `npm install` dentro de `mobile`.
3. Rode `npx expo start` e abra o projeto com o Expo Go no Galaxy A32.

## Gerar APK de teste

Depois de entrar no EAS (`npx eas login`), rode:

```bash
npx eas build --platform android --profile preview
```

O perfil `preview` gera um APK instalável. O app pede localização aproximada somente no primeiro acesso e não usa localização em segundo plano.
