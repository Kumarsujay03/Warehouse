import { createServiceRoleClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Library, Calendar, Tags, TrendingUp } from "lucide-react";
import { BackButton } from "@/components/back-button";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const supabase = await createServiceRoleClient();

  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: draftPosts },
    { count: scheduledPosts },
    { count: totalResources },
    { count: totalProjects },
    { count: totalTags },
    { count: totalMedia },
    { data: recentPosts },
    { data: categoryBreakdown },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("tags").select("*", { count: "exact", head: true }),
    supabase.from("media").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("posts").select("category"),
  ]);

  // Category breakdown
  const categories: Record<string, number> = {};
  categoryBreakdown?.forEach((p) => {
    const cat = p.category || "Uncategorized";
    categories[cat] = (categories[cat] || 0) + 1;
  });

  return {
    totalPosts: totalPosts || 0,
    publishedPosts: publishedPosts || 0,
    draftPosts: draftPosts || 0,
    scheduledPosts: scheduledPosts || 0,
    totalResources: totalResources || 0,
    totalProjects: totalProjects || 0,
    totalTags: totalTags || 0,
    totalMedia: totalMedia || 0,
    categories,
  };
}

export default async function AnalyticsPage() {
  const stats = await getAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Content and usage statistics.</p>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resources</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResources}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tags</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTags}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Post Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Published</span>
              <span className="text-sm font-bold text-green-400">{stats.publishedPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Scheduled</span>
              <span className="text-sm font-bold text-blue-400">{stats.scheduledPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Drafts</span>
              <span className="text-sm font-bold text-yellow-400">{stats.draftPosts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.categories)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm">{cat}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              ))}
            {Object.keys(stats.categories).length === 0 && (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Totals summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Warehouse Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Projects</p>
              <p className="text-xl font-bold">{stats.totalProjects}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Media Files</p>
              <p className="text-xl font-bold">{stats.totalMedia}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resources</p>
              <p className="text-xl font-bold">{stats.totalResources}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tags</p>
              <p className="text-xl font-bold">{stats.totalTags}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
