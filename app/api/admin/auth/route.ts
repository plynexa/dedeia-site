import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "lojadaddeia@gmail.com";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "A conexão segura ainda não foi configurada." },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados de acesso inválidos." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const mode = body.mode === "signup" ? "signup" : "login";

  if (email !== ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Este e-mail não está autorizado para acessar o painel." },
      { status: 403 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha precisa ter pelo menos 8 caracteres." },
      { status: 400 }
    );
  }

  let cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        cookiesToSet = items as CookieToSet[];
      },
    },
  });

  try {
    if (mode === "signup") {
      const origin = new URL(request.url).origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/admin` },
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 400 });
      }

      const response = NextResponse.json({
        ok: true,
        needsConfirmation: !data.session,
      });
      response.headers.set("Cache-Control", "private, no-store");
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      );
      return response;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json(
        { error: "Login ou senha incorretos." },
        { status: error.status || 401 }
      );
    }

    const response = NextResponse.json({ ok: true, needsConfirmation: false });
    response.headers.set("Cache-Control", "private, no-store");
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  } catch {
    return NextResponse.json(
      { error: "O serviço de acesso está temporariamente indisponível. Tente novamente em alguns minutos." },
      { status: 503 }
    );
  }
}
