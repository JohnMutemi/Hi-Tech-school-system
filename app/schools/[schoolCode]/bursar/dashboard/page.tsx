"use client";

import { useParams } from "next/navigation";
import { BursarDashboard } from "@/components/bursar-dashboard/bursar-dashboard";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, User } from "lucide-react";
import Link from "next/link";

export default function BursarDashboardPage() {
  const params = useParams();
  const schoolCode = params.schoolCode as string;
  const { toast } = useToast();
  const [bursarInfo, setBursarInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check bursar session
    const checkSession = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolCode}/bursar/session`);
        if (response.ok) {
          const data = await response.json();
          setBursarInfo(data);
        } else {
          // Redirect to login if not authenticated
          window.location.href = `/schools/${schoolCode}/bursar/login`;
        }
      } catch (error) {
        console.error("Session check error:", error);
        window.location.href = `/schools/${schoolCode}/bursar/login`;
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [schoolCode]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/bursar/logout`, {
        method: "POST",
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Logged out successfully",
        });
        window.location.href = `/schools/${schoolCode}/bursar/login`;
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href={`/schools/${schoolCode}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to School Portal
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Bursar Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {bursarInfo && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{bursarInfo.name}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BursarDashboard 
          schoolCode={schoolCode} 
          bursarId={bursarInfo?.id}
        />
      </main>
    </div>
  );
} 