// Client-side school management functions
// These functions work with API and can be called from client components

import { getSchools, getSchool } from "@/lib/db"

export async function createSchoolClient(schoolData: any) {
  try {
    const { name, address, phone, email, code, colorTheme, description, website, principalName, establishedYear, motto } = schoolData

    if (!name || !address || !phone || !email) {
      return { error: "All required fields must be filled" }
    }

    const response = await fetch('/api/schools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        address,
        phone,
        email,
        code,
        colorTheme,
        description,
        website,
        principalName,
        establishedYear,
        motto
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Failed to create school" }
    }

    return result
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

    const response = await fetch(`/api/schools/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        address,
        phone,
        email,
        website,
        principalName,
        establishedYear,
        description,
        motto
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Failed to update school" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating school:", error)
    return { error: "Failed to update school" }
  }
}

export async function deleteSchoolClient(id: string) {
  try {
    const response = await fetch(`/api/schools/${id}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Failed to delete school" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting school:", error)
    return { error: "Failed to delete school" }
  }
}

export async function toggleSchoolStatusClient(id: string) {
  try {
    const response = await fetch(`/api/schools/${id}/toggle-status`, {
      method: 'PATCH',
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Failed to update school status" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error toggling school status:", error)
    return { error: "Failed to update school status" }
  }
} 