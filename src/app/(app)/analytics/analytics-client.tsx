"use client";

import { useEffect, useState, useCallback } from "react";
import { GrowthChart } from "./growth-chart";
import { ContributionCalendar } from "./contribution-calendar";
import { PostingConsistency } from "./posting-consistency";
import { EngagementMetrics } from "./engagement-metrics";
import { EngagementEditor } from "./engagement-editor";
import { ScheduleSection } from "./schedule-section";
import { Loader2, TrendingUp, Activity, Calendar, Target, Pencil, CalendarClock } from "lucide-react";

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
  { id: "engagement", label: "Engagement", icon: Activity },
  { id: "activity", label: "Activity", icon: Calendar },
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading analytics...</p>
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

  return (
    <div className="space-y-6">
      {/* Hero: Growth Chart at the top */}
      <GrowthChart data={data.growth} />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <EngagementMetrics data={data.engagement} />
            <ContributionCalendar data={data.calendar} />
          </div>
        )}

        {activeTab === "engagement" && (
          <EngagementMetrics data={data.engagement} />
        )}

        {activeTab === "activity" && (
          <ContributionCalendar data={data.calendar} />
        )}

        {activeTab === "consistency" && (
          <PostingConsistency data={data.consistency} />
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
    </div>
  );
}
