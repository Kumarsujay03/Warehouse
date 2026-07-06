import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tags, linkedResources, ...postData } = body;

  const supabase = await createServiceRoleClient();

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      title: postData.title,
      category: postData.category || null,
      status: postData.status || "draft",
      publish_date: postData.publish_date || null,
      goal: postData.goal || null,
      hook: postData.hook || null,
      body: postData.body || null,
      notes: postData.notes || null,
      resource_id: linkedResources?.[0] || postData.resource_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert tags
  if (tags?.length > 0 && post) {
    const tagInserts = tags.map((tagId: string) => ({ post_id: post.id, tag_id: tagId }));
    await supabase.from("post_tags").insert(tagInserts);
  }

  // Insert linked resources (many-to-many)
  if (linkedResources?.length > 0 && post) {
    const resInserts = linkedResources.map((rid: string, i: number) => ({
      post_id: post.id,
      resource_id: rid,
      is_primary: i === 0,
    }));
    await supabase.from("post_resources").insert(resInserts);
  }

  // Link media to this post
  if (body.mediaIds?.length > 0 && post) {
    await supabase
      .from("media")
      .update({ post_id: post.id })
      .in("id", body.mediaIds);
  }

  return NextResponse.json({ data: post }, { status: 201 });
}
