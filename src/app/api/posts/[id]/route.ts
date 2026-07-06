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
    .select("*, post_tags(tag_id, tags(*)), post_resources(resource_id, is_primary)")
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
  const { tags, linkedResources, ...postData } = body;

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
      resource_id: linkedResources?.[0] || postData.resource_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync tags
  await supabase.from("post_tags").delete().eq("post_id", id);
  if (tags?.length > 0) {
    const tagInserts = tags.map((tagId: string) => ({ post_id: id, tag_id: tagId }));
    await supabase.from("post_tags").insert(tagInserts);
  }

  // Sync linked resources
  await supabase.from("post_resources").delete().eq("post_id", id);
  if (linkedResources?.length > 0) {
    const resInserts = linkedResources.map((rid: string, i: number) => ({
      post_id: id,
      resource_id: rid,
      is_primary: i === 0,
    }));
    await supabase.from("post_resources").insert(resInserts);
  }

  // Link media to this post
  if (body.mediaIds?.length > 0) {
    // First, unlink any media that was previously linked but is no longer in the list
    await supabase
      .from("media")
      .update({ post_id: null })
      .eq("post_id", id)
      .not("id", "in", `(${body.mediaIds.join(",")})`);

    // Link by UUID id
    await supabase
      .from("media")
      .update({ post_id: id })
      .in("id", body.mediaIds);

    // Also try linking by public_id (for cloud-linked media that might use public_id as identifier)
    await supabase
      .from("media")
      .update({ post_id: id })
      .in("public_id", body.mediaIds);
  } else {
    // If no mediaIds provided, unlink all media from this post
    await supabase
      .from("media")
      .update({ post_id: null })
      .eq("post_id", id);
  }

  return NextResponse.json({ data: post });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const supabase = await createServiceRoleClient();

  await supabase.from("post_tags").delete().eq("post_id", id);
  await supabase.from("post_resources").delete().eq("post_id", id);
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
