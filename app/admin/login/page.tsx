"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function login(event:FormEvent) {
    event.preventDefault();
    setError("");
    const supabase=createClient();
    if(!supabase){setError("A conexão segura ainda não foi configurada.");return;}
    setLoading(true);
    const {error}=await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if(error){setError("Login ou senha incorretos.");return;}
    window.location.replace("/admin");
  }

  return <main className="login-page"><section className="login-card">
    <img src="/logo.png" alt="Loja da Dedeia"/>
    <div className="login-icon"><LockKeyhole/></div>
    <h1>Área de gerenciamento</h1>
    <p>Entre para administrar os produtos da loja.</p>
    <form onSubmit={login}>
      <label>Login<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/></label>
      <label>Senha<div className="password-field"><input type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShow(!show)} aria-label="Mostrar senha">{show?<EyeOff/>:<Eye/>}</button></div></label>
      {error&&<div className="form-error">{error}</div>}
      <button className="primary" disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
    </form>
    <small>A sessão permanecerá conectada neste aparelho.</small>
  </section></main>;
}
