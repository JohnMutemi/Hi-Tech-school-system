"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type FinanceFirstLoginPasswordDialogProps = {
  schoolCode: string;
};

export function FinanceFirstLoginPasswordDialog({ schoolCode }: FinanceFirstLoginPasswordDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters for your new password.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/schools/${schoolCode}/finance/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not update password");
      }
      toast({
        title: "Password updated",
        description: "Sign in again with your new password.",
      });
      router.replace(`/schools/${schoolCode}/finance/login?relogin=1`);
    } catch (err) {
      toast({
        title: "Could not save password",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-slate-200 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-800">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-center text-xl">Set your password</CardTitle>
          <CardDescription className="text-center">
            For security, finance-only access requires a personal password before you continue. After saving, you will
            return to the login screen and must sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="finance-cur-pw">Current password</Label>
              <Input
                id="finance-cur-pw"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finance-new-pw">New password</Label>
              <Input
                id="finance-new-pw"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finance-confirm-pw">Confirm new password</Label>
              <Input
                id="finance-confirm-pw"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save and continue to login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
