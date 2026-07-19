import { createServiceRoleClient } from "@/lib/supabase/server";
import { FeedView } from "./feed-view";

export const dynamic = "force-dynamic";

async function getFeedPosts() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, category, status, publish_date, hook, body, goal, notes")
    .in("status", ["ready", "scheduled", "draft", "idea", "published"])
    .order("publish_date", { ascending: true });

  // Fetch media for all posts in one query
  const postIds = (data || []).map((p) => p.id);
  const { data: media } = postIds.length > 0
    ? await supabase
        .from("media")
        .select("id, url, resource_type, post_id")
        .in("post_id", postIds)
    : { data: [] };

  // Group media by post_id
  const mediaByPost: Record<string, { id: string; url: string; resource_type: string }[]> = {};
  for (const m of media || []) {
    if (!mediaByPost[m.post_id]) mediaByPost[m.post_id] = [];
    mediaByPost[m.post_id].push({ id: m.id, url: m.url, resource_type: m.resource_type });
  }

  return (data || []).map((p) => ({ ...p, media: mediaByPost[p.id] || [] }));
}

export default async function FeedPage() {
  const posts = await getFeedPosts();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feed</h1>
        <p className="text-muted-foreground">Preview posts like a LinkedIn feed. Ready and scheduled posts appear first.</p>
      </div>
      <FeedView posts={posts} />
    </div>
  );
}
