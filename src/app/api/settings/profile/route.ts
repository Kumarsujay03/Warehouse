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
    .eq("key", "display_name")
    .single();

  return NextResponse.json({ display_name: data?.value || "" });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name } = await request.json();

  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("settings")
    .upsert(
      { key: "display_name", value: display_name || "", updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
