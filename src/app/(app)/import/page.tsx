import { ImportExportView } from "./import-export-view";

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import / Export</h1>
        <p className="text-muted-foreground">Import content from HTML, JSON, or Markdown. Export as JSON.</p>
      </div>
      <ImportExportView />
    </div>
  );
}
