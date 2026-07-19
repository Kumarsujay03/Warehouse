"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  Check,
  FileJson,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function ExportSection() {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function exportJSON() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/export?format=json");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();

      // Download as file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Show AI prompt
      setPrompt(data.ai_prompt);
      toast({ title: "Exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/export?format=csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadPromptOnly() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/export?format=json");
      if (!res.ok) throw new Error("Failed to generate prompt");
      const data = await res.json();
      setPrompt(data.ai_prompt);
    } catch {
      toast({ title: "Failed to generate prompt", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function copyPrompt() {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Prompt copied to clipboard" });
  }

  return (
    <div className="space-y-4">
      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export your published posts with all engagement data. Use the JSON export to feed into any AI
            for deeper analysis, or CSV for spreadsheets.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportJSON} disabled={loading} variant="default">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="mr-2 h-4 w-4" />
              )}
              Export JSON + AI Prompt
            </Button>
            <Button onClick={exportCSV} disabled={loading} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={loadPromptOnly} disabled={loading} variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Prompt Display */}
      {prompt && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Analysis Prompt
            </CardTitle>
            <Button size="sm" variant="outline" onClick={copyPrompt}>
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy Prompt"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Copy this prompt and paste it into ChatGPT, Claude, or any AI to get a full content strategy analysis based on your real data.
            </p>
            <div className="max-h-[400px] overflow-y-auto rounded-lg bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
                {prompt}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Tips */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-medium">How to use:</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-bold text-foreground">1.</span>
              Click &quot;Export JSON + AI Prompt&quot; to download your data and generate the prompt.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-foreground">2.</span>
              Copy the AI prompt using the button above.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-foreground">3.</span>
              Paste into ChatGPT, Claude, or Gemini. Optionally attach the JSON file for extra context.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-foreground">4.</span>
              Get personalized suggestions on titles, hooks, timing, categories, and growth strategy.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
