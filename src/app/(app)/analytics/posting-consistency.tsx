"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Trophy,
  Calendar,
  Clock,
  AlertTriangle,
  Lightbulb,
  Timer,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface ConsistencyData {
  currentStreak: number;
  longestStreak: number;
  avgFrequency: number;
  daysSinceLastPost: number;
  bestDay: string;
  bestHour: string;
  dayOfWeekCounts: number[];
  gaps: { start: string; end: string; days: number }[];
  suggestions: string[];
  totalPublished: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PostingConsistency({
  data,
  appliedSuggestions,
  onApplied,
}: {
  data: ConsistencyData;
  appliedSuggestions: Set<number>;
  onApplied: (index: number) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const dayChartData = DAY_LABELS.map((day, i) => ({
    day,
    posts: data.dayOfWeekCounts[i],
  }));

  const maxDayCount = Math.max(...data.dayOfWeekCounts, 1);

  // Determine streak health
  const isOverdue = data.avgFrequency > 0 && data.daysSinceLastPost > data.avgFrequency + 2;
  const streakColor = isOverdue ? "text-yellow-500" : "text-orange-500";

  return (
    <div className="space-y-4">
      {/* Smart Suggestions */}
      {data.suggestions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Smart Suggestions</span>
              </div>
            </div>
            <div className="space-y-2">
              {data.suggestions.map((suggestion, i) => {
                // Determine if this suggestion is actionable
                const isScheduleRelated = suggestion.includes("overdue") || suggestion.includes("Next post") || suggestion.includes("Post today");
                const isFrequencyRelated = suggestion.includes("reducing") || suggestion.includes("Consider posting");
                const isApplied = appliedSuggestions.has(i);
                const isApplying = applyingIndex === i;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">{suggestion}</span>
                    </div>
                    {(isScheduleRelated || isFrequencyRelated) && (
                      <Button
                        size="sm"
                        variant={isApplied ? "ghost" : "secondary"}
                        className={`shrink-0 h-7 px-3 text-xs ${isApplied ? "text-green-500 pointer-events-none" : ""}`}
                        disabled={isApplying || isApplied}
                        onClick={async () => {
                          setApplyingIndex(i);
                          await new Promise((r) => setTimeout(r, 600));
                          setApplyingIndex(null);
                          onApplied(i);
                          if (isScheduleRelated) {
                            setTimeout(() => { window.location.href = "/posts/new"; }, 300);
                          }
                        }}
                      >
                        {isApplying ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isApplied ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Applied
                          </>
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It's Calculated */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/50"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              How are these calculated?
            </span>
            {showExplanation ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          {showExplanation && (
            <div className="border-t px-4 pb-4 pt-3">
              <div className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Streak</p>
                  <p>
                    Counts consecutive posts that maintain your rhythm. If your average gap is ~{data.avgFrequency || 3} days,
                    any gap under {Math.max((data.avgFrequency || 3) + 2, 4)} days (rhythm + 2 grace days) keeps the streak alive.
                    Unlike GitHub&apos;s daily streak, this respects your natural posting frequency.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Best Day</p>
                  <p>
                    The day of the week you&apos;ve published most frequently. Based on {data.totalPublished} published posts.
                    Your distribution: {DAY_LABELS.map((d, i) => data.dayOfWeekCounts[i] > 0 ? `${d}(${data.dayOfWeekCounts[i]})` : null).filter(Boolean).join(", ") || "No data yet"}.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Best Time</p>
                  <p>
                    The hour (UTC) when most of your posts were published. This is when your audience likely expects content.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Avg Frequency</p>
                  <p>
                    Total days between your first and last post, divided by number of intervals.
                    ({data.totalPublished} posts over the period = ~{data.avgFrequency || "—"} days between posts).
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Posting Gaps</p>
                  <p>
                    Periods longer than 2× your average frequency ({Math.round((data.avgFrequency || 3.5) * 2)} days).
                    These indicate breaks from your rhythm that may affect audience retention.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak & Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isOverdue ? "bg-yellow-500/10" : "bg-orange-500/10"}`}>
              <Flame className={`h-5 w-5 ${streakColor}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">
                {data.currentStreak}{" "}
                <span className="text-xs font-normal text-muted-foreground">posts</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
              <p className="text-2xl font-bold">
                {data.longestStreak}{" "}
                <span className="text-xs font-normal text-muted-foreground">posts</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <Timer className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Frequency</p>
              <p className="text-2xl font-bold">
                {data.avgFrequency || "—"}{" "}
                <span className="text-xs font-normal text-muted-foreground">days</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Best Day</p>
              <p className="text-xl font-bold">{data.bestDay}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Best Time</p>
              <p className="text-xl font-bold">{data.bestHour}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Post Status */}
      {data.daysSinceLastPost > 0 && (
        <Card className={isOverdue ? "border-yellow-500/30" : ""}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className={`h-5 w-5 ${isOverdue ? "text-yellow-500" : "text-green-500"}`} />
              <div>
                <p className="text-sm font-medium">
                  {isOverdue ? "Time to post!" : "On track"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last post was {data.daysSinceLastPost} day{data.daysSinceLastPost > 1 ? "s" : ""} ago
                  {data.avgFrequency > 0 && ` · Your rhythm: every ~${data.avgFrequency} days`}
                </p>
              </div>
            </div>
            {isOverdue && (
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
                {Math.round(data.daysSinceLastPost - data.avgFrequency)} days overdue
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Day of Week Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posts by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                    }}
                    formatter={(value) => [`${value} posts`, "Posts"]}
                  />
                  <Bar dataKey="posts" radius={[4, 4, 0, 0]}>
                    {dayChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.posts === maxDayCount
                            ? "hsl(var(--primary))"
                            : "hsl(var(--muted-foreground) / 0.3)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gaps Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Posting Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.gaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Flame className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium">No major gaps!</p>
                <p className="text-xs text-muted-foreground">
                  You&apos;ve been consistent with your posting rhythm.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.gaps.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md border border-border/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(gap.start).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        →{" "}
                        {new Date(gap.end).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                        {gap.days} days
                      </span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Gaps longer than {data.avgFrequency > 0 ? `${Math.round(data.avgFrequency * 2)} days` : "7 days"} (2x your rhythm).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
