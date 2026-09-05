"use client";

import { useEffect, useMemo, useState } from "react";
import { Home, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image_url: string;
  active: boolean;
  archived?: boolean;
  stock_quantity?: number;
};

const samples: Product[] = [
  { id:"1", name:"Perfume feminino clássico", category:"Perfume", price:129.9, old_price:149.9, image_url:"https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85", active:true, stock_quantity:5 },
  { id:"2", name:"Kit de cuidados presenteável", category:"Kit", price:89.9, old_price:null, image_url:"https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85", active:true, stock_quantity:3 },
  { id:"3", name:"Bolsa feminina casual", category:"Acessórios", price:79.9, old_price:99.9, image_url:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85", active:true, stock_quantity:0 },
  { id:"4", name:"Colônia floral suave", category:"Colônia", price:74.9, old_price:null, image_url:"https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=85", active:true, stock_quantity:4 },
];
const defaultCategories=["Perfume","Colônia","Sabonete","Desodorante","Kit","Roupas","Acessórios"];
const whatsapp="5522998837944";
const money=(value:number)=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function Storefront() {
  const [products,setProducts]=useState<Product[]>(samples);
  const [categories,setCategories]=useState(["Todos",...defaultCategories]);
  const [category,setCategory]=useState("Todos");
  const [query,setQuery]=useState("");
  const [cart,setCart]=useState<Record<string,number>>({});
  const [cartOpen,setCartOpen]=useState(false);

  useEffect(()=>{
    const supabase=createClient();
    if(!supabase) return;
    Promise.all([
      supabase.from("products").select("*").eq("active",true).order("created_at",{ascending:false}),
      supabase.from("categories").select("name").eq("active",true).order("sort_order"),
    ]).then(([productResult,categoryResult])=>{
      if(productResult.data?.length) setProducts((productResult.data as Product[]).filter(product=>!product.archived));
      if(categoryResult.data?.length) setCategories(["Todos",...categoryResult.data.map(item=>item.name)]);
    });
  },[]);

  const filtered=useMemo(()=>products.filter(p=>
    (category==="Todos"||p.category===category)&&p.name.toLowerCase().includes(query.toLowerCase())
  ),[products,category,query]);
  const count=Object.values(cart).reduce((a,b)=>a+b,0);
  const total=products.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0);
  const change=(id:string,delta:number)=>setCart(current=>{
    const product=products.find(item=>item.id===id);
    const limit=product?.stock_quantity??999;
    const next=Math.min(limit,Math.max(0,(current[id]||0)+delta));
    const updated={...current,[id]:next};
    if(!next) delete updated[id];
    return updated;
  });
  const consult=(product:Product)=>window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de consultar o preço e encomendar: ${product.name}.`)}`,"_blank","noopener,noreferrer");

  return <main>
    <header className="topbar"><div className="topbar-inner">
      <img className="logo" src="/logo.png" alt="Loja da Dedeia" />
      <button className="cart-trigger" onClick={()=>setCartOpen(true)} aria-label="Abrir carrinho">
        <ShoppingBag size={21}/><span className="cart-label">Carrinho</span>{count>0&&<b>{count}</b>}
      </button>
    </div></header>

    <section className="intro"><h1>Beleza, carinho <em>e estilo.</em></h1><p>Perfumes, cuidados pessoais, roupas e acessórios escolhidos para você.</p></section>

    <section className="catalog" id="produtos">
      <nav className="categories" aria-label="Categorias">{categories.map(item=>
        <button key={item} className={category===item?"active":""} onClick={()=>setCategory(item)}>{item}</button>
      )}</nav>
      <label className="search"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="O que você está procurando?"/>{query&&<button onClick={()=>setQuery("")} aria-label="Limpar busca"><X size={18}/></button>}</label>
      <div className="catalog-heading"><div><small>CATÁLOGO</small><h2>{category==="Todos"?"Escolhidos para você":category}</h2></div><span>{filtered.length} produtos</span></div>
      <div className="product-grid">{filtered.map(p=>{const out=(p.stock_quantity??1)<=0;return <article className={`product-card${out?" out-of-stock":""}`} key={p.id}>
        <div className="product-photo"><img src={p.image_url} alt={p.name}/>{p.old_price&&<span>OFERTA</span>}</div>
        <div className="product-body"><small>{p.category}</small><h3>{p.name}</h3>{p.old_price&&<del>{money(p.old_price)}</del>}<strong>{money(p.price)}</strong>{out?<><span className="stock-status">Fora de estoque • Sob encomenda</span><button className="whatsapp" onClick={()=>consult(p)}>Consultar preço</button></>:<button onClick={()=>change(p.id,1)}><ShoppingBag size={18}/>Adicionar</button>}</div>
      </article>})}</div>
    </section>

    <footer><strong>Loja da Dedeia</strong><p>Uma loja feita com carinho.</p><span>Site desenvolvido pela Plynexa</span></footer>
    <nav className="mobile-nav"><button onClick={()=>scrollTo({top:0,behavior:"smooth"})}><Home/>Início</button><button onClick={()=>document.getElementById("produtos")?.scrollIntoView({behavior:"smooth"})}><Search/>Buscar</button><button onClick={()=>setCartOpen(true)}><ShoppingBag/>Carrinho</button></nav>

    {cartOpen&&<div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setCartOpen(false)}><aside className="cart-panel"><button className="close" onClick={()=>setCartOpen(false)}><X/></button><h2>Seu carrinho</h2>
      {!count?<div className="empty"><ShoppingBag/><h3>Seu carrinho está vazio</h3></div>:<>
        <div className="cart-list">{products.filter(p=>cart[p.id]).map(p=><div className="cart-item" key={p.id}><img src={p.image_url} alt=""/><div><b>{p.name}</b><strong>{money(p.price)}</strong><div className="quantity"><button onClick={()=>change(p.id,-1)}><Minus/></button><span>{cart[p.id]}</span><button onClick={()=>change(p.id,1)}><Plus/></button></div></div></div>)}</div>
        <div className="total"><span>Total</span><b>{money(total)}</b></div><button className="checkout">Continuar para pagamento</button>
      </>}
    </aside></div>}
  </main>;
}
