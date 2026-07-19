"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileText, Library, FolderOpen, Image, Tags } from "lucide-react";
import type { SearchResult } from "@/lib/types";

const typeIcons: Record<string, React.ElementType> = {
  post: FileText,
  resource: Library,
  project: FolderOpen,
  media: Image,
  tag: Tags,
};

const typeLinks: Record<string, (id: string) => string> = {
  post: (id) => `/feed/${id}`,
  resource: (id) => `/library`,
  project: (id) => `/library`,
  media: (id) => `/cloud`,
  tag: (id) => `/tags`,
};

export function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl bg-white/[0.03]">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search everything..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-0 bg-transparent shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 rounded-lg bg-white/[0.05] flex items-center justify-center animate-pulse-glow">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2 stagger-children">
          {results.map((result) => {
            const Icon = typeIcons[result.type] || FileText;
            const href = typeLinks[result.type]?.(result.id) || "#";

            return (
              <Link key={`${result.type}-${result.id}`} href={href}>
                <Card className="hover-lift hover:bg-white/[0.04]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.type}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No results for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
