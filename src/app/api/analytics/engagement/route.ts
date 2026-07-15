import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

// Bulk update engagement data for posts
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { updates } = body as {
    updates: { id: string; likes_count: number; comments_count: number; impressions_count: number }[];
  };

  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: "Invalid payload. Expected { updates: [...] }" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();
  const errors: string[] = [];

  for (const update of updates) {
    const { error } = await supabase
      .from("posts")
      .update({
        likes_count: update.likes_count,
        comments_count: update.comments_count,
        impressions_count: update.impressions_count,
        engagement_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", update.id);

    if (error) errors.push(`${update.id}: ${error.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Some updates failed", details: errors }, { status: 207 });
  }

  return NextResponse.json({ success: true, updated: updates.length });
}
