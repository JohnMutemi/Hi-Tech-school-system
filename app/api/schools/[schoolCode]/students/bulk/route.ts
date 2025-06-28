import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { students } = await request.json();
  const { schoolCode } = params;
  const school = await prisma.school.findUnique({ where: { code: schoolCode } });
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const results = [];
  for (const student of students) {
    try {
      // Hash passwords
      const hashedParentPassword = await bcrypt.hash("parent123", 12);
      const hashedStudentPassword = await bcrypt.hash("student123", 12);
      // Check/create parent
      let parent = await prisma.user.findFirst({
        where: { phone: student.parentPhone, role: "parent", schoolId: school.id }
      });
      if (!parent) {
        parent = await prisma.user.create({
          data: {
            name: student.parentName,
            phone: student.parentPhone,
            email: student.parentEmail || `${student.parentPhone}@parent.local`,
            role: "parent",
            password: hashedParentPassword, // Hashed parent password
            isActive: true,
            schoolId: school.id,
          }
        });
      }
      // Create student user and profile
      const studentUser = await prisma.user.create({
        data: {
          name: student.name,
          email: student.email,
          password: hashedStudentPassword, // Hashed student password
          role: "student",
          isActive: true,
          schoolId: school.id,
        }
      });
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          schoolId: school.id,
          classId: student.classId,
          admissionNumber: student.admissionNumber,
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
          dateAdmitted: student.dateAdmitted ? new Date(student.dateAdmitted) : new Date(),
          parentId: parent.id,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          address: student.address,
          gender: student.gender,
          status: student.status || "active",
          isActive: true,
        }
      });
      results.push({ admissionNumber: student.admissionNumber, status: "success" });
    } catch (error: any) {
      results.push({ admissionNumber: student.admissionNumber, status: "error", error: error.message });
    }
  }
  return NextResponse.json({ results });
} 