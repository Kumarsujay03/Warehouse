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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GrowthDataPoint {
  month: string;
  posts: number;
  likes: number;
  comments: number;
  impressions: number;
}

export function GrowthChart({ data }: { data: GrowthDataPoint[] }) {
  // Format month labels (YYYY-MM → Mon YY)
  const formatted = data.map((d) => {
    const [year, month] = d.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      ...d,
      label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      engagement: d.likes + d.comments,
      engRate: d.impressions > 0
        ? Math.round(((d.likes + d.comments) / d.impressions) * 1000) / 10
        : 0,
    };
  });

  if (formatted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Growth Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No data yet. Start publishing posts to see your growth.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const totalImpressions = data.reduce((s, d) => s + d.impressions, 0);
  const totalEngagement = data.reduce((s, d) => s + d.likes + d.comments, 0);
  const totalPosts = data.reduce((s, d) => s + d.posts, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Growth Over Time</CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{totalPosts}</span> posts
          </span>
          <span>
            <span className="font-semibold text-foreground">{totalImpressions.toLocaleString()}</span> impressions
          </span>
          <span>
            <span className="font-semibold text-foreground">{totalEngagement.toLocaleString()}</span> engagements
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                formatter={(value, name) => {
                  if (name === "Eng. Rate") return [`${value}%`, name];
                  return [Number(value).toLocaleString(), name];
                }}
              />
              <Legend />
              {/* Bars for volume metrics */}
              <Bar
                yAxisId="left"
                dataKey="impressions"
                name="Impressions"
                fill="#34d399"
                fillOpacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="likes"
                name="Likes"
                fill="#f472b6"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="comments"
                name="Comments"
                fill="#60a5fa"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              {/* Line for engagement rate trend */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engRate"
                name="Eng. Rate"
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
