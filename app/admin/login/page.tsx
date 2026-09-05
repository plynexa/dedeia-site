"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

const ADMIN_EMAIL = "lojadaddeia@gmail.com";

export default function AdminLogin() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [firstAccess,setFirstAccess]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function submit(event:FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail=email.trim().toLowerCase();
    if(normalizedEmail!==ADMIN_EMAIL){
      setError("Este e-mail não está autorizado para acessar o painel.");
      return;
    }

    setLoading(true);
    try {
      const response=await fetch("/api/admin/auth",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        cache:"no-store",
        body:JSON.stringify({
          email:normalizedEmail,
          password,
          mode:firstAccess?"signup":"login"
        })
      });
      const result=await response.json().catch(()=>({error:"Não foi possível concluir o acesso."}));
      if(!response.ok){
        setError(result.error||"Não foi possível concluir o acesso.");
        return;
      }
      if(firstAccess&&result.needsConfirmation){
        setMessage("Conta criada. Abra o e-mail de confirmação e depois entre normalmente.");
        setFirstAccess(false);
        return;
      }
      window.location.replace("/admin");
    } catch {
      setError("Não foi possível falar com o servidor. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page"><section className="login-card">
    <img src="/logo.png" alt="Loja da Dedeia"/>
    <div className="login-icon"><LockKeyhole/></div>
    <h1>{firstAccess?"Criar primeiro acesso":"Área de gerenciamento"}</h1>
    <p>{firstAccess?"Use o e-mail autorizado e escolha sua senha.":"Entre para administrar os produtos da loja."}</p>
    <form onSubmit={submit}>
      <label>Login<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/></label>
      <label>Senha<div className="password-field"><input type={show?"text":"password"} autoComplete={firstAccess?"new-password":"current-password"} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShow(!show)} aria-label="Mostrar senha">{show?<EyeOff/>:<Eye/>}</button></div></label>
      {error&&<div className="form-error">{error}</div>}
      {message&&<div className="form-success">{message}</div>}
      <button className="primary" disabled={loading}>{loading?(firstAccess?"Criando...":"Entrando..."):(firstAccess?"Criar acesso":"Entrar")}</button>
    </form>
    <button type="button" className="login-switch" onClick={()=>{setFirstAccess(!firstAccess);setError("");setMessage("");}}>
      {firstAccess?"Já tenho acesso":"Criar primeiro acesso"}
    </button>
    <small>A sessão permanecerá conectada neste aparelho.</small>
  </section></main>;
}
