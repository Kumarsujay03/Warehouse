import { CloudView } from "./cloud-view";

export default function CloudPage() {
  return (
    <div className="space-y-6 liquid-glow">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Cloud</h1>
        <p className="text-muted-foreground">Upload, preview, and manage media files via Cloudinary.</p>
      </div>
      <CloudView />
    </div>
  );
}
