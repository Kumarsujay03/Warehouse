import { CloudView } from "./cloud-view";
import { BackButton } from "@/components/back-button";

export default function CloudPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cloud</h1>
          <p className="text-muted-foreground">Upload, preview, and manage media files via Cloudinary.</p>
        </div>
      </div>
      <CloudView />
    </div>
  );
}
