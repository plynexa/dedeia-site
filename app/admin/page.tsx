import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin-panel";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase=await createClient();
  if(!supabase) return <main className="setup-page"><h1>Configuração necessária</h1><p>Conecte o projeto ao Supabase na Vercel para liberar o login.</p></main>;

  const {data}=await supabase.auth.getClaims();
  const userId=data?.claims?.sub;
  if(!userId) redirect("/admin/login");

  const {data:admin}=await supabase.from("admins").select("user_id").eq("user_id",userId).maybeSingle();
  if(!admin) redirect("/admin/login?erro=sem-permissao");

  const {data:products}=await supabase.from("products").select("*").order("created_at",{ascending:false});
  return <AdminPanel initialProducts={products??[]}/>;
}
