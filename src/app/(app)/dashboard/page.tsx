import { createServiceRoleClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Library, Cloud, Tags, Upload } from "lucide-react";
import Link from "next/link";
import { RecentPostsList, UpcomingPostsList, RecentImportsList } from "./dashboard-lists";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = await createServiceRoleClient();
  const [posts, resources, media, tags, imports] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("media").select("*", { count: "exact", head: true }),
    supabase.from("tags").select("*", { count: "exact", head: true }),
    supabase.from("imports").select("*", { count: "exact", head: true }),
  ]);
  return {
    posts: posts.count || 0,
    resources: resources.count || 0,
    media: media.count || 0,
    tags: tags.count || 0,
    imports: imports.count || 0,
  };
}

async function getRecentPosts() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, status, publish_date, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  return data || [];
}

async function getUpcomingPosts() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, publish_date, created_at")
    .eq("status", "scheduled")
    .gte("publish_date", new Date().toISOString())
    .order("publish_date", { ascending: true })
    .limit(5);
  return data || [];
}

async function getRecentImports() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  return data || [];
}

export default async function DashboardPage() {
  const [stats, recentPosts, upcomingPosts, recentImports] = await Promise.all([
    getStats(),
    getRecentPosts(),
    getUpcomingPosts(),
    getRecentImports(),
  ]);

  const statCards = [
    { label: "Posts", value: stats.posts, icon: FileText, href: "/posts" },
    { label: "Resources", value: stats.resources, icon: Library, href: "/library" },
    { label: "Media", value: stats.media, icon: Cloud, href: "/cloud" },
    { label: "Tags", value: stats.tags, icon: Tags, href: "/tags" },
    { label: "Imports", value: stats.imports, icon: Upload, href: "/import" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your content warehouse at a glance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:bg-accent/50 hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Link href="/posts/new">
          <Card className="cursor-pointer transition-colors hover:bg-accent/50 hover-lift">
            <CardContent className="flex items-center gap-3 p-4">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">New Post</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/import">
          <Card className="cursor-pointer transition-colors hover:bg-accent/50 hover-lift">
            <CardContent className="flex items-center gap-3 p-4">
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Import Content</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/cloud">
          <Card className="cursor-pointer transition-colors hover:bg-accent/50 hover-lift">
            <CardContent className="flex items-center gap-3 p-4">
              <Cloud className="h-5 w-5" />
              <span className="text-sm font-medium">Upload Media</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent & Upcoming */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentPostsList posts={recentPosts} />
        <UpcomingPostsList posts={upcomingPosts} />
      </div>

      {/* Imports */}
      <RecentImportsList imports={recentImports} />
    </div>
  );
}
