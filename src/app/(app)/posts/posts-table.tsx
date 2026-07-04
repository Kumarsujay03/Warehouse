"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ArrowUpDown, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PostItem {
  id: string;
  title: string;
  category: string;
  status: string;
  publish_date: string | null;
  goal: string | null;
  created_at: string;
  post_tags?: { tag_id: string; tags: { name: string; color: string | null } }[];
}

type SortField = "title" | "category" | "status" | "publish_date" | "created_at";
type SortDir = "asc" | "desc";

export function PostsTable({ posts }: { posts: PostItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();

  const categories = useMemo(
    () => [...new Set(posts.map((p) => p.category).filter(Boolean))],
    [posts]
  );

  const filtered = useMemo(() => {
    let result = [...posts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.goal?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (categoryFilter !== "all") result = result.filter((p) => p.category === categoryFilter);

    result.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [posts, search, statusFilter, categoryFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map((p) => p.id)));
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} post(s)?`)) return;
    setDeleting(true);
    setDeletingIds(new Set(selectedIds));
    await new Promise((r) => setTimeout(r, 300));
    try {
      for (const id of selectedIds) {
        await fetch(`/api/posts/${id}`, { method: "DELETE" });
      }
      toast({ title: `Deleted ${selectedIds.size} post(s)` });
      setSelectedIds(new Set());
      setDeletingIds(new Set());
      router.refresh();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
      setDeletingIds(new Set());
    } finally {
      setDeleting(false);
    }
  }

  const statusColors: Record<string, string> = {
    idea: "bg-purple-500/20 text-purple-400",
    draft: "bg-yellow-500/20 text-yellow-400",
    ready: "bg-emerald-500/20 text-emerald-400",
    scheduled: "bg-blue-500/20 text-blue-400",
    published: "bg-green-500/20 text-green-400",
    archived: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search posts..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={deleting}>
            {deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
            Delete ({selectedIds.size})
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/posts/new">
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Post</Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className={cn("overflow-x-auto rounded-md border", selectedIds.size > 0 && "selection-active")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className={cn("header-checkbox rounded", selectedIds.size > 0 && "opacity-100")} />
              </TableHead>
              <TableHead><button onClick={() => toggleSort("title")} className="flex items-center gap-1">Title <ArrowUpDown className="h-3 w-3" /></button></TableHead>
              <TableHead className="hidden md:table-cell"><button onClick={() => toggleSort("category")} className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></button></TableHead>
              <TableHead><button onClick={() => toggleSort("status")} className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></button></TableHead>
              <TableHead className="hidden lg:table-cell"><button onClick={() => toggleSort("publish_date")} className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></button></TableHead>
              <TableHead className="hidden xl:table-cell">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No posts found.</TableCell></TableRow>
            ) : (
              paginated.map((post) => (
                <TableRow
                  key={post.id}
                  className={cn(
                    "selectable-card cursor-pointer transition-all",
                    selectedIds.has(post.id) && "is-selected bg-accent/30",
                    deletingIds.has(post.id) && "deleting-item"
                  )}
                  onClick={() => router.push(`/posts/${post.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(post.id)} onChange={() => toggleSelect(post.id)} className="select-checkbox rounded" />
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{post.title}</TableCell>
                  <TableCell className="hidden md:table-cell">{post.category}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[post.status] || ""}`}>{post.status}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{post.publish_date ? formatDate(post.publish_date) : "—"}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {post.post_tags?.slice(0, 3).map((pt) => (
                        <Badge key={pt.tag_id} variant="secondary" className="text-[10px]">{pt.tags?.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {totalPages <= 10 && Array.from({ length: totalPages }, (_, i) => (
              <Button key={i} variant={currentPage === i + 1 ? "secondary" : "ghost"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(i + 1)}>
                {i + 1}
              </Button>
            ))}
            {totalPages > 10 && (
              <span className="px-2 text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
