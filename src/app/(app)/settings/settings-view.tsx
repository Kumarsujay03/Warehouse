"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Check, ChevronDown, ChevronRight, Loader2, Pencil, X } from "lucide-react";

interface SettingsViewProps {
  email: string;
}

interface Avatar {
  public_id: string;
  secure_url: string;
}

interface EnvStatus {
  supabase: boolean;
  cloudinary: boolean;
  environment: string;
}

export function SettingsView({ email }: SettingsViewProps) {
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/avatars")
      .then((r) => r.json())
      .then((d) => setAvatars(d.data || []))
      .catch(() => {})
      .finally(() => setAvatarsLoading(false));

    fetch("/api/settings/avatar")
      .then((r) => r.json())
      .then((d) => { if (d.avatar_url) setSelectedAvatar(d.avatar_url); })
      .catch(() => {});

    fetch("/api/settings/status")
      .then((r) => r.json())
      .then((d) => setEnvStatus(d))
      .catch(() => {});

    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((d) => { if (d.display_name) setDisplayName(d.display_name); })
      .catch(() => {});
  }, []);

  async function handleSaveName() {
    setSavingName(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (res.ok) {
        toast({ title: "Name updated" });
        setEditingName(false);
      } else {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveEmail() {
    if (!newEmail || !newEmail.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setSavingEmail(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      if (res.ok) {
        toast({ title: "Email updated" });
        setEditingEmail(false);
      } else {
        const data = await res.json();
        toast({ title: data.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast({ title: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      } else {
        const data = await res.json();
        toast({ title: data.error || "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAvatar(url: string) {
    setSelectedAvatar(url);
    try {
      const res = await fetch("/api/settings/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });
      if (res.ok) {
        toast({ title: "Avatar updated" });
      } else {
        toast({ title: "Failed to save avatar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name - inline editable */}
          <div className="space-y-2">
            <Label>Display Name</Label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name..."
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSaveName} disabled={savingName}>
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-400" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-sm">{displayName || "Not set"}</span>
                <button onClick={() => setEditingName(true)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Email - inline editable */}
          <div className="space-y-2">
            <Label>Email</Label>
            {editingEmail ? (
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEmail()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSaveEmail} disabled={savingEmail}>
                  {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-400" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setEditingEmail(false); setNewEmail(email); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-sm">{email}</span>
                <button onClick={() => setEditingEmail(true)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avatar Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Choose a profile picture from your Cloudinary avatars folder.</CardDescription>
        </CardHeader>
        <CardContent>
          {avatarsLoading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading avatars...</span>
            </div>
          ) : avatars.length === 0 ? (
            <p className="text-sm text-muted-foreground">No avatars found. Upload images to the &quot;avatars&quot; folder in Cloudinary.</p>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {avatars.map((avatar) => (
                <button
                  key={avatar.public_id}
                  onClick={() => handleSaveAvatar(avatar.secure_url)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedAvatar === avatar.secure_url
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img src={avatar.secure_url} alt={avatar.public_id} className="h-full w-full object-cover" />
                  {selectedAvatar === avatar.secure_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password - Collapsible */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowPasswordForm(!showPasswordForm)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password.</CardDescription>
            </div>
            {showPasswordForm ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          </div>
        </CardHeader>
        {showPasswordForm && (
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Environment */}
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Current deployment configuration (read-only).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <span className="text-sm font-medium">Supabase</span>
            <span className={`text-xs ${envStatus?.supabase ? "text-green-400" : "text-red-400"}`}>
              {envStatus?.supabase ? "Connected" : "Not configured"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <span className="text-sm font-medium">Cloudinary</span>
            <span className={`text-xs ${envStatus?.cloudinary ? "text-green-400" : "text-red-400"}`}>
              {envStatus?.cloudinary ? "Connected" : "Not configured"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <span className="text-sm font-medium">Environment</span>
            <span className="text-xs text-muted-foreground">
              {envStatus?.environment || "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
