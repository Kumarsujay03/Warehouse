import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json"; // json or csv

  const supabase = await createServiceRoleClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, category, status, publish_date, likes_count, comments_count, impressions_count, engagement_updated_at, hook, goal, created_at")
    .eq("status", "published")
    .order("publish_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publishedPosts = posts || [];

  // Compute per-post engagement rate
  const exportData = publishedPosts.map((post, index) => {
    const engagement = (post.likes_count || 0) + (post.comments_count || 0);
    const impressions = post.impressions_count || 0;
    const engRate = impressions > 0 ? Math.round((engagement / impressions) * 1000) / 10 : 0;

    return {
      post_number: index + 1,
      title: post.title,
      category: post.category || "Uncategorized",
      publish_date: post.publish_date || post.created_at,
      hook: post.hook || "",
      goal: post.goal || "",
      impressions: impressions,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      total_engagement: engagement,
      engagement_rate_percent: engRate,
      data_last_updated: post.engagement_updated_at || "Never",
    };
  });

  // Summary stats
  const totalImpressions = exportData.reduce((s, p) => s + p.impressions, 0);
  const totalLikes = exportData.reduce((s, p) => s + p.likes, 0);
  const totalComments = exportData.reduce((s, p) => s + p.comments, 0);
  const totalEngagement = totalLikes + totalComments;
  const overallEngRate = totalImpressions > 0
    ? Math.round((totalEngagement / totalImpressions) * 1000) / 10
    : 0;

  // Posting frequency
  let avgFrequency = 0;
  if (exportData.length > 1) {
    const dates = exportData.map((p) => new Date(p.publish_date).getTime());
    const totalSpan = (dates[dates.length - 1] - dates[0]) / 86400000;
    avgFrequency = Math.round((totalSpan / (dates.length - 1)) * 10) / 10;
  }

  // Best day/time
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  const hourCounts = new Array(24).fill(0);
  for (const post of exportData) {
    const date = new Date(post.publish_date);
    dayOfWeekCounts[date.getDay()] += 1;
    hourCounts[date.getHours()] += 1;
  }
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const bestDay = dayNames[dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))];
  const bestHour = hourCounts.indexOf(Math.max(...hourCounts));

  const summary = {
    total_posts: exportData.length,
    total_impressions: totalImpressions,
    total_likes: totalLikes,
    total_comments: totalComments,
    total_engagement: totalEngagement,
    overall_engagement_rate_percent: overallEngRate,
    avg_posting_frequency_days: avgFrequency,
    best_day: bestDay,
    best_time: `${bestHour.toString().padStart(2, "0")}:00`,
    date_range: exportData.length > 0
      ? `${exportData[0].publish_date.slice(0, 10)} to ${exportData[exportData.length - 1].publish_date.slice(0, 10)}`
      : "No data",
    exported_at: new Date().toISOString(),
  };

  if (format === "csv") {
    // Generate CSV
    const headers = [
      "Post #", "Title", "Category", "Publish Date", "Hook", "Goal",
      "Impressions", "Likes", "Comments", "Total Engagement", "Engagement Rate %", "Data Last Updated"
    ];
    const rows = exportData.map((p) => [
      p.post_number,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.publish_date.slice(0, 10),
      `"${p.hook.replace(/"/g, '""')}"`,
      `"${p.goal.replace(/"/g, '""')}"`,
      p.impressions,
      p.likes,
      p.comments,
      p.total_engagement,
      p.engagement_rate_percent,
      p.data_last_updated === "Never" ? "Never" : p.data_last_updated.slice(0, 10),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON format with AI-ready structure
  return NextResponse.json({
    summary,
    posts: exportData,
    ai_prompt: generateAIPrompt(summary, exportData),
  });
}

function generateAIPrompt(
  summary: Record<string, unknown>,
  posts: { post_number: number; title: string; category: string; publish_date: string; hook: string; impressions: number; likes: number; comments: number; engagement_rate_percent: number }[]
): string {
  return `You are a content strategy analyst. Analyze the following content performance data and provide actionable insights.

## My Content Summary:
- Total published posts: ${summary.total_posts}
- Date range: ${summary.date_range}
- Total impressions: ${summary.total_impressions}
- Total engagement (likes + comments): ${summary.total_engagement}
- Overall engagement rate: ${summary.overall_engagement_rate_percent}%
- Average posting frequency: every ${summary.avg_posting_frequency_days} days
- Best performing day: ${summary.best_day}
- Best posting time: ${summary.best_time}

## Per-Post Performance Data:
${posts.map((p) => `#${p.post_number} | "${p.title}" | ${p.category} | Published: ${p.publish_date.slice(0, 10)} | Impressions: ${p.impressions} | Likes: ${p.likes} | Comments: ${p.comments} | Eng Rate: ${p.engagement_rate_percent}%${p.hook ? ` | Hook: "${p.hook}"` : ""}`).join("\n")}

## Please analyze and provide:
1. **Content Performance**: Which posts performed best and why? What patterns do you see in high-performing content?
2. **Timing Optimization**: Based on my data, when should I post for maximum engagement? Should I change my frequency?
3. **Content Suggestions**: Based on my best-performing categories and hooks, what topics/angles should I explore next?
4. **Hook Analysis**: Which hooks drove the most engagement? Suggest 5 new hook styles based on what works.
5. **Growth Strategy**: What should I change about my content strategy to improve engagement rate from ${summary.overall_engagement_rate_percent}%?
6. **Posting Schedule**: Suggest an optimal weekly posting schedule based on my data.
7. **Title Improvements**: For my lowest-performing posts, suggest alternative titles that might perform better.

Be specific and reference my actual data. Give me concrete actions, not generic advice.`;
}
