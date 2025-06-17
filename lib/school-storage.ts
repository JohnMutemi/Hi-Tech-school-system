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
  class: string
  dateOfBirth: string
  gender: "male" | "female"
  address: string
  dateAdmitted: string
  status: "active" | "inactive" | "graduated"
}

export interface Subject {
  id: string
  name: string
  code: string
  description?: string
  teacherId?: string
  classes: string[]
}

export interface SchoolClass {
  id: string
  name: string
  level: string
  capacity: number
  currentStudents: number
  classTeacherId?: string
  subjects: string[]
}

export interface SchoolAdmin {
  email: string
  password: string
  firstName: string
  lastName: string
  isFirstLogin: boolean
  schoolCode: string
}

// School storage functions
export function saveSchool(schoolData: SchoolData): void {
  try {
    if (typeof window === "undefined") {
      throw new Error("Cannot save school data on server side")
    }

    console.log("Saving school data:", schoolData)

    const schools = getSchools()

    // Create a copy without the logoUrl to save space
    const schoolDataToSave = { ...schoolData }
    delete schoolDataToSave.logoUrl // Don't store logo URLs in localStorage

    schools[schoolData.schoolCode.toLowerCase()] = schoolDataToSave

    const dataToSave = JSON.stringify(schools)
    console.log("Data size:", dataToSave.length, "characters")

    // Check if data is too large (localStorage limit is usually 5-10MB)
    if (dataToSave.length > 4000000) {
      // 4MB limit to be safe
      throw new Error("Data too large for localStorage. Consider removing some data.")
    }

    localStorage.setItem("schools-data", dataToSave)

    // Verify the data was saved
    const savedData = localStorage.getItem("schools-data")
    if (!savedData) {
      throw new Error("Failed to save data to localStorage")
    }

    console.log("School data saved successfully")
  } catch (error) {
    console.error("Error in saveSchool:", error)

    // If quota exceeded, try to clean up and save without optional data
    if (error.name === "QuotaExceededError") {
      try {
        console.log("Quota exceeded, trying to save minimal data...")
        const schools = getSchools()

        // Save minimal data without logos, descriptions, etc.
        const minimalSchoolData = {
          id: schoolData.id,
          schoolCode: schoolData.schoolCode,
          name: schoolData.name,
          colorTheme: schoolData.colorTheme,
          portalUrl: schoolData.portalUrl,
          adminEmail: schoolData.adminEmail,
          adminPassword: schoolData.adminPassword,
          adminFirstName: schoolData.adminFirstName,
          adminLastName: schoolData.adminLastName,
          createdAt: schoolData.createdAt,
          status: schoolData.status,
          teachers: schoolData.teachers || [],
          students: schoolData.students || [],
          subjects: schoolData.subjects || [],
          classes: schoolData.classes || [],
        }

        schools[schoolData.schoolCode.toLowerCase()] = minimalSchoolData
        localStorage.setItem("schools-data", JSON.stringify(schools))
        console.log("Minimal school data saved successfully")
      } catch (secondError) {
        console.error("Failed to save even minimal data:", secondError)
        throw new Error("Storage quota exceeded. Please clear some data and try again.")
      }
    } else {
      throw error
    }
  }
}

export function getSchool(schoolCode: string): SchoolData | null {
  const schools = getSchools()
  return schools[schoolCode.toLowerCase()] || null
}

export function getSchools(): Record<string, SchoolData> {
  try {
    if (typeof window === "undefined") {
      console.log("Running on server side, returning empty object")
      return {}
    }

    const data = localStorage.getItem("schools-data")
    console.log("Retrieved schools data from localStorage, size:", data?.length || 0, "characters")

    if (!data) {
      console.log("No schools data found, returning empty object")
      return {}
    }

    const parsed = JSON.parse(data)
    console.log("Parsed schools data:", Object.keys(parsed).length, "schools")
    return parsed
  } catch (error) {
    console.error("Error in getSchools:", error)
    return {}
  }
}

export function getAllSchools(): SchoolData[] {
  const schools = getSchools()
  return Object.values(schools)
}

