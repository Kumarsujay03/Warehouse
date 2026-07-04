"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Trash2, Copy, ExternalLink, Loader2, Download, Grid, List, LayoutGrid } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MediaItem {
  id: string;
  public_id: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: string;
  created_at: string;
}

type ViewMode = "grid-sm" | "grid-md" | "grid-lg" | "list";

const FOLDERS = [
  { value: "Assests_warehouse", label: "Assets Warehouse" },
  { value: "avatars", label: "Avatars" },
];

export function CloudView() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("Assests_warehouse");
  const [viewMode, setViewMode] = useState<ViewMode>("grid-md");
  const { toast } = useToast();

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?folder=${folder}`);
      const data = await res.json();
      setMedia(data.data || []);
    } catch {
      toast({ title: "Error loading media", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedia();
  }, [folder]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/media", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
      }
      toast({ title: "Upload successful" });
      loadMedia();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(item.public_id)}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted" });
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
      }
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  }

  function downloadFile(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  const gridCols: Record<ViewMode, string> = {
    "grid-sm": "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
    "grid-md": "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    "grid-lg": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    list: "",
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={folder} onValueChange={setFolder}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOLDERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label>
          <Button size="sm" asChild disabled={uploading}>
            <span className="cursor-pointer">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload
            </span>
          </Button>
          <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,video/*,audio/*,.pdf" />
        </label>

        {/* View mode toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
          <button
            onClick={() => setViewMode("grid-sm")}
            className={`rounded p-1.5 ${viewMode === "grid-sm" ? "bg-accent" : "hover:bg-accent/50"}`}
            title="Small grid"
          >
            <Grid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid-md")}
            className={`rounded p-1.5 ${viewMode === "grid-md" ? "bg-accent" : "hover:bg-accent/50"}`}
            title="Medium grid"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid-lg")}
            className={`rounded p-1.5 ${viewMode === "grid-lg" ? "bg-accent" : "hover:bg-accent/50"}`}
            title="Large grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded p-1.5 ${viewMode === "list" ? "bg-accent" : "hover:bg-accent/50"}`}
            title="List view"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No files in this folder.</p>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <div className="space-y-1">
          {media.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-md border p-2 hover:bg-accent/30">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                {item.resource_type === "image" ? (
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[8px] uppercase text-muted-foreground">{item.format}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{item.public_id.split("/").pop()}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(item.bytes)}{item.width && ` · ${item.width}×${item.height}`}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyUrl(item.url)}><Copy className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadFile(item.url, `${item.public_id.split("/").pop()}.${item.format}`)}><Download className="h-3 w-3" /></Button>
                <a href={item.url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button></a>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* GRID VIEW */
        <div className={`grid gap-4 ${gridCols[viewMode]}`}>
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className={`bg-muted ${viewMode === "grid-sm" ? "aspect-square" : "aspect-square"}`}>
                {item.resource_type === "image" ? (
                  <img src={item.url} alt={item.public_id} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <span className="text-xs uppercase">{item.format}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p className="truncate text-xs font-medium">{item.public_id.split("/").pop()}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(item.bytes)}{item.width && ` · ${item.width}×${item.height}`}
                </p>
                <div className="mt-1.5 flex gap-0.5">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyUrl(item.url)}><Copy className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => downloadFile(item.url, `${item.public_id.split("/").pop()}.${item.format}`)}><Download className="h-3 w-3" /></Button>
                  <a href={item.url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button></a>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
