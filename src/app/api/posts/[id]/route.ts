import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id, tags(*))")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const { tags, ...postData } = body;

  const supabase = await createServiceRoleClient();

  const { data: post, error } = await supabase
    .from("posts")
    .update({
      title: postData.title,
      category: postData.category || null,
      status: postData.status || "draft",
      publish_date: postData.publish_date || null,
      goal: postData.goal || null,
      hook: postData.hook || null,
      body: postData.body || null,
      notes: postData.notes || null,
      resource_id: postData.resource_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync tags: delete existing, re-insert
  await supabase.from("post_tags").delete().eq("post_id", id);
  if (tags?.length > 0) {
    const tagInserts = tags.map((tagId: string) => ({
      post_id: id,
      tag_id: tagId,
    }));
    await supabase.from("post_tags").insert(tagInserts);
  }

  return NextResponse.json({ data: post });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const supabase = await createServiceRoleClient();

  await supabase.from("post_tags").delete().eq("post_id", id);
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
