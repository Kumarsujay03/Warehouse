import { createServiceRoleClient } from "@/lib/supabase/server";
import { LibraryView } from "./library-view";

export const dynamic = "force-dynamic";

async function getResources() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

async function getProjects() {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function LibraryPage() {
  const [resources, projects] = await Promise.all([getResources(), getProjects()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground">
          Research papers, videos, books, articles, courses & projects.
        </p>
      </div>
      <LibraryView resources={resources} projects={projects} />
    </div>
  );
}
