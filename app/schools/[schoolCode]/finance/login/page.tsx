'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { SchoolLoginShell } from '@/components/auth/school-login-shell';
import { ACADEMICS_PORTAL_LABEL, FINANCE_PORTAL_LABEL, isDualModulePackage, normalizePackageType } from '@/lib/school-package';
import { academicsPortalLoginPath, staffLoginHubPath } from '@/lib/staff-portal-path';

export default function FinanceLoginPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const schoolCode = params.schoolCode as string;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotInfo, setForgotInfo] = useState<{ message: string; link?: string; hint?: string }>({ message: "" });
  const [schoolTheme, setSchoolTheme] = useState('#2563eb');
  const [schoolName, setSchoolName] = useState('Finance Module Access');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | undefined>(undefined);
  const [packageType, setPackageType] = useState('finance_only');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('relogin') === '1') {
      toast({
        title: 'Sign in with your new password',
        description: 'Your password was updated. Use the new password you just set.',
      });
      router.replace(`/schools/${schoolCode}/finance/login`, { scroll: false });
    }
  }, [schoolCode, router, toast]);

  React.useEffect(() => {
    let ignore = false;
    const loadSchoolTheme = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolCode}`);
        if (!response.ok) return;
        const data = await response.json();
        if (ignore) return;
        if (typeof data?.colorTheme === 'string' && /^#[0-9A-Fa-f]{6}$/.test(data.colorTheme)) {
          setSchoolTheme(data.colorTheme);
        }
        if (typeof data?.name === 'string' && data.name.trim()) {
          setSchoolName(data.name.trim());
        }
        if (typeof data?.logoUrl === 'string' && data.logoUrl.trim()) {
          setSchoolLogoUrl(data.logoUrl.trim());
        }
        if (data?.packageType) setPackageType(normalizePackageType(data.packageType));
      } catch (error) {
        console.error('Failed to load school theme:', error);
      }
    };

    if (schoolCode) {
      loadSchoolTheme();
    }

    return () => {
      ignore = true;
    };
  }, [schoolCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

      const response = await fetch(`/api/schools/${schoolCode}/finance/login`, {
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
          description: `Welcome back, ${data.user?.name || 'Finance Officer'}!`,
        });

        router.push(`/schools/${schoolCode}/finance`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Finance login error:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotInfo({ message: "" });
    if (!formData.email) {
      toast({
        title: 'Email Required',
        description: 'Enter your registered finance email first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setForgotLoading(true);
      const response = await fetch(`/api/schools/${schoolCode}/finance/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Could not process request');
      }

      setForgotInfo({
        message: data.message || 'Check your email for a reset link.',
        link: data.debugResetLink,
        hint: data.debugHint,
      });

      toast({
        title: 'Reset Link Sent',
        description: data.message || 'Check your email for a reset link.',
      });
    } catch (error) {
      toast({
        title: 'Request Failed',
        description: error instanceof Error ? error.message : 'Could not send reset link',
        variant: 'destructive',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <SchoolLoginShell
      schoolCode={schoolCode}
      heading={schoolName}
      subheading={`Sign in to your ${FINANCE_PORTAL_LABEL}`}
      logoUrl={schoolLogoUrl}
      colorTheme={schoolTheme}
      contentVariant="finance"
      moduleBadge="Finance Module"
      adminLoginHref={staffLoginHubPath(schoolCode)}
      backLinkLabel="← All staff workspaces"
      sisterModuleLink={
        isDualModulePackage(packageType)
          ? {
              label: `Open ${ACADEMICS_PORTAL_LABEL}`,
              href: academicsPortalLoginPath(schoolCode),
            }
          : undefined
      }
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
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              className="h-11 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-white"
          style={{ backgroundColor: schoolTheme }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            'Access Finance Module'
          )}
        </Button>
        <Button
          type="button"
          variant="link"
          className="w-full text-sm"
          onClick={handleForgotPassword}
          disabled={forgotLoading}
        >
          {forgotLoading ? 'Sending reset link...' : 'Forgot password?'}
        </Button>
        {forgotInfo.message ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            <p>{forgotInfo.message}</p>
            {forgotInfo.hint ? <p className="mt-1 text-xs text-blue-800">{forgotInfo.hint}</p> : null}
            {forgotInfo.link ? (
              <a
                href={forgotInfo.link}
                className="mt-2 inline-block text-blue-800 underline"
              >
                Open reset link (debug)
              </a>
            ) : null}
          </div>
        ) : null}
      </form>
    </SchoolLoginShell>
  );
}
