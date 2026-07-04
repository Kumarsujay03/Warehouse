import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServiceRoleClient();

  const [posts, resources, projects, tags, postTags, media, imports] =
    await Promise.all([
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("resources").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tags").select("*").order("name", { ascending: true }),
      supabase.from("post_tags").select("*"),
      supabase.from("media").select("*").order("created_at", { ascending: false }),
      supabase.from("imports").select("*").order("created_at", { ascending: false }),
    ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    posts: posts.data || [],
    resources: resources.data || [],
    projects: projects.data || [],
    tags: tags.data || [],
    postTags: postTags.data || [],
    media: media.data || [],
    imports: imports.data || [],
  });
}
