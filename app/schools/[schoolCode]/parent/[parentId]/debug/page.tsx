import DebugParentChildren from "@/components/parent-dashboard/DebugParentChildren";

export default function ParentDebugPage({
  params,
}: {
  params: { schoolCode: string; parentId: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Parent-Child Relationship Debug
        </h1>
        <DebugParentChildren 
          schoolCode={params.schoolCode} 
          parentId={params.parentId} 
        />
      </div>
    </div>
  );
}
