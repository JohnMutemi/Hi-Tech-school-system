'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { SchoolLoginShell } from '@/components/auth/school-login-shell';

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
  const [contentVariant, setContentVariant] = useState<'general' | 'finance'>('general');
  const [subheading, setSubheading] = useState('Login to your bursar workspace');

  React.useEffect(() => {
    let ignore = false;
    const detectPackageType = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolCode}`);
        if (!response.ok || ignore) return;
        const data = await response.json();
        const packageType = String(data?.packageType || '').toLowerCase();
        if (packageType === 'finance_only') {
          router.replace(`/schools/${schoolCode}/finance/login`);
          setContentVariant('finance');
          setSubheading('Login to your independent finance workspace');
        }
      } catch (error) {
        console.error('Could not detect package type:', error);
      }
    };

    if (schoolCode) {
      detectPackageType();
    }

    return () => {
      ignore = true;
    };
  }, [schoolCode, router]);

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
    <SchoolLoginShell
      schoolCode={schoolCode}
      heading="Welcome Back!"
      subheading={subheading}
      adminLoginHref={`/schools/${schoolCode}`}
      contentVariant={contentVariant}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleInputChange}
            className="h-11"
            required
          />
        </div>

        <div>
          <Label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            className="h-11"
            required
          />
        </div>

        <Button type="submit" className="h-11 w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Access Dashboard"
          )}
        </Button>
      </form>
    </SchoolLoginShell>
  );
}

