"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  MessageCircle,
  Eye,
  Save,
  Loader2,
  Check,
  Pencil,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface PostEngagement {
  id: string;
  title: string;
  category: string | null;
  publish_date: string;
  likes_count: number;
  comments_count: number;
  impressions_count: number;
  engagement_updated_at: string | null;
}

interface EngagementEditorProps {
  posts: PostEngagement[];
  onSaved?: () => void;
}

export function EngagementEditor({ posts, onSaved }: EngagementEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<
    Record<string, { likes: number; comments: number; impressions: number }>
  >({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  // Sort posts by publish date (most recent first)
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
  );

  function startEdit(post: PostEngagement) {
    setEditingId(post.id);
    if (!edits[post.id]) {
      setEdits((prev) => ({
        ...prev,
        [post.id]: {
          likes: post.likes_count,
          comments: post.comments_count,
          impressions: post.impressions_count,
        },
      }));
    }
  }

  function updateEdit(id: string, field: "likes" | "comments" | "impressions", value: string) {
    const num = Math.max(0, parseInt(value) || 0);
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: num },
    }));
  }

  function hasChanges() {
    return Object.keys(edits).some((id) => {
      const post = posts.find((p) => p.id === id);
      if (!post) return false;
      return (
        edits[id].likes !== post.likes_count ||
        edits[id].comments !== post.comments_count ||
        edits[id].impressions !== post.impressions_count
      );
    });
  }

  async function saveAll() {
    const updates = Object.entries(edits)
      .filter(([id]) => {
        const post = posts.find((p) => p.id === id);
        if (!post) return false;
        return (
          edits[id].likes !== post.likes_count ||
          edits[id].comments !== post.comments_count ||
          edits[id].impressions !== post.impressions_count
        );
      })
      .map(([id, data]) => ({
        id,
        likes_count: data.likes,
        comments_count: data.comments,
        impressions_count: data.impressions,
      }));

    if (updates.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/analytics/engagement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditingId(null);
      setEdits({});
      toast({ title: `Updated ${updates.length} post(s)` });
      onSaved?.();
    } catch {
      toast({ title: "Failed to save engagement data", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Update Engagement Data</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Published posts only, sorted by publish date. Feed in your impressions, likes, and comments from Creator Mode.
          </p>
        </div>
        {hasChanges() && (
          <Button size="sm" onClick={saveAll} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPosts.map((post) => {
            const isEditing = editingId === post.id;
            const currentEdits = edits[post.id] || {
              likes: post.likes_count,
              comments: post.comments_count,
              impressions: post.impressions_count,
            };

            return (
              <div
                key={post.id}
                className={`rounded-lg border p-4 transition-all ${
                  isEditing ? "border-primary/50 bg-accent/20" : "border-border/50 hover:bg-accent/30"
                }`}
              >
                {/* Header: title + dates + edit */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{post.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Published: {format(new Date(post.publish_date), "MMM d, yyyy")}
                      </span>
                      {post.engagement_updated_at && (
                        <span className="flex items-center gap-1 text-primary/70">
                          <RefreshCw className="h-3 w-3" />
                          Updated: {format(new Date(post.engagement_updated_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      )}
                      {!post.engagement_updated_at && (
                        <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-500">
                          Not yet updated
                        </span>
                      )}
                      {post.category && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                          {post.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => (isEditing ? setEditingId(null) : startEdit(post))}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Metrics */}
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Eye className="h-3 w-3 text-emerald-500" />
                        Impressions
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={currentEdits.impressions}
                        onChange={(e) => updateEdit(post.id, "impressions", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Heart className="h-3 w-3 text-pink-500" />
                        Likes
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={currentEdits.likes}
                        onChange={(e) => updateEdit(post.id, "likes", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <MessageCircle className="h-3 w-3 text-blue-500" />
                        Comments
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={currentEdits.comments}
                        onChange={(e) => updateEdit(post.id, "comments", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-5 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium text-foreground">{post.impressions_count.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span className="font-medium text-foreground">{post.likes_count}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-foreground">{post.comments_count}</span>
                    </span>
                    {post.impressions_count > 0 && (
                      <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {((post.likes_count + post.comments_count) / post.impressions_count * 100).toFixed(1)}% eng. rate
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {sortedPosts.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No published posts found. Publish a post to start tracking engagement.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
