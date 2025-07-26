export interface SchoolData {
  id: string
  schoolCode: string
  name: string
  logo?: string
  logoUrl?: string
  colorTheme: string
  portalUrl: string
  description?: string
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
  createdAt: string
  status: "active" | "setup" | "suspended"
  profile?: SchoolProfile
  teachers?: Teacher[]
  students?: Student[]
  subjects?: Subject[]
  classes?: SchoolClass[]
}

export interface SchoolProfile {
  address: string
  phone: string
  website?: string
  principalName: string
  establishedYear: string
  description: string
  email: string
  motto?: string
  type: "primary" | "secondary" | "mixed" | "college"
}

export interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  subjects: string[]
  classes: string[]
  employeeId: string
  qualification: string
  dateJoined: string
  status: "active" | "inactive"
  tempPassword?: string // For development/testing only
}

export interface Student {
  id: string
  name: string
  email?: string
  phone?: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  admissionNumber: string
  className?: string
  classLevel?: string
  dateOfBirth: string
  gender: "male" | "female"
  address: string
  dateAdmitted: string
  status: "active" | "inactive" | "graduated"
  class?: { id: string; name: string }
}

export interface Subject {
  id: string
  name: string
  code: string
  description?: string
  teacherId?: string
  classes: string[]
}

export type SchoolClass = {
  id: string;
  name: string;
  level: string;
  classTeacherId?: string;
  capacity?: number;
  academicYearId?: string;
  currentStudents?: number;
  subjects?: string[];
  gradeId?: string;
  // ...other properties
};

export interface Grade {
  id: string
  name: string
}

export interface SchoolAdmin {
  email: string
  password: string
  firstName: string
  lastName: string
  isFirstLogin: boolean
  schoolCode: string
}

