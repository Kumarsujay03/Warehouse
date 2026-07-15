"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, eachDayOfInterval, startOfWeek, subDays } from "date-fns";

interface ContributionCalendarProps {
  /** Map of "YYYY-MM-DD" → post count */
  data: Record<string, number>;
}

export function ContributionCalendar({ data }: ContributionCalendarProps) {
  const { weeks, months } = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 364); // 52 weeks
    const calStart = startOfWeek(startDate);

    const allDays = eachDayOfInterval({ start: calStart, end: today });

    // Group days into weeks (columns)
    const weeks: { day: Date; count: number }[][] = [];
    let currentWeek: { day: Date; count: number }[] = [];

    for (const day of allDays) {
      const key = format(day, "yyyy-MM-dd");
      const count = data[key] || 0;
      currentWeek.push({ day, count });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Month labels
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0].day;
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        months.push({
          label: format(firstDay, "MMM"),
          col: i,
        });
        lastMonth = month;
      }
    });

    return { weeks, months };
  }, [data]);

  const maxCount = Math.max(1, ...Object.values(data));

  function getIntensity(count: number): string {
    if (count === 0) return "bg-muted/40";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-green-900/60";
    if (ratio <= 0.5) return "bg-green-700/70";
    if (ratio <= 0.75) return "bg-green-500/80";
    return "bg-green-400";
  }

  const totalPosts = Object.values(data).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(data).filter((v) => v > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Posting Activity</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{totalPosts} posts in the last year</span>
            <span>{activeDays} active days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="mb-1 flex text-xs text-muted-foreground" style={{ paddingLeft: "28px" }}>
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute text-[10px]"
                style={{ position: "relative", left: `${m.col * 13}px`, width: "fit-content" }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pr-1 text-[10px] text-muted-foreground">
              <div className="h-[11px]"></div>
              <div className="h-[11px] leading-[11px]">Mon</div>
              <div className="h-[11px]"></div>
              <div className="h-[11px] leading-[11px]">Wed</div>
              <div className="h-[11px]"></div>
              <div className="h-[11px] leading-[11px]">Fri</div>
              <div className="h-[11px]"></div>
            </div>

            {/* Grid */}
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-[2px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[2px]">
                    {week.map(({ day, count }, di) => (
                      <Tooltip key={di}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-[11px] w-[11px] rounded-sm ${getIntensity(count)} transition-colors hover:ring-1 hover:ring-foreground/30`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">
                            {count} {count === 1 ? "post" : "posts"}
                          </p>
                          <p className="text-muted-foreground">
                            {format(day, "MMM d, yyyy")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="h-[11px] w-[11px] rounded-sm bg-muted/40" />
            <div className="h-[11px] w-[11px] rounded-sm bg-green-900/60" />
            <div className="h-[11px] w-[11px] rounded-sm bg-green-700/70" />
            <div className="h-[11px] w-[11px] rounded-sm bg-green-500/80" />
            <div className="h-[11px] w-[11px] rounded-sm bg-green-400" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
