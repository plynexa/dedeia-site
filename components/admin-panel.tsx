"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LogOut, PackagePlus, Pencil, Trash2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "./storefront";

const defaultCategories=["Perfume","Colônia","Sabonete","Desodorante","Kit","Roupas","Acessórios"];
const empty={id:"",name:"",category:"Perfume",price:0,old_price:null,image_url:"",image_urls:[],description:"",active:true,stock_quantity:0,archived:false};
const money=(v:number)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function AdminPanel({initialProducts,initialCategories=[]}:{initialProducts:Product[];initialCategories?:string[]}) {
  const [products,setProducts]=useState(initialProducts);
  const [editing,setEditing]=useState<Product|null>(null);
  const [changingPassword,setChangingPassword]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");

  async function logout(){
    const supabase=createClient();
    await supabase?.auth.signOut();
    window.location.replace("/admin/login");
  }
  async function changePassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const password=String(form.get("password")||"");
    const confirmation=String(form.get("confirmation")||"");
    if(password.length<8){setMessage("A nova senha precisa ter pelo menos 8 caracteres.");return;}
    if(password!==confirmation){setMessage("As duas senhas estão diferentes.");return;}
    setSaving(true);setMessage("");
    try{
      const supabase=createClient();
      if(!supabase) throw new Error("Sem conexão com o serviço.");
      const {error}=await supabase.auth.updateUser({password});
      if(error) throw error;
      setChangingPassword(false);
      setMessage("Senha alterada com sucesso.");
    }catch(error){
      setMessage(error instanceof Error?error.message:"Não foi possível alterar a senha.");
    }finally{setSaving(false);}
  }
  async function upload(file:File){
    const supabase=createClient();
    if(!supabase) throw new Error("Sem conexão");
    const ext=file.name.split(".").pop()||"jpg";
    const path=`${crypto.randomUUID()}.${ext}`;
    const {error}=await supabase.storage.from("product-images").upload(path,file,{upsert:false});
    if(error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!editing) return;
    setSaving(true);setMessage("");
    try{
      const form=new FormData(event.currentTarget);
      const file=form.get("photo") as File;
      let image_url=editing.image_url;
      if(file?.size) image_url=await upload(file);
      if(!image_url) throw new Error("Escolha uma foto.");
      const currentGallery=editing.image_urls?.length?editing.image_urls:[editing.image_url].filter(Boolean);
      const image_urls=file?.size?[image_url,...currentGallery.filter(url=>url!==editing.image_url)]:currentGallery;
      const payload={name:String(form.get("name")),description:String(form.get("description")||""),category:String(form.get("category")),price:Number(form.get("price")),old_price:form.get("old_price")?Number(form.get("old_price")):null,image_url,image_urls,stock_quantity:Number(form.get("stock_quantity")||0),active:true,archived:false};
      const supabase=createClient();
      if(!supabase) throw new Error("Sem conexão");
      if(editing.id){
        const {data,error}=await supabase.from("products").update(payload).eq("id",editing.id).select().single();
        if(error) throw error;
        setProducts(current=>current.map(p=>p.id===editing.id?data as Product:p));
      }else{
        const {data,error}=await supabase.from("products").insert(payload).select().single();
        if(error) throw error;
        setProducts(current=>[data as Product,...current]);
      }
      setEditing(null);setMessage("Produto salvo.");
    }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível salvar.");}
    finally{setSaving(false);}
  }
  async function remove(id:string){
    if(!confirm("Excluir este produto?")) return;
    const supabase=createClient();
    const {error}=await supabase!.from("products").delete().eq("id",id);
    if(error){setMessage("Não foi possível excluir.");return;}
    setProducts(current=>current.filter(p=>p.id!==id));
  }

  return <main className="admin-page">
    <header className="admin-header"><img src="/logo.png" alt="Loja da Dedeia"/><div><h1>Gerenciar produtos</h1><p>{products.length} produtos cadastrados</p></div><div className="admin-header-actions"><button onClick={()=>{setMessage("");setChangingPassword(true)}}><KeyRound/><span>Alterar senha</span></button><button onClick={logout}><LogOut/><span>Sair</span></button></div></header>
    <section className="admin-content"><button className="new-product" onClick={()=>setEditing(empty)}><PackagePlus/>Adicionar produto</button>{message&&<div className="notice">{message}</div>}
      <div className="admin-grid">{products.map(p=><article key={p.id}><img src={p.image_url} alt={p.name}/><div><small>{p.category}</small><h2>{p.name}</h2><strong>{money(p.price)}</strong><p className={(p.stock_quantity??0)>0?"admin-stock":"admin-stock out"}>{(p.stock_quantity??0)>0?`${p.stock_quantity} em estoque`:"Fora de estoque"}</p></div><div className="admin-actions"><button onClick={()=>setEditing(p)} aria-label="Editar"><Pencil/></button><button className="danger" onClick={()=>remove(p.id)} aria-label="Excluir"><Trash2/></button></div></article>)}</div>
    </section>
    {changingPassword&&<div className="overlay"><section className="editor"><button className="close" onClick={()=>setChangingPassword(false)}><X/></button><h2>Alterar senha</h2><p>Use pelo menos 8 caracteres.</p><form onSubmit={changePassword}><label>Nova senha<input name="password" type="password" minLength={8} autoComplete="new-password" required autoFocus/></label><label>Confirmar nova senha<input name="confirmation" type="password" minLength={8} autoComplete="new-password" required/></label><button className="primary" disabled={saving}>{saving?"Alterando...":"Salvar nova senha"}</button></form></section></div>}
    {editing&&<div className="overlay"><section className="editor"><button className="close" onClick={()=>setEditing(null)}><X/></button><h2>{editing.id?"Editar produto":"Novo produto"}</h2><form onSubmit={save}>
      <label>Nome<input name="name" defaultValue={editing.name} required/></label>
      <label>Descrição<textarea name="description" defaultValue={editing.description||""} rows={4} placeholder="Detalhes do produto"/></label>
      <label>Categoria<select name="category" defaultValue={editing.category}>{(initialCategories.length?initialCategories:defaultCategories).map(c=><option key={c}>{c}</option>)}</select></label>
      <div className="form-row"><label>Preço<input name="price" type="number" min="0" step=".01" defaultValue={editing.price||""} required/></label><label>Preço anterior<input name="old_price" type="number" min="0" step=".01" defaultValue={editing.old_price??""}/></label></div>
      <label>Quantidade em estoque<input name="stock_quantity" type="number" min="0" step="1" defaultValue={editing.stock_quantity??0} required/></label>
      <label className="upload"><Upload/>Foto do produto<input name="photo" type="file" accept="image/*" capture="environment"/><small>{editing.image_url?"Você pode manter ou trocar a foto.":"Escolha uma foto da galeria ou da câmera."}</small></label>
      <button className="primary" disabled={saving}>{saving?"Salvando...":"Salvar produto"}</button>
    </form></section></div>}
  </main>;
}
