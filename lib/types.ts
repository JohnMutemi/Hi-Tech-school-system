export interface School {
  id: string
  schoolCode: string
  name: string
  logo?: string
  colorTheme: string
  portalUrl: string
  adminEmail: string
  adminPassword: string
  createdAt: Date
  status: "active" | "setup" | "suspended"
}

export interface SchoolAdmin {
  id: string
  email: string
  password: string
  schoolId: string
  firstName: string
  lastName: string
  isFirstLogin: boolean
  createdAt: Date
}

export interface SchoolFormData {
  name: string
  logo?: File
  colorTheme: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
}
