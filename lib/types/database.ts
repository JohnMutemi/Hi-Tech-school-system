export interface SchoolData {
  id: string
  schoolCode: string
  name: string
  logoFilename?: string
  colorTheme: string
  portalUrl: string
  description?: string
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
  createdAt: string
  updatedAt: string
  status: "active" | "setup" | "suspended"
  profile?: SchoolProfile
  teachers?: Teacher[]
  students?: Student[]
  subjects?: Subject[]
  classes?: SchoolClass[]
}

export interface SchoolProfile {
  id?: string
  schoolId: string
  address: string
  phone: string
  website?: string
  principalName: string
  establishedYear: string
  email: string
  motto?: string
  schoolType: "primary" | "secondary" | "mixed" | "college"
  createdAt?: string
  updatedAt?: string
}

export interface Teacher {
  id: string
  schoolId: string
  name: string
  email: string
  phone: string
  employeeId: string
  qualification: string
  dateJoined: string
  status: "active" | "inactive"
  subjects?: string[]
  classes?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Student {
  id: string
  schoolId: string
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
  createdAt?: string
  updatedAt?: string
}

export interface Subject {
  id: string
  schoolId: string
  name: string
  code: string
  description?: string
  teacherId?: string
  classes?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface SchoolClass {
  id: string
  schoolId: string
  name: string
  level: string
  capacity: number
  currentStudents: number
  classTeacherId?: string
  subjects?: string[]
  createdAt?: string
  updatedAt?: string
}
