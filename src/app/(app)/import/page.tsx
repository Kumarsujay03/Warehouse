import { ImportExportView } from "./import-export-view";
import { ExportSection } from "../analytics/export-section";

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import / Export</h1>
        <p className="text-muted-foreground">Import content from HTML, JSON, or Markdown. Export analytics data and generate AI prompts.</p>
      </div>
      <ImportExportView />

      {/* Analytics Export & AI Prompt */}
      <div className="border-t pt-6">
        <ExportSection />
      </div>
    </div>
  );
}
