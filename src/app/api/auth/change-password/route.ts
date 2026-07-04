import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
import { getSession, createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, newPassword } = await request.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        { error: "Username and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();
    const passwordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from("users")
      .update({
        username,
        password_hash: passwordHash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.userId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update credentials" },
        { status: 500 }
      );
    }

    // Refresh session with updated flag
    await createSession({
      userId: session.userId,
      email: session.email,
      mustChangePassword: false,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
