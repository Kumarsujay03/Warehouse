import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 liquid-glow">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your content performance and growth.
        </p>
      </div>

      {/* Everything is client-rendered for unified data */}
      <AnalyticsClient />
    </div>
  );
}
