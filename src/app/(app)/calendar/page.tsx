import { createServiceRoleClient } from "@/lib/supabase/server";
import { CalendarView } from "./calendar-view";
import { BackButton } from "@/components/back-button";

export const dynamic = "force-dynamic";

async function getScheduledPosts() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, status, publish_date, category")
    .not("publish_date", "is", null)
    .order("publish_date", { ascending: true });
  return data || [];
}

export default async function CalendarPage() {
  const posts = await getScheduledPosts();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View scheduled posts by date.</p>
        </div>
      </div>
      <CalendarView posts={posts} />
    </div>
  );
}
