import { createServiceRoleClient } from "@/lib/supabase/server";
import { FeedView } from "./feed-view";

export const dynamic = "force-dynamic";

async function getFeedPosts() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, category, status, publish_date, hook, body, goal")
    .in("status", ["ready", "scheduled", "draft", "idea", "published"])
    .order("publish_date", { ascending: true });
  return data || [];
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
