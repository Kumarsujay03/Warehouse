import { createServiceRoleClient } from "@/lib/supabase/server";
import { PostEditor } from "../post-editor";
import { PostPreview } from "../post-preview";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function PostDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { mode } = await searchParams;
  const supabase = await createServiceRoleClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id), post_resources(resource_id, is_primary)")
    .eq("id", id)
    .single();

  if (!post) notFound();

  const tags = post.post_tags?.map((pt: { tag_id: string }) => pt.tag_id) || [];
  const linkedResources = (post.post_resources || [])
    .sort((a: { is_primary: boolean }, b: { is_primary: boolean }) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    .map((pr: { resource_id: string }) => pr.resource_id);

  // Edit mode: show the editor
  if (mode === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
            <p className="text-muted-foreground">Update your content.</p>
          </div>
        </div>
        <PostEditor post={{ ...post, tags, linkedResources }} />
      </div>
    );
  }

  // Fetch all tags for preview display
  const { data: allTags } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  // Fetch resources linked to this post
  const { data: resources } = linkedResources.length > 0
    ? await supabase
        .from("resources")
        .select("*")
        .in("id", linkedResources)
    : { data: [] };

  // Fetch media attached to this post
  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: false });

  // Default: show preview
  return (
    <PostPreview
      post={{ ...post, tags, linkedResources }}
      allTags={allTags || []}
      resources={resources || []}
      media={media || []}
    />
  );
}
