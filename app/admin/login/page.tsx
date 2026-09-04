"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    const supabase=createClient();
    if(!supabase){setError("A conexão segura ainda não foi configurada.");return;}

    const normalizedEmail=email.trim().toLowerCase();
    if(firstAccess && normalizedEmail!==ADMIN_EMAIL){
      setError("Este e-mail não está autorizado para criar o acesso administrativo.");
      return;
    }

    setLoading(true);
    if(firstAccess){
      const {data,error:signUpError}=await supabase.auth.signUp({
        email:normalizedEmail,
        password,
        options:{emailRedirectTo:`${window.location.origin}/admin`}
      });
      setLoading(false);
      if(signUpError){setError(signUpError.message);return;}
      if(data.session){window.location.replace("/admin");return;}
      setMessage("Conta criada. Abra o e-mail de confirmação e depois entre normalmente.");
      setFirstAccess(false);
      return;
    }

    const {error:loginError}=await supabase.auth.signInWithPassword({email:normalizedEmail,password});
    setLoading(false);
    if(loginError){setError("Login ou senha incorretos.");return;}
    window.location.replace("/admin");
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
