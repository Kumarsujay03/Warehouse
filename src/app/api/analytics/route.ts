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

  // --- Growth data (monthly aggregation, published only) ---
  const monthlyGrowth: Record<string, { month: string; posts: number; likes: number; comments: number; impressions: number }> = {};
  for (const post of publishedPosts) {
    const date = post.publish_date || post.created_at;
    const month = date.slice(0, 7); // YYYY-MM
    if (!monthlyGrowth[month]) {
      monthlyGrowth[month] = { month, posts: 0, likes: 0, comments: 0, impressions: 0 };
    }
    monthlyGrowth[month].posts += 1;
    monthlyGrowth[month].likes += post.likes_count || 0;
    monthlyGrowth[month].comments += post.comments_count || 0;
    monthlyGrowth[month].impressions += post.impressions_count || 0;
  }
  const growthData = Object.values(monthlyGrowth).sort((a, b) => a.month.localeCompare(b.month));

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

  // Streak calculation
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  if (publishedWithDates.length > 0) {
    const uniqueDays = [...new Set(publishedWithDates.map((d) => d.toISOString().slice(0, 10)))].sort();
    
    // Current streak (counting back from today)
    const today = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
    let checkDate = uniqueDays.includes(today) ? today : yesterday;
    
    if (uniqueDays.includes(checkDate)) {
      currentStreak = 1;
      let d = new Date(checkDate);
      while (true) {
        d = new Date(d.getTime() - 86400000);
        const dStr = d.toISOString().slice(0, 10);
        if (uniqueDays.includes(dStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Longest streak
    tempStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Gaps (periods with no posts > 7 days)
  const gaps: { start: string; end: string; days: number }[] = [];
  if (publishedWithDates.length > 1) {
    for (let i = 1; i < publishedWithDates.length; i++) {
      const diffDays = Math.round(
        (publishedWithDates[i].getTime() - publishedWithDates[i - 1].getTime()) / 86400000
      );
      if (diffDays > 7) {
        gaps.push({
          start: publishedWithDates[i - 1].toISOString().slice(0, 10),
          end: publishedWithDates[i].toISOString().slice(0, 10),
          days: diffDays,
        });
      }
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
      bestDay: dayNames[bestDayIndex],
      bestHour: `${bestHour.toString().padStart(2, "0")}:00`,
      dayOfWeekCounts,
      gaps: gaps.sort((a, b) => b.days - a.days).slice(0, 5),
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
