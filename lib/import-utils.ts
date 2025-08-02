import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { hashDefaultPasswordByRole } from '@/lib/utils/default-passwords';

const prisma = new PrismaClient();

export interface ImportResult {
  created: any[];
  updated: any[];
  skipped: any[];
  errors: any[];
}

export interface ImportOptions {
  updateExisting?: boolean;
  updateFields?: string[];
  skipDuplicates?: boolean;
  duplicateCheckField?: string;
}

/**
 * Enhanced import utility that supports both creation and updates
 */
export class ImportManager {
  private schoolId: string;
  private options: ImportOptions;

  constructor(schoolId: string, options: ImportOptions = {}) {
    this.schoolId = schoolId;
    this.options = {
      updateExisting: true,
      updateFields: [],
      skipDuplicates: false,
      duplicateCheckField: 'email',
      ...options
    };
  }

  /**
   * Import teachers with update capability
   */
  async importTeachers(rows: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    for (const row of rows) {
      try {
        const teacherData = this.parseTeacherRow(row);
        
        if (!this.validateTeacherData(teacherData)) {
          result.errors.push({ 
            teacher: teacherData.name || 'Unknown', 
            error: 'Invalid teacher data' 
          });
          continue;
        }

        // Check for existing teacher
        const existingTeacher = await this.findExistingTeacher(teacherData);
        
        if (existingTeacher) {
          if (this.options.skipDuplicates) {
            result.skipped.push({ 
              teacher: teacherData.name, 
              reason: 'Teacher already exists' 
            });
            continue;
          }

          if (this.options.updateExisting) {
            const updatedTeacher = await this.updateTeacher(existingTeacher.id, teacherData);
            result.updated.push(updatedTeacher);
          } else {
            result.skipped.push({ 
              teacher: teacherData.name, 
              reason: 'Teacher already exists (updates disabled)' 
            });
          }
        } else {
          const newTeacher = await this.createTeacher(teacherData);
          result.created.push(newTeacher);
        }
      } catch (error: any) {
        result.errors.push({ 
          teacher: row['Name'] || 'Unknown', 
          error: error.message 
        });
      }
    }

    return result;
  }

  /**
   * Import students with update capability
   */
  async importStudents(rows: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    for (const row of rows) {
      try {
        const studentData = this.parseStudentRow(row);
        
        if (!this.validateStudentData(studentData)) {
          result.errors.push({ 
            student: studentData.name || 'Unknown', 
            error: 'Invalid student data' 
          });
          continue;
        }

        // Check for existing student
        const existingStudent = await this.findExistingStudent(studentData);
        
        if (existingStudent) {
          if (this.options.skipDuplicates) {
            result.skipped.push({ 
              student: studentData.name, 
              reason: 'Student already exists' 
            });
            continue;
          }

          if (this.options.updateExisting) {
            const updatedStudent = await this.updateStudent(existingStudent.id, studentData);
            result.updated.push(updatedStudent);
          } else {
            result.skipped.push({ 
              student: studentData.name, 
              reason: 'Student already exists (updates disabled)' 
            });
          }
        } else {
          const newStudent = await this.createStudent(studentData);
          result.created.push(newStudent);
        }
      } catch (error: any) {
        result.errors.push({ 
          student: row['Name'] || 'Unknown', 
          error: error.message 
        });
      }
    }

    return result;
  }

  /**
   * Import subjects with update capability
   */
  async importSubjects(rows: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    for (const row of rows) {
      try {
        const subjectData = this.parseSubjectRow(row);
        
        if (!this.validateSubjectData(subjectData)) {
          result.errors.push({ 
            subject: subjectData.name || 'Unknown', 
            error: 'Invalid subject data' 
          });
          continue;
        }

        // Check for existing subject
        const existingSubject = await this.findExistingSubject(subjectData);
        
        if (existingSubject) {
          if (this.options.skipDuplicates) {
            result.skipped.push({ 
              subject: subjectData.name, 
              reason: 'Subject already exists' 
            });
            continue;
          }

          if (this.options.updateExisting) {
            const updatedSubject = await this.updateSubject(existingSubject.id, subjectData);
            result.updated.push(updatedSubject);
          } else {
            result.skipped.push({ 
              subject: subjectData.name, 
              reason: 'Subject already exists (updates disabled)' 
            });
          }
        } else {
          const newSubject = await this.createSubject(subjectData);
          result.created.push(newSubject);
        }
      } catch (error: any) {
        result.errors.push({ 
          subject: row['Name'] || 'Unknown', 
          error: error.message 
        });
      }
    }

    return result;
  }

