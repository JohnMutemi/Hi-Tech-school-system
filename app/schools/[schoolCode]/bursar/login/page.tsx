'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, School, User, Lock } from 'lucide-react';

export default function BursarLoginPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const schoolCode = params.schoolCode as string;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/schools/${schoolCode}/bursar/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${data.user?.name || 'Bursar'}!`,
        });

        // Redirect to bursar dashboard
        router.push(`/schools/${schoolCode}/bursar`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Professional Header */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
              <School className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto opacity-20 animate-pulse"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Bursar Portal
          </h1>
          <p className="text-gray-600 font-medium">
            Financial Management System
          </p>
          <div className="inline-block mt-3 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
            <span className="text-sm text-gray-500">School Code: </span>
            <span className="font-mono font-semibold text-indigo-600">{schoolCode}</span>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-800">
              Secure Login
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Enter your credentials to access the dashboard
            </p>
          </CardHeader>
        
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-12"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-12"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Access Dashboard
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-blue-800 mb-2">Default Credentials</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-center gap-2">
                      <span className="text-blue-600">Email:</span>
                      <span className="font-mono font-semibold text-blue-800">bursar@school.com</span>
                    </div>
                    <div className="flex justify-center gap-2">
                      <span className="text-blue-600">Password:</span>
                      <span className="font-mono font-semibold text-blue-800">bursar123</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">Change password after first login</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

