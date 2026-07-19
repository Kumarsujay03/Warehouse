import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

// GET: Fetch draft/scheduled posts that can be rescheduled
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServiceRoleClient();

  // Get drafts and scheduled posts
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, status, publish_date, created_at")
    .in("status", ["draft", "ready", "scheduled"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get best day/time from published posts
  const { data: published } = await supabase
    .from("posts")
    .select("publish_date, created_at")
    .eq("status", "published");

  const publishedPosts = published || [];

  // Calculate best day and hour
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  const hourCounts = new Array(24).fill(0);
  for (const p of publishedPosts) {
    const date = new Date(p.publish_date || p.created_at);
    dayOfWeekCounts[date.getDay()] += 1;
    hourCounts[date.getHours()] += 1;
  }

  const bestDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const bestHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Calculate avg frequency
  let avgFrequency = 3; // default
  if (publishedPosts.length > 1) {
    const dates = publishedPosts
      .map((p) => new Date(p.publish_date || p.created_at).getTime())
      .sort((a, b) => a - b);
    const totalSpan = (dates[dates.length - 1] - dates[0]) / 86400000;
    avgFrequency = Math.round((totalSpan / (dates.length - 1)) * 10) / 10;
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return NextResponse.json({
    posts: posts || [],
    suggestion: {
      bestDay: dayNames[bestDayIndex],
      bestDayIndex,
      bestHour,
      avgFrequency,
    },
  });
}

// PUT: Apply optimal schedule to selected posts
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { postIds, mode } = body as {
    postIds: string[];
    mode: "apply_best" | "auto_distribute";
  };

  if (!postIds || postIds.length === 0) {
    return NextResponse.json({ error: "No posts selected" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Get best day/time from published posts
  const { data: published } = await supabase
    .from("posts")
    .select("publish_date, created_at")
    .eq("status", "published");

  const publishedPosts = published || [];

  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  const hourCounts = new Array(24).fill(0);
  for (const p of publishedPosts) {
    const date = new Date(p.publish_date || p.created_at);
    dayOfWeekCounts[date.getDay()] += 1;
    hourCounts[date.getHours()] += 1;
  }

  const bestDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const bestHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Calculate avg frequency
  let avgFrequency = 3;
  if (publishedPosts.length > 1) {
    const dates = publishedPosts
      .map((p) => new Date(p.publish_date || p.created_at).getTime())
      .sort((a, b) => a - b);
    const totalSpan = (dates[dates.length - 1] - dates[0]) / 86400000;
    avgFrequency = Math.max(Math.round(totalSpan / (dates.length - 1)), 1);
  }

  const now = new Date();
  const errors: string[] = [];
  const scheduled: { id: string; date: string }[] = [];

  if (mode === "apply_best") {
    // Apply next best day/time from today
    for (let i = 0; i < postIds.length; i++) {
      const targetDate = getNextDayOfWeek(now, bestDayIndex, i * avgFrequency);
      targetDate.setHours(bestHour, 0, 0, 0);

      const { error } = await supabase
        .from("posts")
        .update({
          publish_date: targetDate.toISOString(),
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", postIds[i]);

      if (error) {
        errors.push(`${postIds[i]}: ${error.message}`);
      } else {
        scheduled.push({ id: postIds[i], date: targetDate.toISOString() });
      }
    }
  } else if (mode === "auto_distribute") {
    // Distribute posts evenly using avg frequency, starting from last published post or today
    const { data: lastPublished } = await supabase
      .from("posts")
      .select("publish_date, created_at")
      .eq("status", "published")
      .order("publish_date", { ascending: false })
      .limit(1);

    let startDate = now;
    if (lastPublished && lastPublished.length > 0) {
      const lastDate = new Date(lastPublished[0].publish_date || lastPublished[0].created_at);
      const nextFromLast = new Date(lastDate.getTime() + avgFrequency * 86400000);
      startDate = nextFromLast > now ? nextFromLast : now;
    }

    for (let i = 0; i < postIds.length; i++) {
      const targetDate = new Date(startDate.getTime() + i * avgFrequency * 86400000);
      targetDate.setHours(bestHour, 0, 0, 0);

      const { error } = await supabase
        .from("posts")
        .update({
          publish_date: targetDate.toISOString(),
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", postIds[i]);

      if (error) {
        errors.push(`${postIds[i]}: ${error.message}`);
      } else {
        scheduled.push({ id: postIds[i], date: targetDate.toISOString() });
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Some updates failed", details: errors, scheduled }, { status: 207 });
  }

  return NextResponse.json({ success: true, scheduled });
}

function getNextDayOfWeek(from: Date, targetDay: number, offsetDays: number): Date {
  const date = new Date(from.getTime() + offsetDays * 86400000);
  const currentDay = date.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
  return new Date(date.getTime() + daysUntilTarget * 86400000);
}
