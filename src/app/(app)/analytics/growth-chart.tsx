"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GrowthDataPoint {
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
}

export function GrowthChart({ data }: { data: GrowthDataPoint[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Growth Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No published posts yet. Start publishing to track your growth over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format for chart display
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "MMM d"),
    engagement: d.likes + d.comments,
  }));

  // Growth indicators
  const totalImpressions = data[data.length - 1]?.cumulativeImpressions || 0;
  const totalEngagement = (data[data.length - 1]?.cumulativeLikes || 0) + (data[data.length - 1]?.cumulativeComments || 0);
  const currentEngRate = data[data.length - 1]?.cumulativeEngRate || 0;

  // Trend: compare last post's metrics to average
  let trend: "up" | "down" | "flat" = "flat";
  if (data.length >= 2) {
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const lastEng = last.likes + last.comments;
    const prevEng = prev.likes + prev.comments;
    if (lastEng > prevEng) trend = "up";
    else if (lastEng < prevEng) trend = "down";
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-400" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Growth Timeline</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each bar = one post. Lines show cumulative growth from your first post to now.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="font-bold text-foreground">{totalImpressions.toLocaleString()}</p>
            <p className="text-muted-foreground">Total Reach</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">{totalEngagement.toLocaleString()}</p>
            <p className="text-muted-foreground">Engagements</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">{currentEngRate}%</p>
            <p className="text-muted-foreground">Eng. Rate</p>
          </div>
          <div className="flex items-center gap-1">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <span className={`text-xs font-medium ${trendColor}`}>
              {trend === "up" ? "Growing" : trend === "down" ? "Dipping" : "Steady"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                label={{ value: "Per Post", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--muted-foreground))", fontSize: 10 } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                label={{ value: "Cumulative", angle: 90, position: "insideRight", style: { fill: "hsl(var(--muted-foreground))", fontSize: 10 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const item = payload[0]?.payload;
                    return `#${item?.postNumber} — ${item?.title || label}`;
                  }
                  return label;
                }}
                formatter={(value, name) => {
                  if (name === "Eng. Rate %") return [`${value}%`, name];
                  return [Number(value).toLocaleString(), name];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />

              {/* Average line */}
              {data.length > 1 && (
                <ReferenceLine
                  yAxisId="left"
                  y={Math.round(totalImpressions / data.length)}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
              )}

              {/* Bars: per-post metrics */}
              <Bar
                yAxisId="left"
                dataKey="impressions"
                name="Impressions"
                fill="#34d399"
                fillOpacity={0.7}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="likes"
                name="Likes"
                fill="#f472b6"
                fillOpacity={0.8}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="comments"
                name="Comments"
                fill="#60a5fa"
                fillOpacity={0.8}
                radius={[3, 3, 0, 0]}
              />

              {/* Lines: cumulative growth */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeImpressions"
                name="Total Reach"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeEngRate"
                name="Eng. Rate %"
                stroke="#fbbf24"
                strokeWidth={2.5}
                dot={{ fill: "#fbbf24", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
