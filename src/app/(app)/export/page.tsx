import { ExportSection } from "../analytics/export-section";

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export & AI</h1>
        <p className="text-muted-foreground">
          Export your analytics data and generate AI prompts for content strategy analysis.
        </p>
      </div>

      <ExportSection />
    </div>
  );
}
