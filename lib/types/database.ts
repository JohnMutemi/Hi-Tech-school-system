export interface SchoolData {
  id: string
  schoolCode: string
  name: string
  logoFilename?: string
  logoUrl?: string
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
  description?: string
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
  status: "active" | "inactive"
  subjects?: string[]
  classes?: string[]
  createdAt?: string
  updatedAt?: string
  teacherProfile?: {
    qualification: string
    dateJoined: string
    tempPassword?: string
  }
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
  className?: string
  classLevel?: string
  dateOfBirth: string
  gender: "male" | "female"
  address: string
  dateAdmitted: string
  status: "active" | "inactive" | "graduated"
  createdAt?: string
  updatedAt?: string
  tempPassword?: string
  user?: { email: string }
  parent?: {
    email: string
    tempPassword?: string
  }
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
