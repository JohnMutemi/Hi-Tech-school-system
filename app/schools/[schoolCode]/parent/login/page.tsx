"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { SchoolLoginShell } from "@/components/auth/school-login-shell";


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
    <SchoolLoginShell
      schoolCode={schoolCode}
      heading="Welcome Back!"
      subheading="Login to your school account"
      adminLoginHref={`/schools/${schoolCode}`}
    >
      {autoFilled && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
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
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </SchoolLoginShell>
  );
} 