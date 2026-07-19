import { createServiceRoleClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Library, Cloud, Tags, Upload, Plus, ArrowUpRight } from "lucide-react";
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
    { label: "Posts", value: stats.posts, icon: FileText, href: "/posts", color: "from-violet-500/10" },
    { label: "Resources", value: stats.resources, icon: Library, href: "/library", color: "from-blue-500/10" },
    { label: "Media", value: stats.media, icon: Cloud, href: "/cloud", color: "from-cyan-500/10" },
    { label: "Tags", value: stats.tags, icon: Tags, href: "/tags", color: "from-pink-500/10" },
    { label: "Imports", value: stats.imports, icon: Upload, href: "/import", color: "from-amber-500/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your content warehouse at a glance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 stagger-children">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`group hover-lift cursor-pointer bg-gradient-to-br ${stat.color} to-transparent`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3 stagger-children">
        <Link href="/posts/new">
          <Card className="group cursor-pointer hover-lift">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] transition-colors group-hover:bg-white/[0.1]">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">New Post</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/import">
          <Card className="group cursor-pointer hover-lift">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] transition-colors group-hover:bg-white/[0.1]">
                  <Upload className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Import Content</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/cloud">
          <Card className="group cursor-pointer hover-lift">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] transition-colors group-hover:bg-white/[0.1]">
                  <Cloud className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Upload Media</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
