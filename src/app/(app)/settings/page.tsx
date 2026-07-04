import { getSession } from "@/lib/auth/session";
import { SettingsView } from "./settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Profile, credentials, and environment configuration.
        </p>
      </div>
      <SettingsView email={session?.email || ""} />
    </div>
  );
}
