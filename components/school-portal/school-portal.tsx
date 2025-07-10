"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { School, User, Eye, EyeOff } from "lucide-react";
import type { SchoolData } from "@/lib/school-storage";
import { getSchool } from "@/lib/school-storage";
import { SchoolSetupDashboard } from "./school-setup-dashboard";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface SchoolPortalProps {
  schoolCode: string;
}

export function SchoolPortal({ schoolCode }: SchoolPortalProps) {
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const searchParams = useSearchParams();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const autoEmail = searchParams.get("email") || "";
    const autoPassword = searchParams.get("password") || "";
    if (
      (autoEmail && !loginData.email) ||
      (autoPassword && !loginData.password)
    ) {
      setLoginData({
        email: autoEmail || loginData.email,
        password: autoPassword || loginData.password,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const autoSchoolName = searchParams.get("schoolName") || "";

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const school = await getSchool(schoolCode);
        if (school) {
          setSchoolData(school);
        }
      } catch (error) {
        console.error("Error fetching school:", error);
      }
      setIsLoading(false);
    };

    fetchSchool();
  }, [schoolCode]);

  // Fetch students from API on component mount
  useEffect(() => {
    async function fetchStudents() {
      if (!schoolData) return;
      try {
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/students`
        );
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
        toast({
          title: "Error",
          description: "Could not load student data.",
          variant: "destructive",
        });
      }
    }
    if (schoolData && schoolData.schoolCode) {
      fetchStudents();
    }
  }, [schoolData, toast]);

  // On mount, check session via API
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/admin/session`);
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, [schoolCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`/api/schools/${schoolCode}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        // No need to set localStorage, session is now cookie-based
        // Optionally, fetch school data from API after login
        const schoolRes = await fetch(`/api/schools/${schoolCode}`);
        if (schoolRes.ok) {
          const school = await schoolRes.json();
          setSchoolData(school);
        }
      } else {
        setLoginError(
          data.error ||
            "Invalid email or password. Please check your credentials."
        );
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await fetch(`/api/schools/${schoolCode}/admin/logout`, { method: "POST" });
    setIsLoggedIn(false);
    setLoginData({ email: "", password: "" });
  };

  if (checkingSession || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading school portal...</p>
        </div>
      </div>
    );
  }

  if (!schoolData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              School Not Found
            </h2>
            <p className="text-gray-600">
              The school with code "{schoolCode ? schoolCode.toUpperCase() : ""}
              " could not be found or may have been deactivated.
            </p>
            <Button
              className="mt-4"
              onClick={() => (window.location.href = "/")}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <SchoolSetupDashboard schoolData={schoolData} onLogout={handleLogout} />
    );
  }

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
      <div className="relative z-10 flex items-center justify-center w-full min-h-screen p-2 sm:p-4">
        <Card className="w-full max-w-md shadow-2xl rounded-2xl bg-white/80 backdrop-blur-md">
          <CardHeader className="text-center p-6 bg-white rounded-t-2xl">
            <div className="flex items-center justify-center mb-4">
              {schoolData.logoUrl ? (
                <img
                  src={schoolData.logoUrl || "/placeholder.svg"}
                  alt={`${schoolData.name} logo`}
                  className="w-20 h-20 object-cover rounded-full border-4"
                  style={{ borderColor: schoolData.colorTheme }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center border-4"
                  style={{
                    backgroundColor: schoolData.colorTheme + "20",
                    borderColor: schoolData.colorTheme,
                  }}
                >
                  <School
                    className="w-10 h-10"
                    style={{ color: schoolData.colorTheme }}
                  />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold">
              {schoolData.name}
            </CardTitle>
            <div
              className="text-lg font-semibold"
              style={{ color: schoolData.colorTheme }}
            >
              Welcome to {autoSchoolName || schoolData?.name}!
            </div>
            <CardDescription className="mt-1">
              School Code:{" "}
              <span className="font-mono font-bold">
                {schoolData.schoolCode
                  ? schoolData.schoolCode.toUpperCase()
                  : ""}
              </span>
            </CardDescription>
            <Badge
              variant={schoolData.status === "active" ? "default" : "secondary"}
              className="mt-2"
              style={{
                backgroundColor:
                  schoolData.status === "active"
                    ? "hsl(var(--primary))"
                    : "hsl(var(--secondary))",
                color:
                  schoolData.status === "active"
                    ? "hsl(var(--primary-foreground))"
                    : "hsl(var(--secondary-foreground))",
              }}
            >
              {schoolData.status === "setup"
                ? "Setup Required"
                : schoolData.status}
            </Badge>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolCode">School Code</Label>
                <Input
                  id="schoolCode"
                  value={schoolCode}
                  readOnly
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full text-lg py-6"
                style={{
                  backgroundColor: schoolData.colorTheme,
                  color: "#ffffff",
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Sign In to {schoolData.name}
              </Button>
            </form>

            <div className="text-center mt-6 text-sm text-gray-500">
              Powered by Hi-Tech SMS
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
