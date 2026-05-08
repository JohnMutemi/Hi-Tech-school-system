import { SchoolPortal } from "@/components/school-portal/school-portal"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

interface SchoolPortalPageProps {
  params: {
    schoolCode?: string
  }
  searchParams?: {
    [key: string]: string | string[] | undefined
  }
}

function toSearchString(searchParams: SchoolPortalPageProps["searchParams"]) {
  if (!searchParams) return ""
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const v of value) query.append(key, v)
    } else if (typeof value === "string") {
      query.set(key, value)
    }
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ""
}

export default async function SchoolPortalPage({ params, searchParams }: SchoolPortalPageProps) {
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

  try {
    const school = await prisma.school.findFirst({
      where: {
        code: { equals: params.schoolCode, mode: "insensitive" },
      },
      select: {
        packageType: true,
      },
    })

    const packageType = (school?.packageType || "full").toLowerCase()
    if (packageType === "finance_only") {
      const qs = toSearchString(searchParams)
      redirect(`/schools/${params.schoolCode}/finance/login${qs}`)
    }
  } catch (error) {
    // Next.js redirect() throws a special error; never swallow it.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error
    }
    // If DB is temporarily unreachable, keep existing portal behavior.
  }

  return <SchoolPortal schoolCode={params.schoolCode} />
}
