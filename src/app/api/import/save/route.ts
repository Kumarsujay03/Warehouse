import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { posts, filename, clearExisting } = await request.json();

  if (!posts?.length) {
    return NextResponse.json({ error: "No posts to import" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Clear existing records if requested
  if (clearExisting) {
    await supabase.from("post_tags").delete().neq("post_id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("post_resources").delete().neq("post_id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("resources").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  let imported = 0;
  let failed = 0;
  let resourcesCreated = 0;

  for (const post of posts) {
    let primaryResourceId: string | null = null;
    const allResourceIds: string[] = [];

    // Handle multiple resources per post
    const allResources = post.resources?.length
      ? post.resources
      : post.resource_url
        ? [{ type: post.resource_type || "article", title: post.title, url: post.resource_url }]
        : [];

    for (const res of allResources) {
      if (!res.url) continue;

      // Check if resource with this URL already exists
      const { data: existing } = await supabase
        .from("resources")
        .select("id")
        .eq("url", res.url)
        .single();

      let resourceId: string;

      if (existing) {
        resourceId = existing.id;
      } else {
        const { data: newResource } = await supabase
          .from("resources")
          .insert({
            title: res.title || post.title,
            type: mapResourceType(res.type),
            url: res.url,
          })
          .select("id")
          .single();

        if (newResource) {
          resourceId = newResource.id;
          resourcesCreated++;
        } else {
          continue;
        }
      }

      // Link the first resource as the primary
      if (!primaryResourceId) {
        primaryResourceId = resourceId;
      }
      allResourceIds.push(resourceId);
    }

    // Create the post
    const { data: newPost, error } = await supabase.from("posts").insert({
      title: post.title,
      category: post.category || null,
      status: post.status || "draft",
      publish_date: post.publish_date || null,
      goal: post.goal || null,
      hook: post.hook || null,
      resource_id: primaryResourceId,
    }).select("id").single();

    if (error || !newPost) {
      failed++;
    } else {
      imported++;
      // Link all resources to this post via junction table
      if (allResourceIds.length > 0) {
        const resInserts = allResourceIds.map((rid: string, i: number) => ({
          post_id: newPost.id,
          resource_id: rid,
          is_primary: i === 0,
        }));
        await supabase.from("post_resources").insert(resInserts);
      }
    }
  }

  // Log import
  await supabase.from("imports").insert({
    filename: filename || "unknown",
    format: filename?.split(".").pop() || "json",
    status: "completed",
    records_imported: imported,
    errors: failed > 0 ? `${failed} records failed` : null,
  });

  return NextResponse.json({ imported, failed, resourcesCreated });
}

// Map various type names to our allowed types
function mapResourceType(type: string): string {
  const t = type?.toLowerCase() || "article";
  if (t === "repo" || t === "repository") return "article";
  if (t === "newsletter") return "article";
  if (t === "podcast") return "video";
  if (["paper", "video", "book", "article", "course"].includes(t)) return t;
  return "article";
}
