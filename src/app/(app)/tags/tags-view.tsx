"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

interface TagWithCount {
  id: string;
  name: string;
  color: string | null;
  post_tags?: { post_id: string }[];
}

export function TagsView({ tags }: { tags: TagWithCount[] }) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6b7280");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const hasSelection = selectedTags.size > 0;

  function toggleSelect(id: string) {
    const next = new Set(selectedTags);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTags(next);
  }

  async function handleCreate() {
    if (!newTagName.trim()) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    });
    if (res.ok) {
      toast({ title: "Tag created" });
      setNewTagName("");
      router.refresh();
    } else {
      toast({ title: "Error creating tag", variant: "destructive" });
    }
  }

  async function handleDeleteSelected() {
    if (selectedTags.size === 0) return;
    const ok = await confirm({
      title: "Delete Tags",
      description: `Delete ${selectedTags.size} tag(s)? Posts using these tags will be untagged.`,
      confirmText: "Delete",
      loadingText: "Deleting...",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    setDeletingIds(new Set(selectedTags));
    await new Promise((r) => setTimeout(r, 300));
    try {
      for (const id of selectedTags) {
        await fetch(`/api/tags/${id}`, { method: "DELETE" });
      }
      toast({ title: `Deleted ${selectedTags.size} tag(s)` });
      setSelectedTags(new Set());
      setDeletingIds(new Set());
      router.refresh();
    } catch {
      toast({ title: "Error deleting tags", variant: "destructive" });
      setDeletingIds(new Set());
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteSingle(id: string) {
    setDeletingIds(new Set([id]));
    await new Promise((r) => setTimeout(r, 300));
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Tag deleted" });
      router.refresh();
    }
    setDeletingIds(new Set());
  }

  return (
    <div className="space-y-6">
      {/* Create tag */}
      <Card>
        <CardContent className="flex items-end gap-3 p-4">
          <div className="flex-1">
            <Input
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="h-10 w-14 cursor-pointer p-1"
          />
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" />Add
          </Button>
        </CardContent>
      </Card>

      {/* Bulk delete */}
      {hasSelection && (
        <div className="animate-fade-in">
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={deleting}>
            {deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
            Delete ({selectedTags.size})
          </Button>
        </div>
      )}

      {/* Tag list */}
      <div className={cn("grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 stagger-children", hasSelection && "selection-active")}>
        {tags.map((tag) => (
          <Card
            key={tag.id}
            className={cn(
              "selectable-card hover-lift transition-all",
              selectedTags.has(tag.id) && "is-selected ring-2 ring-primary",
              deletingIds.has(tag.id) && "deleting-item"
            )}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2" onClick={() => toggleSelect(tag.id)}>
                <input
                  type="checkbox"
                  checked={selectedTags.has(tag.id)}
                  onChange={() => toggleSelect(tag.id)}
                  className="select-checkbox rounded"
                />
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color || "#6b7280" }}
                />
                <span className="text-sm font-medium">{tag.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {tag.post_tags?.length || 0}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); handleDeleteSingle(tag.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No tags created yet.</p>
      )}
    </div>
  );
}
