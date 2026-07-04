"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FeedPost {
  id: string;
  title: string;
  category: string;
  status: string;
  publish_date: string | null;
  hook: string | null;
  body: string | null;
  goal: string | null;
}

const statusColors: Record<string, string> = {
  ready: "bg-emerald-500/20 text-emerald-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  draft: "bg-yellow-500/20 text-yellow-400",
  idea: "bg-purple-500/20 text-purple-400",
  published: "bg-green-500/20 text-green-400",
  archived: "bg-gray-500/20 text-gray-400",
};

export function FeedView({ posts }: { posts: FeedPost[] }) {
  const [showDrafts, setShowDrafts] = useState(false);

  const sortedPosts = useMemo(() => {
    const statusPriority: Record<string, number> = {
      ready: 0,
      scheduled: 1,
      draft: 2,
      idea: 3,
      published: 4,
      archived: 5,
    };

    let filtered = posts;
    if (!showDrafts) {
      filtered = posts.filter((p) => p.status === "ready" || p.status === "scheduled" || p.status === "published");
    }

    return [...filtered].sort((a, b) => {
      const pa = statusPriority[a.status] ?? 9;
      const pb = statusPriority[b.status] ?? 9;
      if (pa !== pb) return pa - pb;
      if (a.publish_date && b.publish_date) return a.publish_date.localeCompare(b.publish_date);
      return 0;
    });
  }, [posts, showDrafts]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant={showDrafts ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowDrafts(!showDrafts)}
        >
          {showDrafts ? <Eye className="mr-2 h-3.5 w-3.5" /> : <EyeOff className="mr-2 h-3.5 w-3.5" />}
          {showDrafts ? "Showing all" : "Show drafts"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {sortedPosts.length} posts
        </span>
      </div>

      {/* Feed cards */}
      <div className="mx-auto max-w-2xl space-y-4">
        {sortedPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No posts to show. Create posts and mark them as &quot;Ready&quot; or &quot;Scheduled&quot;.
          </p>
        ) : (
          sortedPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-5">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[post.status] || ""}`}>
                      {post.status}
                    </span>
                    {post.category && (
                      <Badge variant="outline" className="text-[10px]">{post.category}</Badge>
                    )}
                    {post.publish_date && (
                      <span className="text-xs text-muted-foreground">{formatDate(post.publish_date)}</span>
                    )}
                  </div>
                  <Link href={`/posts/${post.id}`}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit post">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                {/* Title */}
                <h3 className="mb-2 text-base font-semibold leading-tight">{post.title}</h3>

                {/* Hook / Preview */}
                {post.hook && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.hook}</p>
                )}

                {!post.hook && post.body && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {post.body.slice(0, 200)}
                  </p>
                )}

                {/* Footer */}
                {post.goal && (
                  <div className="mt-3 border-t pt-2">
                    <span className="text-[10px] text-muted-foreground">Goal: {post.goal}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
