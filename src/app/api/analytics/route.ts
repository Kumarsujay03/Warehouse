import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServiceRoleClient();

  // Fetch all posts with engagement and dates
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, category, status, publish_date, likes_count, comments_count, impressions_count, engagement_updated_at, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allPosts = posts || [];
  const publishedPosts = allPosts.filter((p) => p.status === "published");

  // --- Engagement metrics (published only) ---
  const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalComments = publishedPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const totalImpressions = publishedPosts.reduce((sum, p) => sum + (p.impressions_count || 0), 0);
  const avgLikesPerPost = publishedPosts.length > 0
    ? Math.round((totalLikes / publishedPosts.length) * 10) / 10
    : 0;
  const avgCommentsPerPost = publishedPosts.length > 0
    ? Math.round((totalComments / publishedPosts.length) * 10) / 10
    : 0;
  const engagementRate = totalImpressions > 0
    ? Math.round(((totalLikes + totalComments) / totalImpressions) * 1000) / 10
    : 0;

  // Top performing posts by engagement (published only)
  const topPosts = [...publishedPosts]
    .sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      likes: p.likes_count || 0,
      comments: p.comments_count || 0,
      impressions: p.impressions_count || 0,
      category: p.category,
      publish_date: p.publish_date || p.created_at,
    }));

  // --- Growth data (per-post timeline, published only) ---
  // Each post is a data point on the timeline with cumulative totals
  const sortedPublished = [...publishedPosts].sort((a, b) => {
    const dateA = a.publish_date || a.created_at;
    const dateB = b.publish_date || b.created_at;
    return dateA.localeCompare(dateB);
  });

  let cumulativeLikes = 0;
  let cumulativeComments = 0;
  let cumulativeImpressions = 0;

  const growthData = sortedPublished.map((post, index) => {
    cumulativeLikes += post.likes_count || 0;
    cumulativeComments += post.comments_count || 0;
    cumulativeImpressions += post.impressions_count || 0;
    const engRate = cumulativeImpressions > 0
      ? Math.round(((cumulativeLikes + cumulativeComments) / cumulativeImpressions) * 1000) / 10
      : 0;

    return {
      date: (post.publish_date || post.created_at).slice(0, 10),
      title: post.title,
      postNumber: index + 1,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      impressions: post.impressions_count || 0,
      cumulativeLikes,
      cumulativeComments,
      cumulativeImpressions,
      cumulativeEngRate: engRate,
    };
  });

  // --- Contribution calendar (daily activity for past year, published only) ---
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const dailyActivity: Record<string, number> = {};

  for (const post of publishedPosts) {
    const date = post.publish_date || post.created_at;
    const day = date.slice(0, 10); // YYYY-MM-DD
    const postDate = new Date(day);
    if (postDate >= oneYearAgo && postDate <= now) {
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    }
  }

  // --- Posting consistency (published only) ---
  const publishedWithDates = publishedPosts
    .filter((p) => p.publish_date || p.created_at)
    .map((p) => new Date(p.publish_date || p.created_at))
    .sort((a, b) => a.getTime() - b.getTime());

  // Day of week distribution (0=Sun, 6=Sat)
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  const hourCounts = new Array(24).fill(0);
  for (const date of publishedWithDates) {
    dayOfWeekCounts[date.getDay()] += 1;
    hourCounts[date.getHours()] += 1;
  }

  // Calculate average posting frequency (days between posts)
  let avgFrequency = 0;
  if (publishedWithDates.length > 1) {
    const totalSpan = (publishedWithDates[publishedWithDates.length - 1].getTime() - publishedWithDates[0].getTime()) / 86400000;
    avgFrequency = Math.round((totalSpan / (publishedWithDates.length - 1)) * 10) / 10;
  }

  // Rhythm-based streak: count consecutive posts within tolerance of avg frequency
  // Tolerance = avg frequency + 2 days (grace period)
  let currentStreak = 0;
  let longestStreak = 0;

  if (publishedWithDates.length > 0) {
    const tolerance = Math.max(avgFrequency + 2, 4); // at least 4 days tolerance

    // Current streak: count back from most recent post
    const lastPostDate = publishedWithDates[publishedWithDates.length - 1];
    const daysSinceLastPost = Math.round((now.getTime() - lastPostDate.getTime()) / 86400000);

    if (daysSinceLastPost <= tolerance) {
      currentStreak = 1;
      for (let i = publishedWithDates.length - 2; i >= 0; i--) {
        const gap = Math.round(
          (publishedWithDates[i + 1].getTime() - publishedWithDates[i].getTime()) / 86400000
        );
        if (gap <= tolerance) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Longest streak with same tolerance
    let tempStreak = 1;
    for (let i = 1; i < publishedWithDates.length; i++) {
      const gap = Math.round(
        (publishedWithDates[i].getTime() - publishedWithDates[i - 1].getTime()) / 86400000
      );
      if (gap <= tolerance) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Gaps (periods with no posts significantly longer than average frequency)
  const gapThreshold = Math.max(avgFrequency * 2, 7); // 2x your normal frequency or 7 days
  const gaps: { start: string; end: string; days: number }[] = [];
  if (publishedWithDates.length > 1) {
    for (let i = 1; i < publishedWithDates.length; i++) {
      const diffDays = Math.round(
        (publishedWithDates[i].getTime() - publishedWithDates[i - 1].getTime()) / 86400000
      );
      if (diffDays > gapThreshold) {
        gaps.push({
          start: publishedWithDates[i - 1].toISOString().slice(0, 10),
          end: publishedWithDates[i].toISOString().slice(0, 10),
          days: diffDays,
        });
      }
    }
  }

  // Smart suggestions
  const suggestions: string[] = [];
  const lastPostDate = publishedWithDates.length > 0
    ? publishedWithDates[publishedWithDates.length - 1]
    : null;
  const daysSinceLastPost = lastPostDate
    ? Math.round((now.getTime() - lastPostDate.getTime()) / 86400000)
    : 0;

  if (publishedWithDates.length < 2) {
    suggestions.push("Keep publishing! Need at least 2 posts to analyze your rhythm.");
  } else {
    // Next post suggestion
    if (lastPostDate) {
      const nextPostDate = new Date(lastPostDate.getTime() + avgFrequency * 86400000);
      const nextPostDay = nextPostDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      if (nextPostDate > now) {
        suggestions.push(`Next post suggested: ${nextPostDay} (in ${Math.ceil((nextPostDate.getTime() - now.getTime()) / 86400000)} days)`);
      } else {
        const overdue = daysSinceLastPost - Math.round(avgFrequency);
        suggestions.push(`You're ${overdue} day${overdue > 1 ? "s" : ""} overdue! Post today to maintain your rhythm.`);
      }
    }

    // Frequency insight
    if (avgFrequency <= 1) {
      suggestions.push("You're posting daily — great consistency!");
    } else if (avgFrequency <= 3) {
      suggestions.push(`Your rhythm: every ~${Math.round(avgFrequency)} days. This is solid for engagement.`);
    } else if (avgFrequency <= 7) {
      suggestions.push(`Your rhythm: ~${Math.round(avgFrequency)} days between posts. Consider posting every 2-3 days for better growth.`);
    } else {
      suggestions.push(`You post about every ${Math.round(avgFrequency)} days. Try reducing to 3-4 day gaps for better audience retention.`);
    }

    // Best day suggestion
    const dayNames2 = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const topDays = dayOfWeekCounts
      .map((count, i) => ({ day: dayNames2[i], count }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
    if (topDays.length > 0) {
      const bestDays = topDays.slice(0, 2).map((d) => d.day).join(" & ");
      suggestions.push(`Your best performing days: ${bestDays}. Stick to these for consistency.`);
    }
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const bestDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const bestHour = hourCounts.indexOf(Math.max(...hourCounts));

  return NextResponse.json({
    engagement: {
      totalLikes,
      totalComments,
      totalImpressions,
      avgLikesPerPost,
      avgCommentsPerPost,
      engagementRate,
      topPosts,
    },
    growth: growthData,
    calendar: dailyActivity,
    consistency: {
      currentStreak,
      longestStreak,
      avgFrequency,
      daysSinceLastPost,
      bestDay: dayNames[bestDayIndex],
      bestHour: `${bestHour.toString().padStart(2, "0")}:00`,
      dayOfWeekCounts,
      gaps: gaps.sort((a, b) => b.days - a.days).slice(0, 5),
      suggestions,
      totalPublished: publishedWithDates.length,
    },
    posts: allPosts
      .filter((p) => p.status === "published")
      .map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        publish_date: p.publish_date || p.created_at,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        impressions_count: p.impressions_count || 0,
        engagement_updated_at: p.engagement_updated_at || null,
      })),
  });
}
