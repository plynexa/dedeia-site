"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

const ADMIN_EMAIL = "lojadaddeia@gmail.com";

export default function AdminLogin() {
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response=await fetch("/api/admin/auth",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        cache:"no-store",
        body:JSON.stringify({email:ADMIN_EMAIL,password,mode:"login"})
      });
      const result=await response.json().catch(()=>({error:"Não foi possível concluir o acesso."}));
      if(!response.ok){
        setError(result.error||"Não foi possível concluir o acesso.");
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
    <h1>Área de gerenciamento</h1>
    <p>Digite a senha para administrar os produtos da loja.</p>
    <form onSubmit={submit}>
      <label>Login<input type="email" autoComplete="username" value={ADMIN_EMAIL} readOnly/></label>
      <label>Senha<div className="password-field"><input type={show?"text":"password"} autoComplete="current-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required autoFocus/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Ocultar senha":"Mostrar senha"}>{show?<EyeOff/>:<Eye/>}</button></div></label>
      {error&&<div className="form-error">{error}</div>}
      <button className="primary" disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
    </form>
    <small>A sessão permanecerá conectada neste aparelho.</small>
  </section></main>;
}
