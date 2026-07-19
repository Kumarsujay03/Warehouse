"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, Eye } from "lucide-react";
import { format } from "date-fns";

interface EngagementData {
  totalLikes: number;
  totalComments: number;
  totalImpressions: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  engagementRate: number;
  topPosts: {
    id: string;
    title: string;
    likes: number;
    comments: number;
    impressions: number;
    category: string | null;
    publish_date: string;
  }[];
}

export function EngagementMetrics({ data }: { data: EngagementData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Performing Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {data.topPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published posts with engagement data yet. Update your metrics in the Manage Data tab.
          </p>
        ) : (
          <div className="space-y-2">
            {data.topPosts.map((post, i) => {
              const engagement = post.likes + post.comments;
              const maxEngagement = data.topPosts[0].likes + data.topPosts[0].comments;
              const barWidth = maxEngagement > 0 ? (engagement / maxEngagement) * 100 : 0;

              return (
                <div key={post.id} className="group relative">
                  {/* Background bar */}
                  <div
                    className="absolute inset-0 rounded-lg bg-primary/5 transition-all group-hover:bg-primary/10"
                    style={{ width: `${barWidth}%` }}
                  />
                  <Link
                    href={`/posts/${post.id}`}
                    className="relative flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/30"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{post.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {post.category && <span>{post.category}</span>}
                        <span>{format(new Date(post.publish_date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-emerald-500" />
                        {post.impressions.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-pink-500" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-blue-500" />
                        {post.comments}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
