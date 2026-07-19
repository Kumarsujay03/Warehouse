"use client";

import { useEffect, useState, useCallback } from "react";
import { GrowthChart } from "./growth-chart";
import { ContributionCalendar } from "./contribution-calendar";
import { PostingConsistency } from "./posting-consistency";
import { EngagementMetrics } from "./engagement-metrics";
import { EngagementEditor } from "./engagement-editor";
import { ScheduleSection } from "./schedule-section";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  TrendingUp,
  Target,
  Pencil,
  CalendarClock,
  Eye,
  Heart,
  MessageCircle,
  Percent,
} from "lucide-react";

interface AnalyticsData {
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalImpressions: number;
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
    engagementRate: number;
    topPosts: {
      id: string;
      title: string;
      likes: number;
      comments: number;
      impressions: number;
      category: string | null;
      publish_date: string;
    }[];
  };
  growth: {
    date: string;
    title: string;
    postNumber: number;
    likes: number;
    comments: number;
    impressions: number;
    cumulativeLikes: number;
    cumulativeComments: number;
    cumulativeImpressions: number;
    cumulativeEngRate: number;
  }[];
  calendar: Record<string, number>;
  consistency: {
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
  };
  posts: {
    id: string;
    title: string;
    category: string | null;
    publish_date: string;
    likes_count: number;
    comments_count: number;
    impressions_count: number;
    engagement_updated_at: string | null;
  }[];
}

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "consistency", label: "Consistency", icon: Target },
  { id: "schedule", label: "Schedule", icon: CalendarClock },
  { id: "manage", label: "Manage Data", icon: Pencil },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-10 w-10 rounded-xl bg-white/[0.05] animate-pulse-glow flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load analytics data. {error}
      </div>
    );
  }

  const totalEngagement = data.engagement.totalLikes + data.engagement.totalComments;

  return (
    <div className="space-y-6">
      {/* Hero Metrics — Always visible at the top */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 stagger-children">
        <Card className="glass-card bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
              <Eye className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Impressions</p>
              <p className="text-2xl font-bold">{data.engagement.totalImpressions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-gradient-to-br from-pink-500/5 to-transparent">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Engagement</p>
              <p className="text-2xl font-bold">{totalEngagement.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">
                {data.engagement.totalLikes} likes · {data.engagement.totalComments} comments
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
              <Percent className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Eng. Rate</p>
              <p className="text-2xl font-bold">{data.engagement.engagementRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
              <MessageCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{data.consistency.totalPublished}</p>
              <p className="text-[10px] text-muted-foreground">
                every ~{data.consistency.avgFrequency || "—"} days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl glass-card p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white/10 text-foreground shadow-sm backdrop-blur-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div key={activeTab} className="min-h-[300px] animate-fade-in">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <EngagementMetrics data={data.engagement} />
            <ContributionCalendar data={data.calendar} />
          </div>
        )}

        {activeTab === "consistency" && (
          <PostingConsistency
            data={data.consistency}
            appliedSuggestions={appliedSuggestions}
            onApplied={(idx) => setAppliedSuggestions((prev) => new Set(prev).add(idx))}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleSection />
        )}

        {activeTab === "manage" && (
          <EngagementEditor
            posts={data.posts || []}
            onSaved={() => fetchAnalytics()}
          />
        )}
      </div>

      {/* Growth Chart — Below tabs for context */}
      <GrowthChart data={data.growth} />
    </div>
  );
}
