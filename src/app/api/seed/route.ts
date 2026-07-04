import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time seed endpoint. Visit GET /api/seed to create the admin user.
 * Uses direct client creation to avoid any import issues.
 */
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({
        error: "Missing env vars",
        hasUrl: !!url,
        hasKey: !!key,
      }, { status: 500 });
    }

    // Debug: check which key is being used
    const keyPayload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64").toString()
    );

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = process.env.ADMIN_EMAIL || "admin@warehouse.com";
    const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

    // Check if user already exists
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found (that's fine)
      return NextResponse.json({
        error: selectError.message,
        code: selectError.code,
        role: keyPayload.role,
        hint: "If role is 'anon', the wrong key is being used.",
      }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({
        message: `Admin already exists (${existing.email}). Login with this email.`,
        email: existing.email,
      });
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        username: "admin",
        password_hash: passwordHash,
        must_change_password: true,
      })
      .select("id, email")
      .single();

    if (insertError) {
      return NextResponse.json({
        error: insertError.message,
        code: insertError.code,
        role: keyPayload.role,
        hint: "Did you run the SQL migration (001_schema.sql) in Supabase?",
      }, { status: 500 });
    }

    return NextResponse.json({
      message: "Admin seeded successfully!",
      email: newUser.email,
      password: "ChangeMe123!",
      note: "You will be asked to change credentials on first login.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
