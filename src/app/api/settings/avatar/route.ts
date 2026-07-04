import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "avatar_url")
    .single();

  return NextResponse.json({ avatar_url: data?.value || null });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatar_url } = await request.json();

  if (!avatar_url) {
    return NextResponse.json({ error: "avatar_url is required" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from("settings")
    .upsert(
      { key: "avatar_url", value: avatar_url, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
