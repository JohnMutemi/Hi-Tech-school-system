import { sql } from "@/lib/database"
import type { SchoolData, SchoolProfile, Teacher, Student, Subject, SchoolClass } from "@/lib/types/database"

export class SchoolService {
  // School CRUD operations
  static async createSchool(schoolData: Omit<SchoolData, "id" | "createdAt" | "updatedAt">): Promise<SchoolData> {
    try {
      const result = await sql`
        INSERT INTO schools (
          school_code, name, logo_filename, color_theme, portal_url, description,
          admin_email, admin_password, admin_first_name, admin_last_name, status
        ) VALUES (
          ${schoolData.schoolCode}, ${schoolData.name}, ${schoolData.logoFilename || null},
          ${schoolData.colorTheme}, ${schoolData.portalUrl}, ${schoolData.description || null},
          ${schoolData.adminEmail}, ${schoolData.adminPassword}, ${schoolData.adminFirstName},
          ${schoolData.adminLastName}, ${schoolData.status}
        )
        RETURNING *
      `

      return this.mapSchoolFromDb(result[0])
    } catch (error) {
      console.error("Error creating school:", error)
      throw new Error("Failed to create school")
    }
  }

  static async getSchoolByCode(schoolCode: string): Promise<SchoolData | null> {
    try {
      const result = await sql`
        SELECT * FROM schools 
        WHERE school_code = ${schoolCode.toLowerCase()}
      `

      if (result.length === 0) return null

      const school = this.mapSchoolFromDb(result[0])

      // Load related data
      school.profile = await this.getSchoolProfile(school.id)
      school.teachers = await this.getSchoolTeachers(school.id)
      school.students = await this.getSchoolStudents(school.id)
      school.subjects = await this.getSchoolSubjects(school.id)
      school.classes = await this.getSchoolClasses(school.id)

      return school
    } catch (error) {
      console.error("Error getting school by code:", error)
      return null
    }
  }

  static async getAllSchools(): Promise<SchoolData[]> {
    try {
      const result = await sql`
        SELECT s.*, 
               COUNT(DISTINCT t.id) as teacher_count,
               COUNT(DISTINCT st.id) as student_count
        FROM schools s
        LEFT JOIN teachers t ON s.id = t.school_id AND t.status = 'active'
        LEFT JOIN students st ON s.id = st.school_id AND st.status = 'active'
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `

      return result.map((row) => ({
        ...this.mapSchoolFromDb(row),
        teachers: Array(Number.parseInt(row.teacher_count || "0")).fill(null),
        students: Array(Number.parseInt(row.student_count || "0")).fill(null),
      }))
    } catch (error) {
      console.error("Error getting all schools:", error)
      return []
    }
  }

  static async updateSchool(id: string, updates: Partial<SchoolData>): Promise<SchoolData | null> {
    try {
      const setClause = Object.entries(updates)
        .filter(([key, value]) => value !== undefined && key !== "id")
        .map(([key, value]) => `${this.camelToSnake(key)} = ${sql([value])}`)
        .join(", ")

      if (!setClause) return null

      const result = await sql`
        UPDATE schools 
        SET ${sql.unsafe(setClause)}
        WHERE id = ${id}
        RETURNING *
      `

      return result.length > 0 ? this.mapSchoolFromDb(result[0]) : null
    } catch (error) {
      console.error("Error updating school:", error)
      throw new Error("Failed to update school")
    }
  }

