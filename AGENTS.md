# Instruções do projeto Loja da Dedeia

Antes de alterar este repositório, leia por completo:

- `docs/GUIA_MESTRE_VALIDADO_LOJA_DA_DEDEIA.md`

Regras:

- Trate a branch `main` e o Guia Mestre como fontes principais.
- Ignore procedimentos antigos que o guia identifica como erros.
- Preserve a arquitetura atual: Next.js/TypeScript, Vercel, Supabase e Expo/React Native.
- Não misture contas ou projetos Supabase e nunca exponha senha ou `service_role`.
- Faça alterações incrementais e compatíveis com os dados existentes.
- Execute `npm ci` e `npm run build` antes de entregar mudanças no site.
- Para Android, entregue somente APK release independente e confirme que contém `assets/index.android.bundle`.
- Não altere identidade visual, contatos, autenticação, banco ou pagamentos além do pedido atual.