  // Helper methods for parsing data
  private parseTeacherRow(row: any) {
    return {
      name: String(row['Name'] || row['name'] || row['NAME'] || '').trim(),
      email: String(row['Email'] || row['email'] || row['EMAIL'] || '').trim(),
      phone: this.formatPhoneNumber(String(row['Phone'] || '')),
      employeeId: String(row['Employee ID'] || ''),
      qualification: String(row['Qualification'] || ''),
      dateJoined: this.parseDate(row['Date Joined']),
      assignedClass: String(row['Assigned Class'] || ''),
      academicYear: String(row['Academic Year'] || ''),
      status: String(row['Status'] || 'active')
    };
  }

  private parseStudentRow(row: any) {
    return {
      name: String(row['Name'] || row['name'] || row['NAME'] || '').trim(),
      email: String(row['Email'] || row['email'] || row['EMAIL'] || '').trim(),
      phone: this.formatPhoneNumber(String(row['Student Phone'] || '')),
      admissionNumber: String(row['Admission Number'] || ''),
      dateOfBirth: this.parseDate(row['Date of Birth']),
      parentName: String(row['Parent Name'] || ''),
      parentEmail: String(row['Parent Email'] || ''),
      parentPhone: this.formatPhoneNumber(String(row['Parent Phone'] || '')),
      address: String(row['Address'] || ''),
      gender: String(row['Gender'] || ''),
      className: String(row['Class'] || ''),
      status: String(row['Status'] || 'active'),
      emergencyContact: String(row['Emergency Contact'] || ''),
      medicalInfo: String(row['Medical Information'] || ''),
      notes: String(row['Notes'] || '')
    };
  }

  private parseSubjectRow(row: any) {
    return {
      name: String(row['Name'] || row['name'] || row['NAME'] || '').trim(),
      code: String(row['Code'] || row['code'] || row['CODE'] || '').trim(),
      description: String(row['Description'] || ''),
      teacherEmail: String(row['Teacher Email'] || '')
    };
  }

  // Validation methods
  private validateTeacherData(data: any): boolean {
    return !!(data.name && data.name.length >= 2 && data.email && data.phone);
  }

  private validateStudentData(data: any): boolean {
    return !!(data.name && data.name.length >= 2 && data.admissionNumber);
  }

  private validateSubjectData(data: any): boolean {
    return !!(data.name && data.code);
  }

  // Database operations
  private async findExistingTeacher(data: any) {
    return await prisma.user.findFirst({
              where: {
          OR: [
            { email: data.email },
            { employeeId: data.employeeId }
          ],
          schoolId: this.schoolId,
          role: 'teacher'
        },
      include: { teacherProfile: true }
    });
  }

  private async findExistingStudent(data: any) {
    return await prisma.student.findFirst({
      where: {
        OR: [
          { admissionNumber: data.admissionNumber },
          { user: { email: data.email } }
        ],
        schoolId: this.schoolId
      },
      include: { user: true }
    });
  }

  private async findExistingSubject(data: any) {
    return await prisma.subject.findFirst({
      where: {
        OR: [
          { name: data.name },
          { code: data.code }
        ],
        schoolId: this.schoolId
      }
    });
  }

