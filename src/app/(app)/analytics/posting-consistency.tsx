"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Flame,
  Trophy,
  Calendar,
  Clock,
  AlertTriangle,
  Lightbulb,
  Timer,
  TrendingUp,
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

export function PostingConsistency({ data }: { data: ConsistencyData }) {
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
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Smart Suggestions</span>
            </div>
            <ul className="space-y-1.5">
              {data.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
