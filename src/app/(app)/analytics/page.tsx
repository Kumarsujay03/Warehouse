import { createServiceRoleClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Library,
  Tags,
  TrendingUp,
  Image,
  FolderOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { AnalyticsClient } from "./analytics-client";

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
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("tags").select("*", { count: "exact", head: true }),
    supabase.from("media").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalPosts: totalPosts || 0,
    publishedPosts: publishedPosts || 0,
    draftPosts: draftPosts || 0,
    scheduledPosts: scheduledPosts || 0,
    totalResources: totalResources || 0,
    totalProjects: totalProjects || 0,
    totalTags: totalTags || 0,
    totalMedia: totalMedia || 0,
  };
}

export default async function AnalyticsPage() {
  const stats = await getAnalytics();

  const publishRate = stats.totalPosts > 0
    ? Math.round((stats.publishedPosts / stats.totalPosts) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your content performance and growth.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-4 py-2 sm:flex">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{publishRate}% published</span>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <StatCard icon={FileText} label="Posts" value={stats.totalPosts} color="text-foreground" />
        <StatCard icon={TrendingUp} label="Published" value={stats.publishedPosts} color="text-green-500" />
        <StatCard icon={Clock} label="Scheduled" value={stats.scheduledPosts} color="text-blue-500" />
        <StatCard icon={FileText} label="Drafts" value={stats.draftPosts} color="text-yellow-500" />
        <StatCard icon={Library} label="Resources" value={stats.totalResources} color="text-violet-500" />
        <StatCard icon={FolderOpen} label="Projects" value={stats.totalProjects} color="text-orange-500" />
        <StatCard icon={Image} label="Media" value={stats.totalMedia} color="text-cyan-500" />
        <StatCard icon={Tags} label="Tags" value={stats.totalTags} color="text-pink-500" />
      </div>

      {/* Advanced Analytics — Client Components */}
      <AnalyticsClient />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center p-4 text-center">
        <Icon className={`mb-1.5 h-5 w-5 ${color}`} />
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
