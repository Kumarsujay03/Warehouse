import { createServiceRoleClient } from "@/lib/supabase/server";
import { PostsTable } from "./posts-table";

export const dynamic = "force-dynamic";

async function getPosts() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id, tags(name, color))")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function PostsPage() {
  const posts = await getPosts();
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
        <p className="text-muted-foreground">Manage your content pipeline.</p>
      </div>
      <PostsTable posts={posts} />
    </div>
  );
}
