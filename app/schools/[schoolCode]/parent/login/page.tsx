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
  const [autoFilled, setAutoFilled] = useState(false);
  
  
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const schoolCode = params.schoolCode as string;

  useEffect(() => {
    // Auto-fill credentials from query params if present
    const phoneParam = searchParams.get("phone");
    const passwordParam = searchParams.get("password");
    const emailParam = searchParams.get("email"); // Check if email is being passed instead
    
    console.log('Parent login auto-fill params:', { phoneParam, passwordParam, emailParam });
    console.log('All search params:', Object.fromEntries(searchParams.entries()));
    
    if (phoneParam) {
      console.log('Auto-filling phone number:', phoneParam);
      setPhone(phoneParam);
      setAutoFilled(true);
    } else if (emailParam) {
      console.log('WARNING: Email parameter found instead of phone:', emailParam);
      // Don't auto-fill email into phone field
    }
    if (passwordParam) {
      console.log('Auto-filling password');
      setPassword(passwordParam);
      setAutoFilled(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log('Parent login attempt:', { schoolCode, phone });

    try {
      const res = await fetch(`/api/schools/${schoolCode}/parents/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      console.log('Parent login response:', { status: res.status, data });

      if (res.ok) {
        console.log('Parent login successful, redirecting to:', `/schools/${schoolCode}/parent/${data.parentId}`);
        // On successful login, redirect to the parent's specific dashboard page
        router.replace(`/schools/${schoolCode}/parent/${data.parentId}`);
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
        toast({ title: "Login Failed", description: data.error || "Invalid credentials.", variant: "destructive" });
      }
    } catch (err) {
      console.error('Parent login error:', err);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background image */}
      <img
        src="/library-bg.jpg"
        alt="Library background"
        className="absolute inset-0 w-full h-full object-cover object-center"
        draggable={false}
      />
      {/* Login card, centered with glassmorphism */}
      <div className="relative z-10 flex items-center justify-center w-full min-h-screen">
        <Card className="w-full max-w-sm rounded-2xl shadow-2xl bg-white/80 backdrop-blur-md p-4 flex flex-col items-center">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-blue-800 mb-2 text-center">Parent Login</CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            {autoFilled && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <span className="text-green-600">✓</span>
                  <span>Credentials auto-filled for quick login</span>
                </div>
              </div>
            )}
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
    </div>
  );
} 