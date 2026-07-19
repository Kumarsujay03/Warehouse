import { SearchView } from "./search-view";

export default function SearchPage() {
  return (
    <div className="space-y-6 liquid-glow">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Search across posts, resources, projects, media, and tags.</p>
      </div>
      <SearchView />
    </div>
  );
}
