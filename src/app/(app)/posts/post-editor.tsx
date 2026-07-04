"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Trash2, X, Plus, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Post, Tag, Resource } from "@/lib/types";

interface PostEditorProps {
  post?: Post & { tags?: string[]; linkedResources?: string[] };
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(post?.tags || []);
  const [linkedResourceIds, setLinkedResourceIds] = useState<string[]>(post?.linkedResources || []);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; name: string }[]>([]);

  const [form, setForm] = useState({
    title: post?.title || "",
    category: post?.category || "",
    status: post?.status || "draft",
    publish_date: post?.publish_date?.split("T")[0] || "",
    goal: post?.goal || "",
    hook: post?.hook || "",
    body: post?.body || "",
    notes: post?.notes || "",
    resource_id: post?.resource_id || "",
  });

  const [newResource, setNewResource] = useState({
    title: "",
    type: "article" as Resource["type"],
    url: "",
    author: "",
  });

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.data || []));
    fetch("/api/resources").then((r) => r.json()).then((d) => setResources(d.data || []));
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingMedia(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "Assests_warehouse");
        const res = await fetch("/api/media", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setAttachedMedia((prev) => [...prev, { url: data.data.url, name: file.name }]);
        }
      }
      toast({ title: "Media uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  }

  async function handleCreateResource() {
    if (!newResource.title) return;
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResource),
      });
      if (res.ok) {
        const data = await res.json();
        setResources((prev) => [data.data, ...prev]);
        setLinkedResourceIds((prev) => [...prev, data.data.id]);
        setShowResourceDialog(false);
        setNewResource({ title: "", type: "article", url: "", author: "" });
        toast({ title: "Resource created and linked" });
      }
    } catch {
      toast({ title: "Failed to create resource", variant: "destructive" });
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const url = post ? `/api/posts/${post.id}` : "/api/posts";
      const method = post ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: selectedTags, linkedResources: linkedResourceIds }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed"); }
      toast({ title: post ? "Post updated" : "Post created" });
      router.push("/posts");
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!post || !confirm("Delete this post?")) return;
    setLoading(true);
    try {
      await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      toast({ title: "Post deleted" });
      router.push("/posts");
      router.refresh();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Post title..." />
            </div>
            <div className="space-y-2">
              <Label>Hook</Label>
              <Textarea value={form.hook} onChange={(e) => updateField("hook", e.target.value)} placeholder="Opening hook..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea value={form.body} onChange={(e) => updateField("body", e.target.value)} placeholder="Write your content..." rows={12} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Internal notes..." rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Media</CardTitle>
            <label>
              <Button size="sm" variant="outline" asChild disabled={uploadingMedia}>
                <span className="cursor-pointer">
                  {uploadingMedia ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                  Upload
                </span>
              </Button>
              <input type="file" multiple className="hidden" onChange={handleMediaUpload} accept="image/*,video/*,.pdf" />
            </label>
          </CardHeader>
          <CardContent>
            {attachedMedia.length === 0 ? (
              <p className="text-sm text-muted-foreground">No media attached.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {attachedMedia.map((m, i) => (
                  <div key={i} className="rounded border p-1">
                    <img src={m.url} alt={m.name} className="aspect-square w-full rounded object-cover" />
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">{m.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="e.g. LinkedIn, Blog" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Publish Date</Label>
              <Input type="date" value={form.publish_date} onChange={(e) => updateField("publish_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Input value={form.goal} onChange={(e) => updateField("goal", e.target.value)} placeholder="Content goal..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resources ({linkedResourceIds.length})</CardTitle>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowResourceDialog(true)}><Plus className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add existing resource */}
            <Select onValueChange={(v) => { if (!linkedResourceIds.includes(v)) setLinkedResourceIds((prev) => [...prev, v]); }}>
              <SelectTrigger><SelectValue placeholder="Link a resource..." /></SelectTrigger>
              <SelectContent>
                {resources.filter((r) => !linkedResourceIds.includes(r.id)).map((r) => (<SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>))}
              </SelectContent>
            </Select>
            {/* Linked resources list */}
            {linkedResourceIds.length > 0 && (
              <div className="space-y-1.5">
                {linkedResourceIds.map((rid) => {
                  const r = resources.find((res) => res.id === rid);
                  return (
                    <div key={rid} className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs">
                      <span className="truncate">{r?.title || rid}</span>
                      <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => setLinkedResourceIds((prev) => prev.filter((id) => id !== rid))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant={selectedTags.includes(tag.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(tag.id)}>
                  {tag.name}{selectedTags.includes(tag.id) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
              {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <Button onClick={handleSave} className="w-full" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />{loading ? "Saving..." : "Save"}
            </Button>
            {post && (
              <><Separator /><Button variant="destructive" onClick={handleDelete} className="w-full" disabled={loading}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Quick Add Resource</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Type</Label>
              <Select value={newResource.type} onValueChange={(v) => setNewResource({ ...newResource, type: v as Resource["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">Paper</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>URL</Label><Input value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} /></div>
            <div className="space-y-2"><Label>Author</Label><Input value={newResource.author} onChange={(e) => setNewResource({ ...newResource, author: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreateResource} disabled={!newResource.title}>Create & Link</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
