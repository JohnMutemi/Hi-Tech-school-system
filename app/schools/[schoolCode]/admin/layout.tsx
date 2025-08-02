"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ResponsiveContainer, ResponsiveText, TouchButton } from '@/components/ui/responsive-components';
import { useResponsive } from '@/hooks/useResponsive';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const schoolCode = (params.schoolCode as string).toUpperCase();
  const responsive = useResponsive();

  return (
    <ResponsiveContainer maxWidth="full">
      <nav className={`${responsive.isMobile ? 'flex-col space-y-2' : 'flex gap-4'} border-b mb-6 pb-2`}>
        <Link
          href={`/schools/${schoolCode}/admin`}
          className="hover:underline px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ResponsiveText size="base">Overview</ResponsiveText>
        </Link>
        <Link
          href={`/schools/${schoolCode}/admin/settings`}
          className="hover:underline px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ResponsiveText size="base">Settings</ResponsiveText>
        </Link>
        <Link
          href={`/schools/${schoolCode}/admin/academic-calendar`}
          className="hover:underline px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ResponsiveText size="base">Academic Calendar</ResponsiveText>
        </Link>
      </nav>
      <main>{children}</main>
    </ResponsiveContainer>
  );
}
