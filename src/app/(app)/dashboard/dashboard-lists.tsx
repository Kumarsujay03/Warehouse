"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Loader2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm-dialog";

interface Post {
  id: string;
  title: string;
  status?: string;
  publish_date?: string | null;
  created_at: string;
}

interface Import {
  id: string;
  filename: string;
  records_imported: number;
  created_at: string;
}

export function RecentPostsList({ posts }: { posts: Post[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const hasSelection = selected.size > 0;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete Posts",
      description: `Are you sure you want to delete ${selected.size} post(s)? This action cannot be undone.`,
      confirmText: "Delete",
      loadingText: "Deleting...",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    setDeletingIds(new Set(selected));
    await new Promise((r) => setTimeout(r, 300));
    for (const id of selected) {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
    }
    toast({ title: `Deleted ${selected.size} post(s)` });
    setSelected(new Set());
    setDeletingIds(new Set());
    setDeleting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Posts</CardTitle>
        {hasSelection && (
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
            {selected.size}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className={cn("space-y-1", hasSelection && "selection-active")}>
            {posts.map((post) => (
              <div
                key={post.id}
                className={cn(
                  "selectable-card flex items-center gap-2 rounded-md p-2 transition-all hover:bg-accent",
                  selected.has(post.id) && "is-selected bg-accent/40",
                  deletingIds.has(post.id) && "deleting-item"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(post.id)}
                  onChange={() => toggle(post.id)}
                  className="select-checkbox shrink-0"
                />
                <Link href={`/posts/${post.id}`} className="flex flex-1 items-center justify-between min-w-0">
                  <span className="truncate text-sm font-medium">{post.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground ml-2">
                    {formatDate(post.publish_date || post.created_at)}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingPostsList({ posts }: { posts: Post[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-4 w-4" />
          Upcoming Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled posts.</p>
        ) : (
          <div className="space-y-1">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
              >
                <span className="truncate text-sm font-medium">{post.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground ml-2">
                  {post.publish_date ? formatDate(post.publish_date) : "—"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentImportsList({ imports }: { imports: Import[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const hasSelection = selected.size > 0;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete Imports",
      description: `Delete ${selected.size} import record(s)? This cannot be undone.`,
      confirmText: "Delete",
      loadingText: "Deleting...",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    setDeletingIds(new Set(selected));
    await new Promise((r) => setTimeout(r, 300));
    for (const id of selected) {
      await fetch(`/api/imports/${id}`, { method: "DELETE" });
    }
    toast({ title: `Deleted ${selected.size} import(s)` });
    setSelected(new Set());
    setDeletingIds(new Set());
    setDeleting(false);
    router.refresh();
  }

  async function handleClearAll() {
    const ok = await confirm({
      title: "Clear All Imports",
      description: "This will delete all import records permanently. This cannot be undone.",
      confirmText: "Clear All",
      loadingText: "Clearing...",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    for (const imp of imports) {
      await fetch(`/api/imports/${imp.id}`, { method: "DELETE" });
    }
    toast({ title: "Cleared all imports" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Imports</CardTitle>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
              {selected.size}
            </Button>
          )}
          {imports.length > 0 && !hasSelection && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={deleting} className="text-xs text-muted-foreground hover:text-destructive">
              {deleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No imports yet.</p>
        ) : (
          <div className={cn("space-y-1", hasSelection && "selection-active")}>
            {imports.map((imp) => (
              <div
                key={imp.id}
                className={cn(
                  "selectable-card flex items-center gap-2 rounded-md p-2 transition-all hover:bg-accent",
                  selected.has(imp.id) && "is-selected bg-accent/40",
                  deletingIds.has(imp.id) && "deleting-item"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(imp.id)}
                  onChange={() => toggle(imp.id)}
                  className="select-checkbox shrink-0"
                />
                <div className="flex flex-1 items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <span className="truncate text-sm font-medium">{imp.filename}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({imp.records_imported} records)</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground ml-2">
                    {formatDate(imp.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
