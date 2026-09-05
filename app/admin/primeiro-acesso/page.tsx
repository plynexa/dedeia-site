import Link from "next/link";

const messages: Record<string,string> = {
  configuracao: "A conexão segura ainda não foi configurada.",
  email: "Este e-mail não está autorizado para criar o acesso.",
  senha: "A senha precisa ter pelo menos 8 caracteres.",
  existente: "Este acesso já existe. Volte e entre com a senha criada.",
  servico: "O serviço está temporariamente indisponível. Tente novamente em alguns minutos.",
};

export const dynamic = "force-dynamic";

export default async function PrimeiroAcesso({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; confirmacao?: string }>;
}) {
  const params = await searchParams;
  const error = params.erro ? messages[params.erro] ?? messages.servico : "";
  const confirmed = params.confirmacao === "1";

  return <main className="login-page"><section className="login-card">
    <img src="/logo.png" alt="Loja da Dedeia"/>
    <div className="login-icon">🔒</div>
    <h1>Criar primeiro acesso</h1>
    <p>Escolha a senha que será usada para administrar a loja.</p>
    {confirmed ? <>
      <div className="form-success">Conta criada. Confira o e-mail de confirmação.</div>
      <Link className="primary" href="/admin/login">Ir para o login</Link>
    </> : <form method="post" action="/api/admin/first-access">
      <label>Login
        <input type="email" name="email" value="lojadaddeia@gmail.com" readOnly/>
      </label>
      <label>Senha
        <input type="password" name="password" autoComplete="new-password" minLength={8} required/>
      </label>
      {error&&<div className="form-error">{error}</div>}
      <button className="primary" type="submit">Criar acesso</button>
    </form>}
    <Link className="login-switch" href="/admin/login">Já tenho acesso</Link>
    <small>Formulário seguro compatível com iPhone.</small>
  </section></main>;
}
