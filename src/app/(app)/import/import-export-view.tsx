"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, Loader2, Check, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ParsedPost {
  title: string;
  category: string;
  status: string;
  publish_date: string;
  goal: string;
  hook: string;
  resource_url: string;
  resource_type: string;
  resources: Array<{ type: string; title: string; url: string }>;
}

// Sample templates for download
const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<body>
<table>
  <tr><th>Title</th><th>Category</th><th>Status</th><th>Publish Date</th><th>Goal</th><th>Resource URL</th></tr>
  <tr><td>My First Post</td><td>LinkedIn</td><td>draft</td><td>2025-02-01</td><td>Engagement</td><td>https://arxiv.org/abs/2301.00001</td></tr>
  <tr><td>Deep Learning Basics</td><td>Blog</td><td>scheduled</td><td>2025-02-15</td><td>Education</td><td>https://youtube.com/watch?v=abc123</td></tr>
  <tr><td>Weekly Newsletter</td><td>Newsletter</td><td>draft</td><td></td><td>Growth</td><td></td></tr>
</table>
</body>
</html>`;

const SAMPLE_JSON = JSON.stringify([
  { title: "My First Post", category: "LinkedIn", status: "draft", publish_date: "2025-02-01", goal: "Engagement", resource_url: "https://arxiv.org/abs/2301.00001" },
  { title: "Deep Learning Basics", category: "Blog", status: "scheduled", publish_date: "2025-02-15", goal: "Education", resource_url: "https://youtube.com/watch?v=abc123" },
  { title: "Weekly Newsletter", category: "Newsletter", status: "draft", publish_date: "", goal: "Growth" },
], null, 2);

const SAMPLE_MD = `# My First Post
https://arxiv.org/abs/2301.00001

# Deep Learning Basics
https://youtube.com/watch?v=abc123

# Weekly Newsletter
`;

function downloadSample(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ImportExportView() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedPost[]>([]);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const { toast } = useToast();

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setParsed([]);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");

      setParsed(data.data || []);
      toast({ title: `Parsed ${data.data?.length || 0} records` });
    } catch (err) {
      toast({
        title: "Parse failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (parsed.length === 0) return;
    setImporting(true);

    try {
      const res = await fetch("/api/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: parsed, filename: file?.name, clearExisting }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setImportResult({ success: data.imported, failed: data.failed });
      toast({ title: `Imported ${data.imported} posts${data.resourcesCreated ? `, ${data.resourcesCreated} resources linked` : ""}` });
      // Clear preview after successful import
      setParsed([]);
      setFile(null);
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `warehouse-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export downloaded" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Tabs defaultValue="import">
      <TabsList>
        <TabsTrigger value="import">Import</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
        <TabsTrigger value="templates">Sample Templates</TabsTrigger>
      </TabsList>

      {/* IMPORT TAB */}
      <TabsContent value="import" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Supported formats: HTML (.html), JSON (.json), Markdown (.md)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-sm text-muted-foreground hover:bg-accent/50">
                <Upload className="h-5 w-5" />
                {file ? file.name : "Choose a file (.html, .json, .md)"}
                <input
                  type="file"
                  accept=".html,.htm,.json,.md"
                  className="hidden"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setParsed([]);
                    setImportResult(null);
                  }}
                />
              </label>
            </div>
            <Button onClick={handleParse} disabled={!file || parsing}>
              {parsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Parse File
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsed.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview ({parsed.length} records)</CardTitle>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-destructive">Clear existing</span>
                </label>
                <Button onClick={handleImport} disabled={importing} size="sm">
                  {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Import All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Publish Date</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Resource</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.map((post, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>{post.category || "—"}</TableCell>
                        <TableCell>{post.status || "draft"}</TableCell>
                        <TableCell>{post.publish_date || "—"}</TableCell>
                        <TableCell>{post.goal || "—"}</TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                          {post.resource_url || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {importResult && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              {importResult.failed === 0 ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              )}
              <span className="text-sm">
                Imported {importResult.success} records.
                {importResult.failed > 0 && ` ${importResult.failed} failed.`}
              </span>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* EXPORT TAB */}
      <TabsContent value="export" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Full Backup</CardTitle>
            <CardDescription>
              Export all posts, resources, projects, tags, and media records as a JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download JSON Export
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TEMPLATES TAB */}
      <TabsContent value="templates" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Sample Templates</CardTitle>
            <CardDescription>
              Download sample files to see the expected format for each file type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm font-medium">sample-import.html</p>
                  <p className="text-xs text-muted-foreground">HTML table format — one row per post</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSample(SAMPLE_HTML, "sample-import.html")}
              >
                <Download className="mr-1 h-3 w-3" /> Download
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium">sample-import.json</p>
                  <p className="text-xs text-muted-foreground">JSON array — each object is a post</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSample(SAMPLE_JSON, "sample-import.json")}
              >
                <Download className="mr-1 h-3 w-3" /> Download
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium">sample-import.md</p>
                  <p className="text-xs text-muted-foreground">Markdown — each heading becomes a post title</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSample(SAMPLE_MD, "sample-import.md")}
              >
                <Download className="mr-1 h-3 w-3" /> Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
