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
import { School, User, Eye, EyeOff } from "lucide-react";
import type { SchoolData } from "@/lib/school-storage";
import { getSchool } from "@/lib/school-storage";
import PromotionsSection from "./PromotionsSection";
import { SchoolSetupDashboard } from "./school-setup-dashboard";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { SchoolLoginShell } from "@/components/auth/school-login-shell";
import { isDualModulePackage, normalizePackageType } from "@/lib/school-package";
import {
  academicsPortalLoginPath,
  financePortalLoginPath,
  modulePortalPickerPath,
} from "@/lib/staff-portal-path";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SchoolPortalProps {
  schoolCode: string;
}

export function SchoolPortal({ schoolCode }: SchoolPortalProps) {
  const router = useRouter();
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const searchParams = useSearchParams();
  const [students, setStudents] = useState([]);
  const [activeQuickRole, setActiveQuickRole] = useState<null | "parent" | "student" | "teacher">(null);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickStudent, setQuickStudent] = useState({ admissionNumber: "", email: "", password: "" });
  const [quickParent, setQuickParent] = useState({ phone: "", password: "" });
  const [quickTeacher, setQuickTeacher] = useState({ email: "", password: "" });

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

  useEffect(() => {
    if (!schoolData?.packageType || !schoolCode) return;
    const pkg = normalizePackageType(schoolData.packageType);
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (pkg === "finance_only") {
      router.replace(`${financePortalLoginPath(schoolCode)}${search}`);
      return;
    }
    if (pkg === "grading_only") {
      router.replace(`${academicsPortalLoginPath(schoolCode)}${search}`);
      return;
    }
    if (isDualModulePackage(pkg)) {
      router.replace(`${modulePortalPickerPath(schoolCode)}${search}`);
    }
  }, [schoolData, schoolCode, router]);

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
          const data = await res.json();
          setIsLoggedIn(true);
          if (data.requiresTermsAcceptance) {
            router.replace(`/schools/${schoolCode}/terms`);
            return;
          }
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
  }, [router, schoolCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setInfoMessage("");
    setIsSubmitting(true);
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
      if (res.ok && data.success && data.requiresTwoFactor) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`admin_2fa_token_${schoolCode}`, data.twoFactorToken);
        }
        router.push(`/schools/${schoolCode}/verify-otp`);
      } else if (res.ok && data.success) {
        setIsLoggedIn(true);
        // No need to set localStorage, session is now cookie-based
        // Optionally, fetch school data from API after login
        const schoolRes = await fetch(`/api/schools/${schoolCode}`);
        if (schoolRes.ok) {
          const school = await schoolRes.json();
          setSchoolData(school);
        }
      } else if (res.ok && data.requiresPasswordChange) {
        setInfoMessage(
          data.message ||
            "First login detected. Check your email for a password reset link."
        );
      } else {
        setLoginError(
          data.error ||
            "Invalid email or password. Please check your credentials."
        );
      }
    } catch {
      setLoginError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setLoginError("Enter your admin email first.");
      return;
    }
    setForgotSubmitting(true);
    setLoginError("");
    setInfoMessage("");
    try {
      const res = await fetch(`/api/schools/${schoolCode}/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginData.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setInfoMessage(data.message || "Reset link sent if account exists.");
      } else {
        setLoginError(data.error || "Could not send reset link.");
      }
    } catch {
      setLoginError("Could not send reset link.");
    } finally {
      setForgotSubmitting(false);
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
              The school with code &quot;{schoolCode ? schoolCode.toUpperCase() : ""}
              &quot; could not be found or may have been deactivated.
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
    <SchoolLoginShell
      schoolCode={schoolCode}
      heading={schoolData.name}
      subheading={`Welcome to ${autoSchoolName || schoolData.name}`}
      logoUrl={schoolData.logoUrl}
      colorTheme={schoolData.colorTheme}
    >
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
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 transform"
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
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{loginError}</p>
          </div>
        )}
        {infoMessage && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-700">{infoMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full text-lg py-6"
          disabled={isSubmitting}
          style={{
            backgroundColor: schoolData.colorTheme,
            color: "#ffffff",
          }}
        >
          <User className="w-4 h-4 mr-2" />
          {`Sign In to ${schoolData.name}`}
        </Button>
        <Button
          type="button"
          variant="link"
          className="w-full text-sm"
          onClick={handleForgotPassword}
          disabled={forgotSubmitting}
        >
          Forgot password?
        </Button>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs">
          <button
            type="button"
            className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
            onClick={() => {
              setQuickError("");
              setActiveQuickRole("parent");
            }}
          >
            Parent Login
          </button>
          <button
            type="button"
            className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
            onClick={() => {
              setQuickError("");
              setActiveQuickRole("student");
            }}
          >
            Student Login
          </button>
          <button
            type="button"
            className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
            onClick={() => {
              setQuickError("");
              setActiveQuickRole("teacher");
            }}
          >
            Teacher Login
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        Powered by Hi-Tech SMS
      </div>
      <Dialog open={!!activeQuickRole} onOpenChange={(open) => !open && setActiveQuickRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeQuickRole === "parent"
                ? "Parent Quick Login"
                : activeQuickRole === "student"
                  ? "Student Quick Login"
                  : "Teacher Quick Login"}
            </DialogTitle>
            <DialogDescription>
              Enter credentials to continue to your portal.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!activeQuickRole) return;
              setQuickSubmitting(true);
              setQuickError("");
              try {
                let endpoint = "";
                let payload: Record<string, string> = {};

                if (activeQuickRole === "parent") {
                  endpoint = `/api/schools/${schoolCode}/parents/login`;
                  payload = quickParent;
                } else if (activeQuickRole === "student") {
                  endpoint = `/api/schools/${schoolCode}/students/login`;
                  payload = quickStudent;
                } else {
                  endpoint = `/api/schools/${schoolCode}/teachers/login`;
                  payload = quickTeacher;
                }

                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                  setQuickError(data.error || "Login failed. Check your credentials.");
                  return;
                }

                setActiveQuickRole(null);
                if (activeQuickRole === "parent") {
                  router.push(`/schools/${schoolCode}/parent/${data.parentId}`);
                } else if (activeQuickRole === "student") {
                  router.push(`/schools/${schoolCode}/student`);
                } else {
                  router.push(`/schools/${schoolCode}/teacher`);
                }
              } catch {
                setQuickError("An unexpected error occurred. Please try again.");
              } finally {
                setQuickSubmitting(false);
              }
            }}
          >
            {activeQuickRole === "student" ? (
              <>
                <Input
                  placeholder="Admission Number (optional if using email)"
                  value={quickStudent.admissionNumber}
                  onChange={(e) =>
                    setQuickStudent((prev) => ({ ...prev, admissionNumber: e.target.value }))
                  }
                />
                <Input
                  type="email"
                  placeholder="Email (optional if using admission number)"
                  value={quickStudent.email}
                  onChange={(e) => setQuickStudent((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={quickStudent.password}
                  onChange={(e) => setQuickStudent((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </>
            ) : null}

            {activeQuickRole === "parent" ? (
              <>
                <Input
                  placeholder="Phone Number"
                  value={quickParent.phone}
                  onChange={(e) => setQuickParent((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={quickParent.password}
                  onChange={(e) => setQuickParent((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </>
            ) : null}

            {activeQuickRole === "teacher" ? (
              <>
                <Input
                  type="email"
                  placeholder="Email"
                  value={quickTeacher.email}
                  onChange={(e) => setQuickTeacher((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={quickTeacher.password}
                  onChange={(e) => setQuickTeacher((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </>
            ) : null}

            {quickError ? <p className="text-sm text-red-600">{quickError}</p> : null}
            <Button type="submit" className="w-full" disabled={quickSubmitting}>
              {quickSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SchoolLoginShell>
  );
}
