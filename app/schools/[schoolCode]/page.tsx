import { SchoolPortal } from "@/components/school-portal/school-portal"

interface SchoolPortalPageProps {
  params: {
    schoolCode: string
  }
}

export default function SchoolPortalPage({ params }: SchoolPortalPageProps) {
  return <SchoolPortal schoolCode={params.schoolCode} />
}
