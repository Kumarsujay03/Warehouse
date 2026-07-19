"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Loader2,
  Wand2,
  CalendarClock,
  Check,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface DraftPost {
  id: string;
  title: string;
  status: string;
  publish_date: string | null;
  created_at: string;
}

interface Suggestion {
  bestDay: string;
  bestDayIndex: number;
  bestHour: number;
  avgFrequency: number;
}

export function ScheduleSection() {
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scheduledResults, setScheduledResults] = useState<{ id: string; date: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/schedule");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setPosts(data.posts);
        setSuggestion(data.suggestion);
      } catch {
        toast({ title: "Failed to load posts", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  }

  async function applySchedule(mode: "apply_best" | "auto_distribute") {
    if (selected.size === 0) {
      toast({ title: "Select at least one post" });
      return;
    }

    setScheduling(true);
    try {
      const res = await fetch("/api/analytics/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: Array.from(selected), mode }),
      });

      if (!res.ok) throw new Error("Scheduling failed");
      const data = await res.json();
      setScheduledResults(data.scheduled || []);
      setSelected(new Set());
      toast({ title: `Scheduled ${data.scheduled?.length || 0} post(s)` });

      // Refresh post list
      const refreshRes = await fetch("/api/analytics/schedule");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setPosts(refreshData.posts);
      }
    } catch {
      toast({ title: "Failed to schedule", variant: "destructive" });
    } finally {
      setScheduling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Best Timing Suggestion */}
      {suggestion && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Optimal Posting Schedule</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                Best day: <span className="font-medium text-foreground">{suggestion.bestDay}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-purple-500" />
                Best time: <span className="font-medium text-foreground">{suggestion.bestHour.toString().padStart(2, "0")}:00</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-cyan-500" />
                Frequency: <span className="font-medium text-foreground">every ~{suggestion.avgFrequency} days</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft Posts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Schedule Drafts</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Select posts and apply your optimal schedule. Posts will be set to &quot;scheduled&quot; status.
            </p>
          </div>
          {posts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selected.size === posts.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="py-8 text-center">
              <CalendarClock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No drafts or scheduled posts found. Create some posts first!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => {
                const isSelected = selected.has(post.id);
                const scheduledResult = scheduledResults.find((r) => r.id === post.id);

                return (
                  <div
                    key={post.id}
                    onClick={() => toggleSelect(post.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 hover:bg-accent/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(post.id)}
                      className="h-4 w-4 shrink-0 rounded border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{post.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          post.status === "scheduled"
                            ? "bg-blue-500/10 text-blue-500"
                            : post.status === "ready"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}>
                          {post.status}
                        </span>
                        {post.publish_date && (
                          <span>
                            Currently: {format(new Date(post.publish_date), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>
                    {scheduledResult && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <Check className="h-3 w-3" />
                        {format(new Date(scheduledResult.date), "MMM d")}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          {posts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
              <Button
                onClick={() => applySchedule("apply_best")}
                disabled={scheduling || selected.size === 0}
              >
                {scheduling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Apply Best Day & Time
              </Button>
              <Button
                variant="outline"
                onClick={() => applySchedule("auto_distribute")}
                disabled={scheduling || selected.size === 0}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Auto-Distribute (Every ~{suggestion?.avgFrequency || 3} days)
              </Button>
              <p className="mt-1 w-full text-xs text-muted-foreground">
                {selected.size} post{selected.size !== 1 ? "s" : ""} selected.
                {selected.size > 0 && " Posts will be marked as 'scheduled' with the suggested publish dates."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
