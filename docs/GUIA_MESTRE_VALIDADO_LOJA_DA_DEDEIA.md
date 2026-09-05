# Guia Mestre Validado — Loja da Dedeia

Atualizado em 5 de setembro de 2026.

Este documento é a referência oficial para manter a Loja da Dedeia e criar novas lojas baseadas nela. Ele registra somente a arquitetura e os procedimentos que funcionaram. Tentativas antigas, projetos excluídos e caminhos que produziram erro não são fontes válidas.

## 1. Fontes oficiais

- Código-fonte: `https://github.com/plynexa/dedeia-site`
- Branch de produção: `main`
- Loja pública: `https://loja-da-dedeia.vercel.app`
- Administração web: `https://loja-da-dedeia.vercel.app/admin`
- Banco atual: Supabase, projeto `rryuiyxlfzanfauuwapf`
- API pública do banco: `https://rryuiyxlfzanfauuwapf.supabase.co`
- Aplicativo Android: diretório `mobile/` do mesmo repositório

Nunca misturar este projeto com bancos, repositórios ou contas de testes antigos.

## 2. Arquitetura validada

| Camada | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Site | Next.js 16, React e TypeScript | Catálogo, busca, detalhes, carrinho e administração web |
| Hospedagem | Vercel | Mantém o site público e publica a branch `main` |
| Banco e autenticação | Supabase | Produtos, categorias, administradores, sessões e auditoria |
| Imagens | Supabase Storage | Bucket público `product-images` |
| Aplicativo | Expo e React Native com TypeScript | Administração simplificada no Android |
| Código | GitHub | Fonte única do site, app, SQL e automações |

Fluxo: o site e o aplicativo usam o mesmo projeto Supabase. Uma alteração feita no aplicativo atualiza o banco; o site lê os mesmos dados e mostra a alteração.

## 3. Estrutura principal do repositório

- `app/`: páginas e rotas do Next.js.
- `components/storefront.tsx`: catálogo público, modal do produto e carrinho.
- `components/admin-panel.tsx`: painel administrativo do navegador.
- `lib/supabase/`: configuração e clientes Supabase.
- `supabase/schema.sql`: estrutura principal do banco e políticas RLS.
- `supabase/storage-setup.sql`: configuração do bucket de imagens.
- `mobile/`: aplicativo Android.
- `.github/workflows/web-check.yml`: valida o build do site.
- `.github/workflows/android-apk.yml`: gera o APK independente.

Antes de qualquer alteração, ler este documento e os arquivos relacionados à funcionalidade.

## 4. Banco de dados validado

Tabelas públicas:

- `admins`: usuários autorizados a administrar.
- `products`: produtos, preços, estoque, descrição e galeria.
- `categories`: categorias editáveis.
- `admin_devices`: aparelhos administradores registrados.
- `audit_events`: histórico de ações administrativas.

Campos principais de `products`:

- `id`
- `name`
- `category`
- `price`
- `old_price`
- `image_url`: imagem de capa, mantida para compatibilidade.
- `image_urls`: galeria com até oito imagens; a primeira é a capa.
- `description`
- `stock_quantity`
- `active`
- `archived`
- `created_at`
- `updated_at`

O Row Level Security deve permanecer ativo. Visitantes podem apenas ler produtos ativos e não arquivados. Somente usuários presentes em `admins` podem criar, alterar ou excluir produtos e categorias.

## 5. Storage validado

- Bucket: `product-images`
- Leitura: pública, para o catálogo exibir as imagens.
- Gravação, alteração e exclusão: somente administradores autenticados.
- Não usar uma URL de imagem local do telefone como valor final. O aplicativo envia o arquivo ao Storage e salva a URL pública retornada.

## 6. Autenticação validada

- O login e a sessão ficam no Supabase Auth.
- O site nunca armazena senha em código ou tabela pública.
- O usuário autenticado precisa também existir em `public.admins`.
- O aplicativo pede somente a senha e usa internamente o e-mail administrativo autorizado.
- A sessão do aplicativo é persistida no aparelho até a pessoa tocar em “Sair”, limpar os dados ou desinstalar o app.
- Nunca colocar `service_role` no site, no aplicativo, no GitHub ou em variável pública.
- O botão de administração não aparece na loja pública; o acesso é feito por `/admin`.

## 7. Variáveis corretas

