import  ParentDashboard  from "@/components/parent-dashboard/parent-dashboard";

export default function ParentDashboardPage({
  params,
}: {
  params: { schoolCode: string; parentId: string };
}) {
  const schoolCode = params.schoolCode;
  const parentId = params.parentId;
  return <ParentDashboard schoolCode={schoolCode} parentId={parentId} />;
}
