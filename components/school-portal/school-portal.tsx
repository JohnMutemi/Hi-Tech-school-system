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

// Define the SchoolData interface locally since we're not using school-storage
interface SchoolData {
  id: string;
  schoolCode: string;
  name: string;
  logo?: string;
  logoUrl?: string;
  colorTheme: string;
  portalUrl: string;
  description?: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  createdAt: string;
  status: "active" | "setup" | "suspended";
  profile?: {
    address: string;
    phone: string;
    website?: string;
    principalName: string;
    establishedYear: string;
    description: string;
    email: string;
    motto?: string;
    type: "primary" | "secondary" | "mixed" | "college";
  };
  teachers?: any[];
  students?: any[];
  subjects?: any[];
  classes?: any[];
}

import { SchoolSetupDashboard } from "./school-setup-dashboard";

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

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolCode}`);
        if (response.ok) {
          const school = await response.json();
          setSchoolData(school);
        } else {
          setSchoolData(null);
        }
      } catch (error) {
        console.error("Error fetching school:", error);
        setSchoolData(null);
      }
      setIsLoading(false);
    };
    fetchSchool();
  }, [schoolCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await fetch(`/api/schools/${schoolCode}`);
      if (!response.ok) {
        setLoginError("School not found");
        return;
      }
      const school = await response.json();
      if (
        loginData.email === school.adminEmail &&
        loginData.password === school.adminPassword
      ) {
        setIsLoggedIn(true);
        localStorage.setItem(`school_session_${schoolCode}`, loginData.email);
      } else {
        setLoginError(
          "Invalid email or password. Please check your credentials."
        );
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`school_session_${schoolCode}`);
    setIsLoggedIn(false);
    setLoginData({ email: "", password: "" });
  };

  if (isLoading) {
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
              The school with code "{schoolCode?.toUpperCase() || "UNKNOWN"}"
              could not be found or may have been deactivated.
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {schoolData.logoUrl ? (
                <img
                  src={schoolData.logoUrl || "/placeholder.svg"}
                  alt={`${schoolData.name} logo`}
                  className="w-16 h-16 object-cover rounded-full border-4"
                  style={{ borderColor: schoolData.colorTheme }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-4"
                  style={{
                    backgroundColor: schoolData.colorTheme + "20",
                    borderColor: schoolData.colorTheme,
                  }}
                >
                  <School
                    className="w-8 h-8"
                    style={{ color: schoolData.colorTheme }}
                  />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {schoolData.name}
            </CardTitle>
            <CardDescription>
              School Code:{" "}
              <span className="font-mono font-bold">
                {schoolData.schoolCode?.toUpperCase() || "UNKNOWN"}
              </span>
            </CardDescription>
            <Badge
              variant={schoolData.status === "active" ? "default" : "secondary"}
              className="mt-2"
            >
              {schoolData.status === "setup"
                ? "Setup Required"
                : schoolData.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full"
                style={{ backgroundColor: schoolData.colorTheme }}
              >
                <User className="w-4 h-4 mr-2" />
                Sign In to {schoolData.name}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Use the credentials provided by your system administrator.</p>
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <p>
                  <strong>Admin:</strong> {schoolData.adminFirstName}{" "}
                  {schoolData.adminLastName}
                </p>
                <p>
                  <strong>Email:</strong> {schoolData.adminEmail}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
