import { SearchView } from "./search-view";
import { BackButton } from "@/components/back-button";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search</h1>
          <p className="text-muted-foreground">Search across posts, resources, projects, media, and tags.</p>
        </div>
      </div>
      <SearchView />
    </div>
  );
}
