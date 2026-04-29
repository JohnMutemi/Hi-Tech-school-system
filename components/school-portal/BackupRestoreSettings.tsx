"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type BackupRecord = {
  id: string;
  status: string;
  triggerType: string;
  snapshotAt: string;
  sizeBytes: number | null;
};

type BackupSettings = {
  backupEnabled: boolean;
  backupScheduleTime: string | null;
  backupRetentionDays: number;
};

type ToastFn = (args: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

export default function BackupRestoreSettings({
  schoolCode,
  toast,
}: {
  schoolCode: string;
  toast: ToastFn;
}) {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    backupEnabled: true,
    backupScheduleTime: "02:00",
    backupRetentionDays: 30,
  });
  const [isBusy, setIsBusy] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    ok: boolean;
    provider: string;
    details: string;
  } | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/schools/${schoolCode}/backups`);
      if (!res.ok) throw new Error("Failed to load backups");
      const data = await res.json();
      setBackups(data.backups ?? []);
      if (data.settings) {
        setSettings({
          backupEnabled: data.settings.backupEnabled ?? true,
          backupScheduleTime: data.settings.backupScheduleTime ?? "02:00",
          backupRetentionDays: data.settings.backupRetentionDays ?? 30,
        });
      }
    } catch (error) {
      toast({
        title: "Backup settings unavailable",
        description: "Could not fetch backup data.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    load();
  }, [schoolCode]);

  useEffect(() => {
    const runInitialHealthCheck = async () => {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/backups/health`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Health check failed");
        setHealthStatus(data);
      } catch (error) {
        setHealthStatus({
          ok: false,
          provider: "unknown",
          details: error instanceof Error ? error.message : "Health check failed",
        });
      }
    };
    runInitialHealthCheck();
  }, [schoolCode]);

  const runBackupNow = async () => {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/backups`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Backup failed");
      await load();
      toast({ title: "Backup completed", description: "A new backup snapshot was created." });
    } catch {
      toast({ title: "Backup failed", description: "Could not create backup.", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  };

  const saveSettings = async () => {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/backups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "Backup settings saved" });
      await load();
    } catch {
      toast({
        title: "Could not save settings",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const restoreClone = async (backupId: string) => {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Restore failed");
      toast({
        title: "Restore completed as clone",
        description: `Created ${data.restoredSchool?.name} (${data.restoredSchool?.code}).`,
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "Could not restore this backup.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const checkStorageHealth = async () => {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/backups/health`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Health check failed");
      setHealthStatus(data);
      toast({
        title: data.ok ? "Backup storage healthy" : "Backup storage check failed",
        description: data.details,
        variant: data.ok ? "default" : "destructive",
      });
    } catch (error) {
      setHealthStatus({
        ok: false,
        provider: "unknown",
        details: error instanceof Error ? error.message : "Health check failed",
      });
      toast({
        title: "Backup storage check failed",
        description: error instanceof Error ? error.message : "Could not check backup storage.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Automatic backups</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.backupEnabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, backupEnabled: checked }))
                }
              />
              <span className="text-sm text-muted-foreground">
                {settings.backupEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup-time">Daily time (HH:MM)</Label>
            <Input
              id="backup-time"
              value={settings.backupScheduleTime ?? "02:00"}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, backupScheduleTime: e.target.value }))
              }
              className="w-36"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retention-days">Retention days</Label>
            <Input
              id="retention-days"
              type="number"
              min={1}
              max={365}
              value={settings.backupRetentionDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  backupRetentionDays: Number(e.target.value || 30),
                }))
              }
              className="w-28"
            />
          </div>
          <Button onClick={saveSettings} disabled={isBusy}>
            Save Backup Settings
          </Button>
          <Button variant="outline" onClick={runBackupNow} disabled={isBusy}>
            Backup Now
          </Button>
          <Button variant="outline" onClick={checkStorageHealth} disabled={isBusy}>
            Check Storage Health
          </Button>
        </div>

        {healthStatus && (
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium">
              Storage provider: {healthStatus.provider.toUpperCase()} -{" "}
              {healthStatus.ok ? "Healthy" : "Unhealthy"}
            </div>
            <div className="text-muted-foreground">{healthStatus.details}</div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Backup History</h4>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 text-left">Snapshot</th>
                  <th className="p-2 text-left">Trigger</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={5}>
                      No backups yet.
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.id} className="border-b">
                      <td className="p-2">{new Date(backup.snapshotAt).toLocaleString()}</td>
                      <td className="p-2">{backup.triggerType}</td>
                      <td className="p-2">{backup.status}</td>
                      <td className="p-2">
                        {backup.sizeBytes ? `${(backup.sizeBytes / 1024).toFixed(1)} KB` : "-"}
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={backup.status !== "completed" || isBusy}
                          onClick={() => restoreClone(backup.id)}
                        >
                          Restore as Clone
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
