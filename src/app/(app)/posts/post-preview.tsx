"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Calendar, Target, Tag as TagIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Post, Tag } from "@/lib/types";

interface PostPreviewProps {
  post: Post & { tags?: string[]; linkedResources?: string[] };
  allTags?: Tag[];
}

export function PostPreview({ post, allTags = [] }: PostPreviewProps) {
  const router = useRouter();

  const statusColors: Record<string, string> = {
    idea: "bg-purple-500/20 text-purple-400",
    draft: "bg-yellow-500/20 text-yellow-400",
    ready: "bg-emerald-500/20 text-emerald-400",
    scheduled: "bg-blue-500/20 text-blue-400",
    published: "bg-green-500/20 text-green-400",
    archived: "bg-gray-500/20 text-gray-400",
  };

  const postTags = allTags.filter((t) => post.tags?.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Header with back and edit buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/posts")}
            title="Back to posts"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{post.title || "Untitled"}</h1>
            <div className="flex items-center gap-2 mt-1">
              {post.category && (
                <span className="text-sm text-muted-foreground">{post.category}</span>
              )}
              {post.status && (
                <Badge className={statusColors[post.status] || ""} variant="secondary">
                  {post.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => router.push(`/posts/${post.id}?mode=edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <Separator />

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {post.hook && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Hook</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.hook}</p>
              </CardContent>
            </Card>
          )}

          {post.body && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Body</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{post.body}</p>
              </CardContent>
            </Card>
          )}

          {post.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{post.notes}</p>
              </CardContent>
            </Card>
          )}

          {!post.hook && !post.body && !post.notes && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No content yet. Click Edit to start writing.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {post.publish_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(post.publish_date)}</span>
                </div>
              )}
              {post.goal && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{post.goal}</span>
                </div>
              )}
              {post.created_at && (
                <div className="text-xs text-muted-foreground">
                  Created {formatDate(post.created_at)}
                </div>
              )}
              {post.updated_at && (
                <div className="text-xs text-muted-foreground">
                  Updated {formatDate(post.updated_at)}
                </div>
              )}
            </CardContent>
          </Card>

          {postTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TagIcon className="h-4 w-4" /> Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {postTags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