  private async createTeacher(data: any) {
    const hashedTeacherPassword = await hashDefaultPasswordByRole('teacher');
    const teacherUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'teacher',
        password: hashedTeacherPassword,
        employeeId: data.employeeId,
        schoolId: this.schoolId,
        teacherProfile: {
          create: {
            qualification: data.qualification,
            dateJoined: data.dateJoined ? new Date(data.dateJoined) : undefined,
            tempPassword: 'teacher123',
          }
        }
      },
      include: { teacherProfile: true }
    });

    return {
      id: teacherUser.id,
      name: teacherUser.name,
      email: teacherUser.email,
      action: 'created'
    };
  }

  private async updateTeacher(teacherId: string, data: any) {
    // Update user fields
    await prisma.user.update({
      where: { id: teacherId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        employeeId: data.employeeId,
        isActive: data.status === 'active' || true
      }
    });

    // Update teacher profile
    await prisma.teacherProfile.updateMany({
      where: { userId: teacherId },
      data: {
        qualification: data.qualification,
        dateJoined: data.dateJoined ? new Date(data.dateJoined) : undefined
      }
    });

    return {
      id: teacherId,
      name: data.name,
      email: data.email,
      action: 'updated'
    };
  }

  private async createStudent(data: any) {
    // Create or find parent
    let parent = await prisma.user.findFirst({
      where: { 
        phone: data.parentPhone, 
        role: 'parent', 
        schoolId: this.schoolId 
      }
    });
    
    if (!parent) {
      const hashedParentPassword = await hashDefaultPasswordByRole('parent');
      parent = await prisma.user.create({
        data: {
          name: data.parentName,
          email: data.parentEmail || `${data.parentPhone}@parent.local`,
          phone: data.parentPhone,
          role: 'parent',
          password: hashedParentPassword,
          isActive: true,
          schoolId: this.schoolId,
        },
      });
    }

    // Find class if specified
    let classId = null;
    if (data.className) {
      const existingClass = await prisma.class.findFirst({
        where: { 
          name: data.className,
          schoolId: this.schoolId 
        }
      });
      classId = existingClass?.id || null;
    }

    // Create student user
    const hashedStudentPassword = await hashDefaultPasswordByRole('student');
    const studentUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || `${data.admissionNumber}@school.local`,
        phone: data.phone || '',
        role: 'student',
        password: hashedStudentPassword,
        isActive: true,
        schoolId: this.schoolId,
      },
    });

    // Fetch current academic year and term
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: this.schoolId, isCurrent: true },
    });
    let currentTerm = null;
    if (currentYear) {
      currentTerm = await prisma.term.findFirst({
        where: { academicYearId: currentYear.id, isCurrent: true },
      });
    }

    // Create student record
    await prisma.student.create({
      data: {
        userId: studentUser.id,
        schoolId: this.schoolId,
        classId: classId,
        admissionNumber: data.admissionNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        dateAdmitted: new Date(),
        parentId: parent.id,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        address: data.address,
        gender: data.gender,
        status: data.status || "active",
        emergencyContact: data.emergencyContact,
        medicalInfo: data.medicalInfo,
        isActive: true,
        notes: data.notes,
        currentAcademicYearId: currentYear?.id,
        currentTermId: currentTerm?.id,
        joinedAcademicYearId: currentYear?.id,
        joinedTermId: currentTerm?.id,
      },
    });

    return {
      id: studentUser.id,
      name: studentUser.name,
      admissionNumber: data.admissionNumber,
      action: 'created'
    };
  }

  private async updateStudent(studentId: string, data: any) {
    // Update student user
    await prisma.user.update({
      where: { id: studentId },
      data: {
        name: data.name,
        email: data.email || `${data.admissionNumber}@school.local`,
        phone: data.phone || ''
      }
    });

    // Update student record
    await prisma.student.updateMany({
      where: { userId: studentId },
      data: {
        admissionNumber: data.admissionNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        address: data.address,
        gender: data.gender,
        status: data.status,
        emergencyContact: data.emergencyContact,
        medicalInfo: data.medicalInfo,
        notes: data.notes
      }
    });

    return {
      id: studentId,
      name: data.name,
      admissionNumber: data.admissionNumber,
      action: 'updated'
    };
  }

  private async createSubject(data: any) {
    // Find teacher if email provided
    let teacherId = null;
    if (data.teacherEmail) {
      const teacher = await prisma.user.findFirst({
        where: { 
          email: data.teacherEmail,
          schoolId: this.schoolId,
          role: 'TEACHER'
        }
      });
      teacherId = teacher?.id || null;
    }

    const subject = await prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        teacherId: teacherId,
        schoolId: this.schoolId,
      },
    });

    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      action: 'created'
    };
  }

  private async updateSubject(subjectId: string, data: any) {
    // Find teacher if email provided
    let teacherId = null;
    if (data.teacherEmail) {
      const teacher = await prisma.user.findFirst({
        where: { 
          email: data.teacherEmail,
          schoolId: this.schoolId,
          role: 'TEACHER'
        }
      });
      teacherId = teacher?.id || null;
    }

    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        teacherId: teacherId,
      },
    });

    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      action: 'updated'
    };
  }

  // Utility methods
  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    let formatted = phone.trim();
    if (!formatted.startsWith('+')) {
      if (formatted.startsWith('0')) {
        formatted = '+254' + formatted.substring(1);
      } else if (formatted.startsWith('254')) {
        formatted = '+' + formatted;
      } else {
        formatted = '+254' + formatted;
      }
    }
    return formatted;
  }

  private parseDate(dateValue: any): string | null {
    if (!dateValue) return null;
    
    if (typeof dateValue === 'number') {
      // Convert Excel date serial number to Date object
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    } else if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    } else {
      return String(dateValue);
    }
  }
} 