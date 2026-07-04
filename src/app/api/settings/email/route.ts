import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession, createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from("users")
    .update({ email, updated_at: new Date().toISOString() })
    .eq("id", session.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Refresh session with new email
  await createSession({
    userId: session.userId,
    email,
    mustChangePassword: session.mustChangePassword,
  });

  return NextResponse.json({ success: true });
}
