# Protocolo de acesso do aplicativo Android

O aplicativo deve usar o mesmo projeto Supabase do site e autenticação por e-mail e senha.

1. A primeira entrada usa `signInWithPassword` com e-mail e senha.
2. O SDK guarda e renova a sessão no armazenamento local do aplicativo.
3. Nas próximas aberturas, o aplicativo recupera e renova a sessão automaticamente.
4. As operações de produtos usam o token da sessão e são validadas pelas políticas RLS.
5. Nunca coloque a chave `service_role` no aplicativo. Use somente a chave publicável.

A sessão deixa de funcionar quando a usuária toca em “Sair”, a senha é redefinida com revogação das sessões ou o acesso é removido no Supabase.

## Registro de acesso

- Cada instalação recebe um identificador aleatório guardado no armazenamento seguro do Android.
- A rota única `/api/audit` registra aparelho, versão do sistema, IP visto pela Vercel e as ações administrativas principais.
- A localização aproximada é opcional, coletada apenas com autorização e somente enquanto o app está aberto.
- O mesmo login funciona em dois aparelhos simultaneamente. Para saber exatamente qual pessoa fez cada alteração, o ideal é criar uma conta separada para cada administradora.
