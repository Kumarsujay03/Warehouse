import { createServiceRoleClient } from "@/lib/supabase/server";
import { PostEditor } from "../post-editor";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServiceRoleClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id)")
    .eq("id", id)
    .single();

  if (!post) notFound();

  const tags = post.post_tags?.map((pt: { tag_id: string }) => pt.tag_id) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
          <p className="text-muted-foreground">Update your content.</p>
        </div>
      </div>
      <PostEditor post={{ ...post, tags }} />
    </div>
  );
}