  static async deleteSchool(id: string): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM schools WHERE id = ${id}
      `
      return result.count > 0
    } catch (error) {
      console.error("Error deleting school:", error)
      return false
    }
  }

  // School Profile operations
  static async createOrUpdateSchoolProfile(
    schoolId: string,
    profile: Omit<SchoolProfile, "id" | "schoolId" | "createdAt" | "updatedAt">,
  ): Promise<SchoolProfile> {
    try {
      const result = await sql`
        INSERT INTO school_profiles (
          school_id, address, phone, website, principal_name, established_year,
          email, motto, school_type
        ) VALUES (
          ${schoolId}, ${profile.address}, ${profile.phone}, ${profile.website || null},
          ${profile.principalName}, ${profile.establishedYear}, ${profile.email},
          ${profile.motto || null}, ${profile.schoolType}
        )
        ON CONFLICT (school_id) DO UPDATE SET
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          website = EXCLUDED.website,
          principal_name = EXCLUDED.principal_name,
          established_year = EXCLUDED.established_year,
          email = EXCLUDED.email,
          motto = EXCLUDED.motto,
          school_type = EXCLUDED.school_type,
          updated_at = NOW()
        RETURNING *
      `

      return this.mapSchoolProfileFromDb(result[0])
    } catch (error) {
      console.error("Error creating/updating school profile:", error)
      throw new Error("Failed to save school profile")
    }
  }

  static async getSchoolProfile(schoolId: string): Promise<SchoolProfile | null> {
    try {
      const result = await sql`
        SELECT * FROM school_profiles WHERE school_id = ${schoolId}
      `
      return result.length > 0 ? this.mapSchoolProfileFromDb(result[0]) : null
    } catch (error) {
      console.error("Error getting school profile:", error)
      return null
    }
  }

  // Teacher operations
  static async createTeacher(teacher: Omit<Teacher, "id" | "createdAt" | "updatedAt">): Promise<Teacher> {
    try {
      const result = await sql`
        INSERT INTO teachers (
          school_id, name, email, phone, employee_id, qualification, date_joined, status
        ) VALUES (
          ${teacher.schoolId}, ${teacher.name}, ${teacher.email}, ${teacher.phone || null},
          ${teacher.employeeId}, ${teacher.qualification || null}, ${teacher.dateJoined || null}, ${teacher.status}
        )
        RETURNING *
      `

      return this.mapTeacherFromDb(result[0])
    } catch (error) {
      console.error("Error creating teacher:", error)
      throw new Error("Failed to create teacher")
    }
  }

  static async getSchoolTeachers(schoolId: string): Promise<Teacher[]> {
    try {
      const result = await sql`
        SELECT * FROM teachers 
        WHERE school_id = ${schoolId}
        ORDER BY created_at DESC
      `

      return result.map((row) => this.mapTeacherFromDb(row))
    } catch (error) {
      console.error("Error getting school teachers:", error)
      return []
    }
  }

  static async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher | null> {
    try {
      const result = await sql`
        UPDATE teachers 
        SET name = ${updates.name || sql`name`},
            email = ${updates.email || sql`email`},
            phone = ${updates.phone || sql`phone`},
            qualification = ${updates.qualification || sql`qualification`},
            date_joined = ${updates.dateJoined || sql`date_joined`},
            status = ${updates.status || sql`status`},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `

      return result.length > 0 ? this.mapTeacherFromDb(result[0]) : null
    } catch (error) {
      console.error("Error updating teacher:", error)
      throw new Error("Failed to update teacher")
    }
  }

  static async deleteTeacher(id: string): Promise<boolean> {
    try {
      const result = await sql`DELETE FROM teachers WHERE id = ${id}`
      return result.count > 0
    } catch (error) {
      console.error("Error deleting teacher:", error)
      return false
    }
  }

  // Student operations
  static async createStudent(student: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<Student> {
    try {
      const result = await sql`
        INSERT INTO students (
          school_id, name, email, phone, parent_name, parent_phone, parent_email,
          admission_number, class, date_of_birth, gender, address, date_admitted, status
        ) VALUES (
          ${student.schoolId}, ${student.name}, ${student.email || null}, ${student.phone || null},
          ${student.parentName}, ${student.parentPhone}, ${student.parentEmail || null},
          ${student.admissionNumber}, ${student.class}, ${student.dateOfBirth || null},
          ${student.gender}, ${student.address || null}, ${student.dateAdmitted || null}, ${student.status}
        )
        RETURNING *
      `

      return this.mapStudentFromDb(result[0])
    } catch (error) {
      console.error("Error creating student:", error)
      throw new Error("Failed to create student")
    }
  }

  static async getSchoolStudents(schoolId: string): Promise<Student[]> {
    try {
      const result = await sql`
        SELECT * FROM students 
        WHERE school_id = ${schoolId}
        ORDER BY created_at DESC
      `

      return result.map((row) => this.mapStudentFromDb(row))
    } catch (error) {
      console.error("Error getting school students:", error)
      return []
    }
  }

  static async updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
    try {
      const result = await sql`
        UPDATE students 
        SET name = ${updates.name || sql`name`},
            email = ${updates.email || sql`email`},
            phone = ${updates.phone || sql`phone`},
            parent_name = ${updates.parentName || sql`parent_name`},
            parent_phone = ${updates.parentPhone || sql`parent_phone`},
            parent_email = ${updates.parentEmail || sql`parent_email`},
            admission_number = ${updates.admissionNumber || sql`admission_number`},
            class = ${updates.class || sql`class`},
            date_of_birth = ${updates.dateOfBirth || sql`date_of_birth`},
            gender = ${updates.gender || sql`gender`},
            address = ${updates.address || sql`address`},
            date_admitted = ${updates.dateAdmitted || sql`date_admitted`},
            status = ${updates.status || sql`status`},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `

      return result.length > 0 ? this.mapStudentFromDb(result[0]) : null
    } catch (error) {
      console.error("Error updating student:", error)
      throw new Error("Failed to update student")
    }
  }

  static async deleteStudent(id: string): Promise<boolean> {
    try {
      const result = await sql`DELETE FROM students WHERE id = ${id}`
      return result.count > 0
    } catch (error) {
      console.error("Error deleting student:", error)
      return false
    }
  }

  // Subject operations
  static async createSubject(subject: Omit<Subject, "id" | "createdAt" | "updatedAt">): Promise<Subject> {
    try {
      const result = await sql`
        INSERT INTO subjects (school_id, name, code, description, teacher_id)
        VALUES (${subject.schoolId}, ${subject.name}, ${subject.code}, ${subject.description || null}, ${subject.teacherId || null})
        RETURNING *
      `

      return this.mapSubjectFromDb(result[0])
    } catch (error) {
      console.error("Error creating subject:", error)
      throw new Error("Failed to create subject")
    }
  }

  static async getSchoolSubjects(schoolId: string): Promise<Subject[]> {
    try {
      const result = await sql`
        SELECT * FROM subjects 
        WHERE school_id = ${schoolId}
        ORDER BY created_at DESC
      `

      return result.map((row) => this.mapSubjectFromDb(row))
    } catch (error) {
      console.error("Error getting school subjects:", error)
      return []
    }
  }

  static async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject | null> {
    try {
      const result = await sql`
        UPDATE subjects 
        SET name = ${updates.name || sql`name`},
            code = ${updates.code || sql`code`},
            description = ${updates.description || sql`description`},
            teacher_id = ${updates.teacherId || sql`teacher_id`},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `

      return result.length > 0 ? this.mapSubjectFromDb(result[0]) : null
    } catch (error) {
      console.error("Error updating subject:", error)
      throw new Error("Failed to update subject")
    }
  }

  static async deleteSubject(id: string): Promise<boolean> {
    try {
      const result = await sql`DELETE FROM subjects WHERE id = ${id}`
      return result.count > 0
    } catch (error) {
      console.error("Error deleting subject:", error)
      return false
    }
  }

  // Class operations
  static async createClass(schoolClass: Omit<SchoolClass, "id" | "createdAt" | "updatedAt">): Promise<SchoolClass> {
    try {
      const result = await sql`
        INSERT INTO classes (school_id, name, level, capacity, current_students, class_teacher_id)
        VALUES (${schoolClass.schoolId}, ${schoolClass.name}, ${schoolClass.level}, ${schoolClass.capacity}, ${schoolClass.currentStudents}, ${schoolClass.classTeacherId || null})
        RETURNING *
      `

      return this.mapClassFromDb(result[0])
    } catch (error) {
      console.error("Error creating class:", error)
      throw new Error("Failed to create class")
    }
  }

  static async getSchoolClasses(schoolId: string): Promise<SchoolClass[]> {
    try {
      const result = await sql`
        SELECT * FROM classes 
        WHERE school_id = ${schoolId}
        ORDER BY created_at DESC
      `

      return result.map((row) => this.mapClassFromDb(row))
    } catch (error) {
      console.error("Error getting school classes:", error)
      return []
    }
  }

  static async updateClass(id: string, updates: Partial<SchoolClass>): Promise<SchoolClass | null> {
    try {
      const result = await sql`
        UPDATE classes 
        SET name = ${updates.name || sql`name`},
            level = ${updates.level || sql`level`},
            capacity = ${updates.capacity || sql`capacity`},
            current_students = ${updates.currentStudents || sql`current_students`},
            class_teacher_id = ${updates.classTeacherId || sql`class_teacher_id`},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `

      return result.length > 0 ? this.mapClassFromDb(result[0]) : null
    } catch (error) {
      console.error("Error updating class:", error)
      throw new Error("Failed to update class")
    }
  }

  static async deleteClass(id: string): Promise<boolean> {
    try {
      const result = await sql`DELETE FROM classes WHERE id = ${id}`
      return result.count > 0
    } catch (error) {
      console.error("Error deleting class:", error)
      return false
    }
  }

  // Authentication
  static async authenticateSchoolAdmin(schoolCode: string, email: string, password: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT id FROM schools 
        WHERE school_code = ${schoolCode.toLowerCase()} 
        AND admin_email = ${email} 
        AND admin_password = ${password}
      `
      return result.length > 0
    } catch (error) {
      console.error("Error authenticating school admin:", error)
      return false
    }
  }

  // Helper methods for mapping database rows to TypeScript objects
  private static mapSchoolFromDb(row: any): SchoolData {
    return {
      id: row.id,
      schoolCode: row.school_code,
      name: row.name,
      logoFilename: row.logo_filename,
      colorTheme: row.color_theme,
      portalUrl: row.portal_url,
      description: row.description,
      adminEmail: row.admin_email,
      adminPassword: row.admin_password,
      adminFirstName: row.admin_first_name,
      adminLastName: row.admin_last_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
    }
  }

  private static mapSchoolProfileFromDb(row: any): SchoolProfile {
    return {
      id: row.id,
      schoolId: row.school_id,
      address: row.address,
      phone: row.phone,
      website: row.website,
      principalName: row.principal_name,
      establishedYear: row.established_year,
      email: row.email,
      motto: row.motto,
      schoolType: row.school_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private static mapTeacherFromDb(row: any): Teacher {
    return {
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      employeeId: row.employee_id,
      qualification: row.qualification,
      dateJoined: row.date_joined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private static mapStudentFromDb(row: any): Student {
    return {
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      parentName: row.parent_name,
      parentPhone: row.parent_phone,
      parentEmail: row.parent_email,
      admissionNumber: row.admission_number,
      class: row.class,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      address: row.address,
      dateAdmitted: row.date_admitted,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private static mapSubjectFromDb(row: any): Subject {
    return {
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      code: row.code,
      description: row.description,
      teacherId: row.teacher_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private static mapClassFromDb(row: any): SchoolClass {
    return {
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      level: row.level,
      capacity: row.capacity,
      currentStudents: row.current_students,
      classTeacherId: row.class_teacher_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  }
}
