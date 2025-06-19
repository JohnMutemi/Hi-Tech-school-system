"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function ParentLoginPage() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [parentContact, setParentContact] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login");
  const router = useRouter();
  const params = useParams();
  const schoolCode = params.schoolCode as string;

  // Simulate sending OTP
  const handleSendOtp = () => {
    if (!admissionNumber || !parentContact) {
      toast({ title: "Missing Fields", description: "Please enter admission number and phone/email." });
      return;
    }
    setOtpSent(true);
    toast({ title: "OTP Sent", description: `A one-time code has been sent to ${parentContact} (simulated).` });
  };

  // Simulate login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionNumber || !parentContact || !password) {
      toast({ title: "Missing Fields", description: "Please fill all fields." });
      return;
    }
    // Simulate OTP check
    if (!otpSent) {
      handleSendOtp();
      return;
    }
    if (otp !== "123456") {
      toast({ title: "Invalid OTP", description: "Please enter the correct OTP (try 123456 for demo)." });
      return;
    }
    // Simulate successful login and redirect to parent dashboard
    router.push(`/schools/${schoolCode}/parent/${parentContact}`);
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
              placeholder="Student Admission Number"
              value={admissionNumber}
              onChange={e => setAdmissionNumber(e.target.value)}
              required
            />
            <Input
              placeholder="Parent Phone or Email"
              value={parentContact}
              onChange={e => setParentContact(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {otpSent && (
              <Input
                placeholder="Enter OTP (try 123456)"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />
            )}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 