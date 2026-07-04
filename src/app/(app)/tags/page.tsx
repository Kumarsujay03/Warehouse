import { createServiceRoleClient } from "@/lib/supabase/server";
import { TagsView } from "./tags-view";
import { BackButton } from "@/components/back-button";

export const dynamic = "force-dynamic";

async function getTags() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("tags")
    .select("*, post_tags(post_id)")
    .order("name", { ascending: true });
  return data || [];
}

export default async function TagsPage() {
  const tags = await getTags();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">Manage tags used across posts, projects, and resources.</p>
        </div>
      </div>
      <TagsView tags={tags} />
    </div>
  );
}
