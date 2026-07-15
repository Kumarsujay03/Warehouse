"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, TrendingUp, Eye, Percent } from "lucide-react";
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
  const totalEngagement = data.totalLikes + data.totalComments;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Eye className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Impressions</p>
              <p className="text-xl font-bold">{data.totalImpressions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Likes</p>
              <p className="text-xl font-bold">{data.totalLikes.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <MessageCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comments</p>
              <p className="text-xl font-bold">{data.totalComments.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <TrendingUp className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="text-xl font-bold">{totalEngagement.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Percent className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Eng. Rate</p>
              <p className="text-xl font-bold">{data.engagementRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
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
            <div className="space-y-3">
              {data.topPosts.map((post, i) => {
                const engagement = post.likes + post.comments;
                const maxEngagement = data.topPosts[0].likes + data.topPosts[0].comments;
                const barWidth = maxEngagement > 0 ? (engagement / maxEngagement) * 100 : 0;

                return (
                  <div key={post.id} className="group relative">
                    {/* Background bar */}
                    <div
                      className="absolute inset-0 rounded-md bg-primary/5 transition-all group-hover:bg-primary/10"
                      style={{ width: `${barWidth}%` }}
                    />
                    <Link
                      href={`/posts/${post.id}`}
                      className="relative flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-accent/50"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{post.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {post.category && <span>{post.category}</span>}
                          <span>
                            {format(new Date(post.publish_date), "MMM d, yyyy")}
                          </span>
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
    </div>
  );
}
