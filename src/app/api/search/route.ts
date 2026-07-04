import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { SearchResult } from "@/lib/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const supabase = await createServiceRoleClient();
  const results: SearchResult[] = [];

  // Search posts
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, category, status")
    .or(`title.ilike.%${q}%,category.ilike.%${q}%,goal.ilike.%${q}%,body.ilike.%${q}%`)
    .limit(10);

  if (posts) {
    for (const p of posts) {
      results.push({
        type: "post",
        id: p.id,
        title: p.title,
        subtitle: `${p.category || ""} · ${p.status}`,
      });
    }
  }

  // Search resources
  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, type, author")
    .or(`title.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(10);

  if (resources) {
    for (const r of resources) {
      results.push({
        type: "resource",
        id: r.id,
        title: r.title,
        subtitle: `${r.type} · ${r.author || ""}`,
      });
    }
  }

  // Search projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, status")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(10);

  if (projects) {
    for (const p of projects) {
      results.push({
        type: "project",
        id: p.id,
        title: p.title,
        subtitle: p.status,
      });
    }
  }

  // Search tags
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name")
    .ilike("name", `%${q}%`)
    .limit(10);

  if (tags) {
    for (const t of tags) {
      results.push({
        type: "tag",
        id: t.id,
        title: t.name,
      });
    }
  }

  // Search media
  const { data: media } = await supabase
    .from("media")
    .select("id, public_id, format")
    .ilike("public_id", `%${q}%`)
    .limit(10);

  if (media) {
    for (const m of media) {
      results.push({
        type: "media",
        id: m.id,
        title: m.public_id.split("/").pop() || m.public_id,
        subtitle: m.format,
      });
    }
  }

  return NextResponse.json({ data: results });
}
