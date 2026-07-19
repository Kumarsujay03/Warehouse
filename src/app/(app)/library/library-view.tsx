"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ExternalLink, Trash2, Loader2, Grid, List, Edit, LayoutGrid } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import type { Resource, Project } from "@/lib/types";

type ViewMode = "grid" | "list";

interface LibraryViewProps {
  resources: Resource[];
  projects: Project[];
}

export function LibraryView({ resources, projects }: LibraryViewProps) {
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const filteredResources = resources.filter(
    (r) => r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author?.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const hasSelection = selectedResources.size > 0 || selectedProjects.size > 0;

  function toggleResourceSelect(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const next = new Set(selectedResources);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedResources(next);
  }

  function toggleProjectSelect(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const next = new Set(selectedProjects);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedProjects(next);
  }

  async function handleDeleteResources() {
    if (selectedResources.size === 0) return;
    const ok = await confirm({
      title: "Delete Resources",
      description: `Delete ${selectedResources.size} resource(s)? This cannot be undone.`,
      confirmText: "Delete",
      loadingText: "Deleting...",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    setDeletingIds(new Set(selectedResources));

    // Wait for animation
    await new Promise((r) => setTimeout(r, 300));

    try {
      for (const id of selectedResources) {
        await fetch(`/api/resources/${id}`, { method: "DELETE" });
      }
      toast({ title: `Deleted ${selectedResources.size} resource(s)` });
      setSelectedResources(new Set());
      setDeletingIds(new Set());
      router.refresh();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
      setDeletingIds(new Set());
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteProjects() {
    if (selectedProjects.size === 0) return;
    const ok = await confirm({
      title: "Delete Projects",
      description: `Delete ${selectedProjects.size} project(s)? This cannot be undone.`,
      confirmText: "Delete",
      loadingText: "Deleting...",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    setDeletingIds(new Set(selectedProjects));
    await new Promise((r) => setTimeout(r, 300));
    try {
      for (const id of selectedProjects) {
        await fetch(`/api/projects/${id}`, { method: "DELETE" });
      }
      toast({ title: `Deleted ${selectedProjects.size} project(s)` });
      setSelectedProjects(new Set());
      setDeletingIds(new Set());
      router.refresh();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
      setDeletingIds(new Set());
    } finally {
      setDeleting(false);
    }
  }

  const typeColors: Record<string, string> = {
    paper: "bg-purple-500/20 text-purple-400",
    video: "bg-red-500/20 text-red-400",
    book: "bg-amber-500/20 text-amber-400",
    article: "bg-blue-500/20 text-blue-400",
    course: "bg-green-500/20 text-green-400",
  };

  const projectStatusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    completed: "bg-blue-500/20 text-blue-400",
    paused: "bg-yellow-500/20 text-yellow-400",
    archived: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search library..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-md border p-0.5">
            <button onClick={() => setViewMode("grid")} className={`rounded p-1.5 ${viewMode === "grid" ? "bg-accent" : "hover:bg-accent/50"}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button onClick={() => setViewMode("list")} className={`rounded p-1.5 ${viewMode === "list" ? "bg-accent" : "hover:bg-accent/50"}`}><List className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {selectedResources.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteResources} disabled={deleting}>
                {deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
                Delete ({selectedResources.size})
              </Button>
            )}
            <div className="ml-auto">
              <Button size="sm" onClick={() => { setEditResource(null); setShowResourceDialog(true); }}>
                <Plus className="mr-2 h-4 w-4" />Add Resource
              </Button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className={cn("grid gap-3 md:grid-cols-2 lg:grid-cols-3 stagger-children", hasSelection && "selection-active")}>
              {filteredResources.map((resource) => (
                <Card
                  key={resource.id}
                  className={cn(
                    "selectable-card hover-lift relative transition-all",
                    selectedResources.has(resource.id) && "is-selected ring-2 ring-primary",
                    deletingIds.has(resource.id) && "deleting-item"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedResources.has(resource.id)}
                          onChange={() => toggleResourceSelect(resource.id)}
                          className="select-checkbox mt-0.5 rounded shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <CardTitle className="text-sm font-medium line-clamp-2">{resource.title}</CardTitle>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[resource.type] || ""}`}>{resource.type}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {resource.author && <p className="text-xs text-muted-foreground">{resource.author}</p>}
                    <div className="mt-2 flex items-center gap-1">
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                          <ExternalLink className="h-3 w-3" />Link
                        </a>
                      )}
                      <Button size="icon" variant="ghost" className="ml-auto h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditResource(resource); setShowResourceDialog(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={cn("space-y-1 stagger-children", hasSelection && "selection-active")}>
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className={cn(
                    "selectable-card flex items-center gap-3 rounded-md border p-3 transition-all hover:bg-accent/30",
                    selectedResources.has(resource.id) && "is-selected ring-1 ring-primary bg-accent/20",
                    deletingIds.has(resource.id) && "deleting-item"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedResources.has(resource.id)}
                    onChange={() => toggleResourceSelect(resource.id)}
                    className="select-checkbox rounded shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.type}{resource.author && ` · ${resource.author}`}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button></a>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditResource(resource); setShowResourceDialog(true); }}><Edit className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredResources.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No resources found.</p>}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {selectedProjects.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteProjects} disabled={deleting}>
                {deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
                Delete ({selectedProjects.size})
              </Button>
            )}
            <div className="ml-auto">
              <Button size="sm" onClick={() => { setEditProject(null); setShowProjectDialog(true); }}>
                <Plus className="mr-2 h-4 w-4" />Add Project
              </Button>
            </div>
          </div>
          <div className={cn("grid gap-3 md:grid-cols-2 lg:grid-cols-3 stagger-children", hasSelection && "selection-active")}>
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={cn(
                  "selectable-card hover-lift transition-all",
                  selectedProjects.has(project.id) && "is-selected ring-2 ring-primary",
                  deletingIds.has(project.id) && "deleting-item"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(project.id)}
                      onChange={() => toggleProjectSelect(project.id)}
                      className="select-checkbox mt-0.5 rounded shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">{project.title}</CardTitle>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${projectStatusColors[project.status] || ""}`}>{project.status}</span>
                      </div>
                      {project.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{project.description}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditProject(project); setShowProjectDialog(true); }}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredProjects.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No projects found.</p>}
        </TabsContent>
      </Tabs>

      <ResourceDialog open={showResourceDialog} onClose={() => setShowResourceDialog(false)} resource={editResource} projects={projects} onSaved={() => { router.refresh(); setShowResourceDialog(false); }} />
      <ProjectDialog open={showProjectDialog} onClose={() => setShowProjectDialog(false)} project={editProject} onSaved={() => { router.refresh(); setShowProjectDialog(false); }} />
    </div>
  );
}

function ResourceDialog({ open, onClose, resource, projects, onSaved }: {
  open: boolean; onClose: () => void; resource: Resource | null; projects: Project[]; onSaved: () => void;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({ title: "", type: "article" as Resource["type"], url: "", author: "", description: "", notes: "", project_id: "" });
  const [saving, setSaving] = useState(false);

  useState(() => {
    if (resource) setForm({ title: resource.title, type: resource.type, url: resource.url || "", author: resource.author || "", description: resource.description || "", notes: resource.notes || "", project_id: resource.project_id || "" });
    else setForm({ title: "", type: "article", url: "", author: "", description: "", notes: "", project_id: "" });
  });

  async function handleSave() {
    setSaving(true);
    const url = resource ? `/api/resources/${resource.id}` : "/api/resources";
    const res = await fetch(url, { method: resource ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast({ title: resource ? "Resource updated" : "Resource created" }); onSaved(); }
    else toast({ title: "Error", variant: "destructive" });
  }

  async function handleDelete() {
    if (!resource) return;
    const ok = await confirm({
      title: "Delete Resource",
      description: `Delete "${resource.title}"? This cannot be undone.`,
      confirmText: "Delete",
      loadingText: "Deleting...",
      variant: "destructive",
    });
    if (!ok) return;
    const res = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Resource deleted" }); onSaved(); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{resource ? "Edit Resource" : "New Resource"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Resource["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="paper">Paper</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="book">Book</SelectItem><SelectItem value="article">Article</SelectItem><SelectItem value="course">Course</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
          <div className="space-y-2"><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="space-y-2"><Label>Project</Label>
            <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {resource && <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>}
          <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDialog({ open, onClose, project, onSaved }: {
  open: boolean; onClose: () => void; project: Project | null; onSaved: () => void;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({ title: "", description: "", status: "active" as Project["status"], url: "" });
  const [saving, setSaving] = useState(false);

  useState(() => {
    if (project) setForm({ title: project.title, description: project.description || "", status: project.status, url: project.url || "" });
    else setForm({ title: "", description: "", status: "active", url: "" });
  });

  async function handleSave() {
    setSaving(true);
    const url = project ? `/api/projects/${project.id}` : "/api/projects";
    const res = await fetch(url, { method: project ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast({ title: project ? "Project updated" : "Project created" }); onSaved(); }
    else toast({ title: "Error", variant: "destructive" });
  }

  async function handleDelete() {
    if (!project) return;
    const ok = await confirm({
      title: "Delete Project",
      description: `Delete "${project.title}"? This cannot be undone.`,
      confirmText: "Delete",
      loadingText: "Deleting...",
      variant: "destructive",
    });
    if (!ok) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Project deleted" }); onSaved(); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="space-y-2"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Project["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
        </div>
        <DialogFooter className="gap-2">
          {project && <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>}
          <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
