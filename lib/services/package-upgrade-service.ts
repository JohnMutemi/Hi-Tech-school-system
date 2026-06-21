import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import {
  getModuleLabel,
  getNewlyAddedModules,
  getPackageLabel,
  getPrimaryPortalRole,
  type PackageModule,
} from "@/lib/school-package"
import { staffPortalLoginPath } from "@/lib/staff-portal-path"
import { generateTempPassword } from "@/lib/utils/school-generator"
import { sendStaffPortalWelcomeEmail } from "@/lib/services/admin-auth-email-service"

const prisma = new PrismaClient()

const PORTAL_CONTROL_ROLES = ["school_admin", "admin", "bursar", "teacher"] as const

type PortalUser = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

type SchoolRecord = {
  id: string
  code: string
  name: string
  email: string
  principalName: string | null
  packageType: string
  users: PortalUser[]
}

export type PackageUpgradeResult = {
  upgraded: boolean
  addedModules: PackageModule[]
  emailSent: boolean
  recipientEmail: string | null
  portalUrl: string | null
  message: string
}

function resolvePortalBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
}

function pickCentralControlUser(users: PortalUser[]): PortalUser | undefined {
  for (const role of PORTAL_CONTROL_ROLES) {
    const match = users.find((user) => user.role === role && user.isActive)
    if (match) return match
  }
  return users.find((user) => PORTAL_CONTROL_ROLES.includes(user.role as (typeof PORTAL_CONTROL_ROLES)[number]))
}

function resolveRecipientEmail(school: SchoolRecord, portalUser?: PortalUser): string | null {
  const schoolEmail = school.email?.trim().toLowerCase()
  if (schoolEmail) return schoolEmail
  const userEmail = portalUser?.email?.trim().toLowerCase()
  return userEmail || null
}

function resolvePortalLoginEmail(school: SchoolRecord, portalUser?: PortalUser): string | null {
  return resolveRecipientEmail(school, portalUser)
}

export async function provisionPackageUpgrade(
  schoolCode: string,
  oldPackageType: string | null | undefined,
  newPackageType: string
): Promise<PackageUpgradeResult> {
  const addedModules = getNewlyAddedModules(oldPackageType, newPackageType)
  if (addedModules.length === 0) {
    return {
      upgraded: false,
      addedModules: [],
      emailSent: false,
      recipientEmail: null,
      portalUrl: null,
      message: "No new modules were added.",
    }
  }

  const school = await prisma.school.findFirst({
    where: { code: { equals: schoolCode, mode: "insensitive" } },
    include: {
      users: {
        where: { role: { in: [...PORTAL_CONTROL_ROLES] } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  })

  if (!school) {
    return {
      upgraded: false,
      addedModules,
      emailSent: false,
      recipientEmail: null,
      portalUrl: null,
      message: "School not found.",
    }
  }

  const schoolRecord = school as SchoolRecord
  const nextRole = getPrimaryPortalRole(newPackageType)
  const tempPassword = generateTempPassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 12)
  const portalUser = pickCentralControlUser(schoolRecord.users)
  const loginEmail = resolvePortalLoginEmail(schoolRecord, portalUser)
  const recipientEmail = resolveRecipientEmail(schoolRecord, portalUser)

  if (!loginEmail || !recipientEmail) {
    return {
      upgraded: false,
      addedModules,
      emailSent: false,
      recipientEmail: null,
      portalUrl: null,
      message: "No registered school email found for credential delivery.",
    }
  }

  const displayName =
    portalUser?.name ||
    schoolRecord.principalName?.trim() ||
    `${schoolRecord.name} Admin`

  if (portalUser) {
    await prisma.user.update({
      where: { id: portalUser.id },
      data: {
        role: nextRole,
        email: loginEmail,
        password: hashedPassword,
        mustChangePassword: true,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        isActive: true,
      },
    })
  } else {
    await prisma.user.create({
      data: {
        name: displayName,
        email: loginEmail,
        password: hashedPassword,
        mustChangePassword: true,
        role: nextRole,
        schoolId: schoolRecord.id,
        isActive: true,
      },
    })
  }

  const portalUrl = `${resolvePortalBaseUrl()}${staffPortalLoginPath(schoolRecord.code, newPackageType)}`
  const emailSent = await sendStaffPortalWelcomeEmail({
    to: recipientEmail,
    schoolName: schoolRecord.name,
    portalUrl,
    email: loginEmail,
    tempPassword,
    addedModules: addedModules.map(getModuleLabel),
    packageLabel: getPackageLabel(newPackageType),
  })

  return {
    upgraded: true,
    addedModules,
    emailSent,
    recipientEmail,
    portalUrl,
    message: emailSent
      ? `Welcome email sent to ${recipientEmail} with first-time sign-in credentials.`
      : `Package upgraded but email delivery failed for ${recipientEmail}. Share credentials manually.`,
  }
}
