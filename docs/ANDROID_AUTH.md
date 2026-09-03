# Protocolo de acesso do aplicativo Android

O aplicativo deve usar o mesmo projeto Supabase do site e autenticação por e-mail e senha.

1. A primeira entrada usa `signInWith(Email)`.
2. O SDK guarda o refresh token no armazenamento protegido do aplicativo.
3. Nas próximas aberturas, o aplicativo recupera e renova a sessão automaticamente.
4. As operações de produtos usam o token da sessão e são validadas pelas políticas RLS.
5. Nunca coloque a chave `service_role` no aplicativo. Use somente a chave publicável.

A sessão deixa de funcionar quando a usuária toca em “Sair”, a senha é redefinida com revogação das sessões ou o acesso é removido no Supabase.
