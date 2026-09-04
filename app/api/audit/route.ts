import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization");
  if (!url || !key || !authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const token = authorization.slice(7);
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", userData.user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const installationId = typeof body?.installation_id === "string" ? body.installation_id.slice(0, 100) : "";
  const action = typeof body?.action === "string" ? body.action.slice(0, 80) : "app_event";
  if (!installationId) return NextResponse.json({ error: "Aparelho inválido" }, { status: 400 });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwarded || request.headers.get("x-real-ip") || null;
  const location = body?.location && typeof body.location === "object" ? body.location : null;
  const device = {
    platform: body?.platform,
    device_name: body?.device_name,
    brand: body?.brand,
    model: body?.model,
    os_version: body?.os_version,
    app_version: body?.app_version,
  };

  const deviceResult = await supabase.from("admin_devices").upsert({
    user_id: userData.user.id,
    installation_id: installationId,
    device_info: device,
    ip_address: ipAddress,
    last_location: location,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "user_id,installation_id" });

  const eventResult = await supabase.from("audit_events").insert({
    user_id: userData.user.id,
    installation_id: installationId,
    action,
    details: body?.details && typeof body.details === "object" ? body.details : {},
    ip_address: ipAddress,
    location,
  });

  if (deviceResult.error || eventResult.error) {
    return NextResponse.json({ error: deviceResult.error?.message || eventResult.error?.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
