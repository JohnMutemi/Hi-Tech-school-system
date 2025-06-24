// Client-side school management functions
// These functions work with API calls and can be called from client components

import { saveSchool, getSchool, getAllSchools, createSchool, deleteSchool } from "@/lib/school-storage"
import { generateSchoolCode, generateTempPassword } from "@/lib/utils/school-generator"

export async function createSchoolClient(schoolData: any) {
  try {
    const { name, address, phone, email, code, colorTheme, description, website, principalName, establishedYear, motto, logoUrl } = schoolData

    if (!name || !address || !phone || !email) {
      return { error: "All required fields must be filled" }
    }

    const schoolCode = code || generateSchoolCode(name)
    const existingSchool = await getSchool(schoolCode)
    if (existingSchool) {
      return { error: "School with this code already exists" }
    }

    const allSchools = await getAllSchools()
    const existingEmail = allSchools.find(school => school.adminEmail === email)
    if (existingEmail) {
      return { error: "School with this email already exists" }
    }

    const tempPassword = generateTempPassword()
    const [firstName, ...rest] = name.split(" ")
    const lastName = rest.join(" ") || "User"
    const newSchoolData = {
      schoolCode,
      name,
      logoUrl: logoUrl || "",
      colorTheme: colorTheme || "#3b82f6",
      portalUrl: `/schools/${schoolCode}`,
      description: description || "",
      adminEmail: email,
      adminPassword: tempPassword,
      adminFirstName: firstName || "Admin",
      adminLastName: lastName,
      status: "setup",
      address,
      phone,
      email,
      profile: {
        address,
        phone,
        website: website || "",
        principalName: principalName || "",
        establishedYear: establishedYear || new Date().getFullYear().toString(),
        description: description || "",
        email,
        motto: motto || "",
        type: "primary" as const,
      },
      teachers: [],
      students: [],
      subjects: [],
      classes: [],
    }

    const createdSchool = await createSchool(newSchoolData as any)

    return {
      success: true,
      schoolCode,
      tempPassword,
      portalUrl: `/schools/${schoolCode}`,
      message: "School created successfully",
    }
  } catch (error) {
    console.error("Error creating school:", error)
    return { error: "Failed to create school" }
  }
}

export async function updateSchoolClient(id: string, schoolData: any) {
  try {
    const { name, address, phone, email, website, principalName, establishedYear, description, motto } = schoolData

    if (!name || !address || !phone || !email) {
      return { error: "All fields are required" }
    }

    const allSchools = await getAllSchools()
    const school = allSchools.find(school => school.id === id)
    
    if (!school) {
      return { error: "School not found" }
    }

    const updatedSchool = {
      ...school,
      name,
      adminEmail: email,
      profile: {
        address,
        phone,
        website: website || school.profile?.website || "",
        principalName: principalName || school.profile?.principalName || "",
        establishedYear: establishedYear || school.profile?.establishedYear || new Date().getFullYear().toString(),
        description: description || school.profile?.description || "",
        email,
        motto: motto || school.profile?.motto || "",
        type: school.profile?.type || "primary",
      },
    }

    await saveSchool(updatedSchool as any)
    return { success: true }
  } catch (error) {
    console.error("Error updating school:", error)
    return { error: "Failed to update school" }
  }
}

export async function deleteSchoolClient(schoolCode: string) {
  try {
    const success = await deleteSchool(schoolCode)
    
    if (!success) {
      return { error: "School not found" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting school:", error)
    return { error: "Failed to delete school" }
  }
}

export async function toggleSchoolStatusClient(id: string) {
  try {
    const allSchools = await getAllSchools()
    const school = allSchools.find(school => school.id === id)
    
    if (!school) {
      return { error: "School not found" }
    }

    const updatedSchool = {
      ...school,
      status: school.status === "active" ? "suspended" : "active",
    }

    await saveSchool(updatedSchool as any)
    return { success: true }
  } catch (error) {
    console.error("Error toggling school status:", error)
    return { error: "Failed to update school status" }
  }
} 