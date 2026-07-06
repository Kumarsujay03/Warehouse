"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Edit, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FeedMedia {
  id: string;
  url: string;
  resource_type: string;
}

interface FeedPost {
  id: string;
  title: string;
  category: string;
  status: string;
  publish_date: string | null;
  hook: string | null;
  body: string | null;
  goal: string | null;
  notes: string | null;
  media?: FeedMedia[];
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
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

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

  function toggleExpand(postId: string) {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

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

      {/* Feed cards — LinkedIn style */}
      <div className="mx-auto max-w-2xl space-y-4">
        {sortedPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No posts to show. Create posts and mark them as &quot;Ready&quot; or &quot;Scheduled&quot;.
          </p>
        ) : (
          sortedPosts.map((post) => {
            const isExpanded = expandedPosts.has(post.id);
            const hasLongBody = (post.body?.length || 0) > 300;
            const media = post.media || [];

            return (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 px-5 pt-4">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" title="View post">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Title */}
                  <div className="px-5 pt-3">
                    <h3 className="text-lg font-semibold leading-tight">{post.title}</h3>
                  </div>

                  {/* Hook */}
                  {post.hook && (
                    <div className="px-5 pt-2">
                      <p className="text-sm leading-relaxed text-muted-foreground">{post.hook}</p>
                    </div>
                  )}

                  {/* Body — full article */}
                  {post.body && (
                    <div className="px-5 pt-3">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {isExpanded || !hasLongBody
                          ? post.body
                          : post.body.slice(0, 300) + "..."}
                      </div>
                      {hasLongBody && (
                        <button
                          onClick={() => toggleExpand(post.id)}
                          className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {isExpanded ? (
                            <>Show less <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Read more <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Media — displayed like LinkedIn media attachments */}
                  {media.length > 0 && (
                    <div className="mt-4">
                      {media.length === 1 ? (
                        // Single media — full width
                        <a href={media[0].url} target="_blank" rel="noopener noreferrer" className="block">
                          {media[0].resource_type === "video" ? (
                            <video
                              src={media[0].url}
                              controls
                              className="w-full max-h-[400px] object-contain bg-black"
                            />
                          ) : (
                            <img
                              src={media[0].url}
                              alt=""
                              className="w-full max-h-[400px] object-contain bg-muted/30"
                            />
                          )}
                        </a>
                      ) : media.length === 2 ? (
                        // Two media — side by side
                        <div className="grid grid-cols-2 gap-0.5">
                          {media.map((m) => (
                            <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={m.url}
                                alt=""
                                className="h-[200px] w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        // 3+ media — grid layout
                        <div className="grid grid-cols-2 gap-0.5">
                          {media.slice(0, 4).map((m, i) => (
                            <a
                              key={m.id}
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative block"
                            >
                              <img
                                src={m.url}
                                alt=""
                                className="h-[150px] w-full object-cover"
                              />
                              {i === 3 && media.length > 4 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <span className="text-lg font-bold text-white">+{media.length - 4}</span>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer — goal & notes */}
                  {(post.goal || post.notes) && (
                    <div className="px-5 pt-3">
                      <Separator className="mb-3" />
                      {post.goal && (
                        <span className="text-[11px] text-muted-foreground">Goal: {post.goal}</span>
                      )}
                      {isExpanded && post.notes && (
                        <p className="mt-1 text-[11px] text-muted-foreground italic">Notes: {post.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Bottom padding */}
                  <div className="h-4" />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