// API-based school storage functions
export async function saveSchool(schoolData: SchoolData): Promise<SchoolData> {
  try {
    console.log("Saving school data via API:", schoolData.name)

    const response = await fetch(`/api/schools/${schoolData.schoolCode}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schoolData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const savedSchool = await response.json()
    console.log("School data saved successfully via API")
    return savedSchool
  } catch (error) {
    console.error("Error in saveSchool:", error)
    throw new Error("Failed to save school data")
  }
}

export async function createSchool(schoolData: Omit<SchoolData, "id" | "createdAt">): Promise<SchoolData> {
  try {
    console.log("Creating school via API:", schoolData.name)

    const response = await fetch('/api/schools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schoolData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const createdSchool = await response.json()
    console.log("School created successfully via API")
    return createdSchool
  } catch (error) {
    console.error("Error in createSchool:", error)
    throw error
  }
}

export async function getSchool(schoolCode: string): Promise<SchoolData | null> {
  try {
    console.log("Fetching school via API:", schoolCode)

    const response = await fetch(`/api/schools/${schoolCode}`)
    
    if (response.status === 404) {
      console.log("School not found:", schoolCode)
      return null
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const school = await response.json()
    console.log("School retrieved successfully via API:", school.name)
    return school
  } catch (error) {
    console.error("Error fetching school from API:", error)
    return null
  }
}

export async function getAllSchools(): Promise<SchoolData[]> {
  try {
    console.log("Fetching all schools via API")

    const response = await fetch('/api/schools')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const schools = await response.json()
    console.log("Retrieved schools from API:", schools.length, "schools")
    return schools
  } catch (error) {
    console.error("Error fetching schools from API:", error)
    return []
  }
}

export async function deleteSchool(schoolCode: string): Promise<boolean> {
  try {
    console.log("Deleting school via API:", schoolCode)

    const response = await fetch(`/api/schools/${schoolCode}`, {
      method: 'DELETE',
    })

    if (response.status === 404) {
      console.log("School not found for deletion:", schoolCode)
      return false
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log("School deleted successfully via API")
    return true
  } catch (error) {
    console.error("Error deleting school from API:", error)
    return false
  }
}

// Update specific school data
export async function updateSchoolProfile(schoolCode: string, profile: SchoolProfile): Promise<void> {
  try {
    const school = await getSchool(schoolCode)
    if (school) {
      school.profile = profile
      await saveSchool(school)
    }
  } catch (error) {
    console.error("Error updating school profile:", error)
    throw error
  }
}

export async function updateSchoolTeachers(schoolCode: string, teachers: Teacher[]): Promise<void> {
  try {
    const school = await getSchool(schoolCode)
    if (school) {
      school.teachers = teachers
      await saveSchool(school)
    }
  } catch (error) {
    console.error("Error updating school teachers:", error)
    throw error
  }
}

export async function updateSchoolStudents(schoolCode: string, students: Student[]): Promise<void> {
  try {
    const school = await getSchool(schoolCode)
    if (school) {
      school.students = students
      await saveSchool(school)
    }
  } catch (error) {
    console.error("Error updating school students:", error)
    throw error
  }
}

export async function updateSchoolSubjects(schoolCode: string, subjects: Subject[]): Promise<void> {
  try {
    const school = await getSchool(schoolCode)
    if (school) {
      school.subjects = subjects
      await saveSchool(school)
    }
  } catch (error) {
    console.error("Error updating school subjects:", error)
    throw error
  }
}

export async function updateSchoolClasses(schoolCode: string, classes: SchoolClass[]): Promise<void> {
  try {
    const school = await getSchool(schoolCode)
    if (school) {
      school.classes = classes
      await saveSchool(school)
    }
  } catch (error) {
    console.error("Error updating school classes:", error)
    throw error
  }
}

// School admin authentication
export async function authenticateSchoolAdmin(schoolCode: string, email: string, password: string): Promise<boolean> {
  try {
    const school = await getSchool(schoolCode)
    if (!school) return false

    return school.adminEmail === email && school.adminPassword === password
  } catch (error) {
    console.error("Error authenticating school admin:", error)
    return false
  }
}

// Session management (using sessionStorage instead of localStorage for better security)
export function setSchoolAdminSession(schoolCode: string, email: string): void {
  try {
    if (typeof window === "undefined") return

    sessionStorage.setItem(
      `school-admin-${schoolCode}`,
      JSON.stringify({
        email,
        loginTime: Date.now(),
        schoolCode,
      }),
    )
  } catch (error) {
    console.error("Error setting school admin session:", error)
  }
}

export function getSchoolAdminSession(schoolCode: string): any {
  try {
    if (typeof window === "undefined") return null

    const data = sessionStorage.getItem(`school-admin-${schoolCode}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error getting school admin session:", error)
    return null
  }
}

export function clearSchoolAdminSession(schoolCode: string): void {
  try {
    if (typeof window === "undefined") return

    sessionStorage.removeItem(`school-admin-${schoolCode}`)
  } catch (error) {
    console.error("Error clearing school admin session:", error)
  }
}

// Logo handling - Store logos in the database via API
export async function saveSchoolLogo(schoolCode: string, logoFile: File): Promise<string> {
  try {
    // Check file size (limit to 500KB)
    if (logoFile.size > 500000) {
      throw new Error("Logo file too large. Please use an image smaller than 500KB.")
    }

    // Convert file to base64
    const logoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          resolve(result)
        } else {
          reject(new Error("Failed to read logo file"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read logo file"))
      reader.readAsDataURL(logoFile)
    })

    // Save logo to school via API
    const school = await getSchool(schoolCode)
    if (school) {
      school.logo = logoUrl
      await saveSchool(school)
      console.log("Logo saved successfully for school:", schoolCode)
      return logoUrl
    } else {
      throw new Error("School not found")
    }
  } catch (error) {
    console.error("Error saving school logo:", error)
    throw error
  }
}

export async function getSchoolLogo(schoolCode: string): Promise<string | null> {
  try {
    const school = await getSchool(schoolCode)
    return school?.logo || null
  } catch (error) {
    console.error("Error getting school logo:", error)
    return null
  }
}

export async function deleteSchoolLogo(schoolCode: string): Promise<void> {
  try {
    const school = await getSchool(schoolCode)
    if (school) {
      school.logo = undefined
      await saveSchool(school)
      console.log("Logo deleted successfully for school:", schoolCode)
    }
  } catch (error) {
    console.error("Error deleting school logo:", error)
    throw error
  }
}

// Utility function to clear all session data (for testing/debugging)
export function clearAllSessionData(): void {
  try {
    if (typeof window === "undefined") return

    // Clear all school admin sessions
    const keys = Object.keys(sessionStorage)
    keys.forEach((key) => {
      if (key.startsWith("school-admin-")) {
        sessionStorage.removeItem(key)
      }
    })

    console.log("All session data cleared")
  } catch (error) {
    console.error("Error clearing session data:", error)
  }
}

export async function getTeacher(schoolCode: string, teacherId: string): Promise<Teacher | null> {
  try {
    const school = await getSchool(schoolCode)
    if (!school || !school.teachers) return null
    return school.teachers.find((t) => t.id === teacherId) || null
  } catch (error) {
    console.error("Error getting teacher:", error)
    return null
  }
}
