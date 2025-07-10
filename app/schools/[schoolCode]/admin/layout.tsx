"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const schoolCode = params.schoolCode as string;

  return (
    <div>
      <nav className="flex gap-4 border-b mb-6 pb-2">
        <Link
          href={`/schools/${schoolCode}/admin/promotions`}
          className="hover:underline"
        >
          Promotions
        </Link>
        <Link
          href={`/schools/${schoolCode}/admin/academic-calendar`}
          className="hover:underline"
        >
          Academic Calendar
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
