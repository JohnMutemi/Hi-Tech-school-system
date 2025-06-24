import { SchoolPortal } from "@/components/school-portal/school-portal"

interface SchoolPortalPageProps {
  params: {
    schoolCode?: string
  }
}

export default function SchoolPortalPage({ params }: SchoolPortalPageProps) {
  if (!params.schoolCode || params.schoolCode === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-600">Invalid or Missing School Code</h2>
          <p className="text-gray-600 mb-4">Please use a valid school portal link or contact your administrator.</p>
          <a href="/" className="text-blue-600 underline">Return to Home</a>
        </div>
      </div>
    );
  }
  return <SchoolPortal schoolCode={params.schoolCode} />
}
