import { PostEditor } from "../post-editor";
import { BackButton } from "@/components/back-button";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Post</h1>
          <p className="text-muted-foreground">Create a new content post.</p>
        </div>
      </div>
      <PostEditor />
    </div>
  );
}
