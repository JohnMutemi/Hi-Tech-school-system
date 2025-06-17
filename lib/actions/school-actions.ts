// Client-side school management functions
// These functions work with localStorage and can be called from client components

import { saveSchool, getSchool, getAllSchools } from "@/lib/school-storage"
import { generateSchoolCode, generateTempPassword } from "@/lib/utils/school-generator"

export function createSchoolClient(schoolData: any) {
  try {
    const { name, address, phone, email, code, colorTheme, description, website, principalName, establishedYear, motto, logoUrl } = schoolData

    if (!name || !address || !phone || !email) {
      return { error: "All required fields must be filled" }
    }

    const schoolCode = code || generateSchoolCode(name)
    const existingSchool = getSchool(schoolCode)
    if (existingSchool) {
      return { error: "School with this code already exists" }
    }

    const allSchools = getAllSchools()
    const existingEmail = allSchools.find(school => school.adminEmail === email)
    if (existingEmail) {
      return { error: "School with this email already exists" }
    }

    const tempPassword = generateTempPassword()
    const newSchoolData = {
      id: `school_${Date.now()}`,
      schoolCode,
      name,
      logoUrl: logoUrl || "",
      colorTheme: colorTheme || "#3b82f6",
      portalUrl: `/schools/${schoolCode}`,
      description: description || "",
      adminEmail: email,
      adminPassword: tempPassword,
      adminFirstName: name.split(" ")[0] || "Admin",
      adminLastName: name.split(" ").slice(1).join(" ") || "User",
      createdAt: new Date().toISOString(),
      status: "setup" as const,
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

    saveSchool(newSchoolData as any)

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

export function updateSchoolClient(id: string, schoolData: any) {
  try {
    const { name, address, phone, email, website, principalName, establishedYear, description, motto } = schoolData

    if (!name || !address || !phone || !email) {
      return { error: "All fields are required" }
    }

    const allSchools = getAllSchools()
    const schoolIndex = allSchools.findIndex(school => school.id === id)
    
    if (schoolIndex === -1) {
      return { error: "School not found" }
    }

    const updatedSchool = {
      ...allSchools[schoolIndex],
      name,
      adminEmail: email,
      profile: {
        address,
        phone,
        website: website || allSchools[schoolIndex].profile?.website || "",
        principalName: principalName || allSchools[schoolIndex].profile?.principalName || "",
        establishedYear: establishedYear || allSchools[schoolIndex].profile?.establishedYear || new Date().getFullYear().toString(),
        description: description || allSchools[schoolIndex].profile?.description || "",
        email,
        motto: motto || allSchools[schoolIndex].profile?.motto || "",
        type: allSchools[schoolIndex].profile?.type || "primary",
      },
    }

    saveSchool(updatedSchool as any)
    return { success: true }
  } catch (error) {
    console.error("Error updating school:", error)
    return { error: "Failed to update school" }
  }
}

export function deleteSchoolClient(id: string) {
  try {
    const allSchools = getAllSchools()
    const schoolToDelete = allSchools.find(school => school.id === id)
    
    if (!schoolToDelete) {
      return { error: "School not found" }
    }

    // Remove from local storage by saving all schools except the one to delete
    const updatedSchools = allSchools.filter(school => school.id !== id)
    
    // Clear existing data and save updated list
    localStorage.removeItem("schools-data")
    
    // Save each remaining school
    updatedSchools.forEach(school => saveSchool(school as any))

    return { success: true }
  } catch (error) {
    console.error("Error deleting school:", error)
    return { error: "Failed to delete school" }
  }
}

export function toggleSchoolStatusClient(id: string) {
  try {
    const allSchools = getAllSchools()
    const schoolIndex = allSchools.findIndex(school => school.id === id)
    
    if (schoolIndex === -1) {
      return { error: "School not found" }
    }

    const updatedSchool = {
      ...allSchools[schoolIndex],
      status: allSchools[schoolIndex].status === "active" ? "suspended" : "active",
    }

    saveSchool(updatedSchool as any)
    return { success: true }
  } catch (error) {
    console.error("Error toggling school status:", error)
    return { error: "Failed to update school status" }
  }
} 