import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "lojadaddeia@gmail.com";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export const dynamic = "force-dynamic";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return redirectTo(request, "/admin/primeiro-acesso?erro=configuracao");
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (email !== ADMIN_EMAIL) {
    return redirectTo(request, "/admin/primeiro-acesso?erro=email");
  }
  if (password.length < 8) {
    return redirectTo(request, "/admin/primeiro-acesso?erro=senha");
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
    const origin = new URL(request.url).origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/admin` },
    });

    if (error) {
      const code = error.message.toLowerCase().includes("already")
        ? "existente"
        : "servico";
      return redirectTo(request, `/admin/primeiro-acesso?erro=${code}`);
    }

    const destination = data.session
      ? "/admin"
      : "/admin/primeiro-acesso?confirmacao=1";
    const response = redirectTo(request, destination);
    response.headers.set("Cache-Control", "private, no-store");
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  } catch {
    return redirectTo(request, "/admin/primeiro-acesso?erro=servico");
  }
}