Site/Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Aplicativo:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SITE_URL`

URL e publishable key são valores públicos usados pelo cliente. Segurança real é feita pela autenticação e pelas políticas RLS. Nunca substituir a publishable key por uma service role.

## 8. Funcionalidades validadas

Loja pública:

- categorias e busca;
- catálogo responsivo;
- modal completo ao tocar em um produto;
- galeria de imagens;
- preço e estoque;
- produto esgotado com consulta por WhatsApp;
- carrinho;
- finalização pelo WhatsApp com produtos, quantidades, subtotais e total do pedido;
- animação de produto indo para o carrinho;
- sem promessa fixa de parcelamento sem juros.

Painéis administrativos:

- criar, editar, arquivar e excluir produtos;
- preço atual e preço anterior;
- estoque;
- produto visível ou oculto;
- descrição;
- até oito fotos por produto;
- primeira foto como capa;
- criar, renomear e excluir categorias;
- alterar senha;
- registrar aparelho e eventos administrativos.

## 9. Testes obrigatórios do site

Executar na raiz:

```bash
npm ci
npm run build
```

O código só deve ser considerado pronto quando o build terminar sem erro. A automação `Verificar site` também precisa ficar verde no GitHub. Depois, confirmar que a Vercel marcou o deployment como sucesso.

Checklist manual:

1. Abrir a loja no celular.
2. Trocar categorias e pesquisar.
3. Abrir um produto.
4. Navegar por todas as fotos.
5. Adicionar ao carrinho e observar a animação.
6. Conferir quantidade e total.
7. Entrar em `/admin`.
8. Editar um produto e confirmar a atualização na loja.

## 10. APK Android correto

O APK para instalar no telefone deve ser um build release independente:

```bash
cd mobile
npm ci
npm run typecheck
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease --no-daemon
```

Verificação obrigatória:

```bash
unzip -l app/build/outputs/apk/release/app-release.apk | grep "assets/index.android.bundle"
```

O arquivo `assets/index.android.bundle` precisa existir dentro do APK.

Sempre aumentar:

- `expo.version`, por exemplo de `1.0.3` para `1.0.4`;
- `android.versionCode`, sempre para um número inteiro maior.

## 11. Erros que não devem ser repetidos

- Não entregar `assembleDebug` como aplicativo final. Esse APK procura o servidor Metro e mostra “Unable to load script”.
- Não considerar “Success. No rows returned” como erro: comandos DDL normalmente não retornam linhas.
- Não executar SQL no editor de Logs. Usar o SQL Editor do banco.
- Não executar comandos de Storage quando o schema `storage` não estiver disponível.
- Não excluir tabelas, buckets ou projetos para corrigir um problema de configuração.
- Não misturar o Supabase da Plynexa com o Supabase da Loja da Dedeia.
- Não trocar nomes de variáveis por versões parecidas, como `NEXT_PUBLISH`.
- Não publicar sem rodar TypeScript/build.
- Não alterar `image_url` sem preservar `image_urls`.
- Não adicionar parcelamento “sem juros” antes da integração real com o gateway.
- Não documentar ou enviar senhas em arquivos do repositório.

## 12. Como criar outra loja baseada nesta

1. Duplicar o repositório da Loja da Dedeia para um novo repositório.
2. Alterar nome, identidade visual, contatos e domínio.
3. Criar um projeto Supabase exclusivo para a nova loja.
4. Aplicar `supabase/schema.sql`.
5. Configurar `product-images` usando `supabase/storage-setup.sql`.
6. Criar o usuário administrativo pelo Supabase Auth.
7. Vincular o ID do usuário à tabela `admins`.
8. Configurar as variáveis corretas na Vercel.
9. Atualizar a configuração Supabase do aplicativo.
10. Trocar o package Android para um identificador exclusivo.
11. Rodar o build do site.
12. Gerar APK release e confirmar `index.android.bundle`.
13. Testar login, produto, fotos, estoque, site e aplicativo.

Cada nova loja deve ter repositório, projeto Supabase, usuário administrador, bucket, variáveis Vercel e package Android próprios.

## 13. Instrução para futuros agentes

Use este documento como fonte principal. Inspecione o código atual antes de editar. Preserve mudanças já feitas. Faça migrações incrementais e compatíveis com dados existentes. Valide o site e o aplicativo antes de entregar. Se houver conflito entre uma conversa antiga e este guia, siga este guia e o estado atual da branch `main`.

Não trate mensagens de erro antigas como etapas do processo. Elas servem apenas para justificar a lista “Erros que não devem ser repetidos”.

## 14. Como usar este modelo em um Projeto do ChatGPT

Crie um Projeto novo e limpo. Não mova esta conversa inteira para ele, porque o histórico contém tentativas que falharam. Adicione apenas este guia e o link do repositório como fontes.

Instrução recomendada para o Projeto:

> Use o arquivo `GUIA_MESTRE_VALIDADO_LOJA_DA_DEDEIA.md` e a branch `main` do repositório `plynexa/dedeia-site` como fontes principais. Antes de alterar qualquer loja baseada neste modelo, leia o guia e inspecione os arquivos atuais. Ignore procedimentos antigos listados como erros. Nunca copie credenciais, senhas, IDs de projeto, contatos ou identidade visual da Loja da Dedeia para uma nova loja sem confirmar. Faça mudanças incrementais, preserve dados existentes e valide o build do site e o APK release antes de entregar.

Ordem de confiança das fontes:

1. Código atual da branch `main`.
2. Este Guia Mestre Validado.
3. Documentação oficial atual das tecnologias.
4. Conversas antigas somente como contexto, nunca como procedimento técnico.
