"use client";

import EditSchoolForm from "@/components/superadmin/edit-school-form";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";

export default function EditSchoolPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params;
  const router = useRouter();
  const { user } = useUser();

  if (user === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user.isLoggedIn || user.role !== "super_admin") {
    router.replace("/superadmin/login");
    return null;
  }

  return <EditSchoolForm schoolCode={schoolCode} />;
}
