"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function ParentLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const schoolCode = params.schoolCode as string;

  useEffect(() => {
    // Auto-fill credentials from query params if present
    const phoneParam = searchParams.get("phone");
    const passwordParam = searchParams.get("password");
    
    if (phoneParam) {
      setPhone(phoneParam);
    }
    if (passwordParam) {
      setPassword(passwordParam);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/schools/${schoolCode}/parents/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // On successful login, redirect to the parent's specific dashboard page
        router.replace(`/schools/${schoolCode}/parent/${data.parentId}`);
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
        toast({ title: "Login Failed", description: data.error || "Invalid credentials.", variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl bg-white/95 p-8 flex flex-col items-center">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold text-blue-800 mb-2 text-center">Parent Login</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="tel"
              placeholder="Your Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password or Temporary Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 