// Update specific school data
export function updateSchoolProfile(schoolCode: string, profile: SchoolProfile): void {
  const school = getSchool(schoolCode)
  if (school) {
    school.profile = profile
    saveSchool(school)
  }
}

export function updateSchoolTeachers(schoolCode: string, teachers: Teacher[]): void {
  const school = getSchool(schoolCode)
  if (school) {
    school.teachers = teachers
    saveSchool(school)
  }
}

export function updateSchoolStudents(schoolCode: string, students: Student[]): void {
  const school = getSchool(schoolCode)
  if (school) {
    school.students = students
    saveSchool(school)
  }
}

export function updateSchoolSubjects(schoolCode: string, subjects: Subject[]): void {
  const school = getSchool(schoolCode)
  if (school) {
    school.subjects = subjects
    saveSchool(school)
  }
}

export function updateSchoolClasses(schoolCode: string, classes: SchoolClass[]): void {
  const school = getSchool(schoolCode)
  if (school) {
    school.classes = classes
    saveSchool(school)
  }
}

// School admin authentication
export function authenticateSchoolAdmin(schoolCode: string, email: string, password: string): boolean {
  const school = getSchool(schoolCode)
  if (!school) return false

  return school.adminEmail === email && school.adminPassword === password
}

export function setSchoolAdminSession(schoolCode: string, email: string): void {
  localStorage.setItem(
    `school-admin-${schoolCode}`,
    JSON.stringify({
      email,
      loginTime: Date.now(),
      schoolCode,
    }),
  )
}

export function getSchoolAdminSession(schoolCode: string): any {
  const data = localStorage.getItem(`school-admin-${schoolCode}`)
  return data ? JSON.parse(data) : null
}

export function clearSchoolAdminSession(schoolCode: string): void {
  localStorage.removeItem(`school-admin-${schoolCode}`)
}

// Logo handling - Store logos separately in a more efficient way
export function saveSchoolLogo(schoolCode: string, logoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check file size (limit to 500KB)
    if (logoFile.size > 500000) {
      reject(new Error("Logo file too large. Please use an image smaller than 500KB."))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const logoUrl = e.target?.result as string

        // Store logo separately to avoid quota issues
        const logoKey = `school-logo-${schoolCode.toLowerCase()}`

        try {
          localStorage.setItem(logoKey, logoUrl)
          console.log("Logo saved successfully for school:", schoolCode)
          resolve(logoUrl)
        } catch (error) {
          if (error.name === "QuotaExceededError") {
            console.warn("Cannot save logo due to storage quota. Proceeding without logo.")
            resolve("") // Return empty string instead of failing
          } else {
            reject(error)
          }
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read logo file"))
    }

    reader.readAsDataURL(logoFile)
  })
}

export function getSchoolLogo(schoolCode: string): string | null {
  try {
    const logoKey = `school-logo-${schoolCode.toLowerCase()}`
    return localStorage.getItem(logoKey)
  } catch (error) {
    console.error("Error getting school logo:", error)
    return null
  }
}

export function deleteSchoolLogo(schoolCode: string): void {
  try {
    const logoKey = `school-logo-${schoolCode.toLowerCase()}`
    localStorage.removeItem(logoKey)
  } catch (error) {
    console.error("Error deleting school logo:", error)
  }
}

// Utility function to clear all data (for testing/debugging)
export function clearAllSchoolData(): void {
  try {
    // Clear main schools data
    localStorage.removeItem("schools-data")

    // Clear all school logos
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("school-logo-") || key.startsWith("school-admin-")) {
        localStorage.removeItem(key)
      }
    })

    console.log("All school data cleared")
  } catch (error) {
    console.error("Error clearing school data:", error)
  }
}

// Function to get storage usage info
export function getStorageInfo(): { used: number; total: number; percentage: number } {
  try {
    let used = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }

    const total = 5000000 // Approximate 5MB limit
    const percentage = (used / total) * 100

    return { used, total, percentage }
  } catch (error) {
    console.error("Error getting storage info:", error)
    return { used: 0, total: 5000000, percentage: 0 }
  }
}
