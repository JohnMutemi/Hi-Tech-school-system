import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureSchoolGrades(schoolId: string) {
  try {
    console.log(`🔧 Ensuring school-specific grades exist for school: ${schoolId}`);
    
    // Get platform-level grades
    const platformGrades = await prisma.grade.findMany({
      where: {
        schoolId: null // Platform-level grades
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📚 Found ${platformGrades.length} platform-level grades`);
    
    // Check which school-specific grades already exist
    const existingSchoolGrades = await prisma.grade.findMany({
      where: {
        schoolId: schoolId
      }
    });
    
    console.log(`🏫 Found ${existingSchoolGrades.length} existing school-specific grades`);
    
    // Create missing school-specific grades
    const gradesToCreate = platformGrades.filter(platformGrade => 
      !existingSchoolGrades.some(schoolGrade => schoolGrade.name === platformGrade.name)
    );
    
    if (gradesToCreate.length > 0) {
      console.log(`➕ Creating ${gradesToCreate.length} missing school-specific grades`);
      
      const createdGrades = await Promise.all(
        gradesToCreate.map(async (platformGrade) => {
          return await prisma.grade.create({
            data: {
              name: platformGrade.name,
              description: platformGrade.description || `Grade ${platformGrade.name}`,
              schoolId: schoolId,
              level: platformGrade.level,
              order: platformGrade.order
            }
          });
        })
      );
      
      console.log(`✅ Created ${createdGrades.length} school-specific grades`);
      return createdGrades;
    } else {
      console.log(`✅ All school-specific grades already exist`);
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error ensuring school grades:', error);
    throw error;
  }
}

export async function getOrCreateSchoolGrade(schoolId: string, gradeName: string) {
  try {
    // First try to find existing school-specific grade
    let grade = await prisma.grade.findFirst({
      where: {
        name: gradeName,
        schoolId: schoolId
      }
    });
    
    // If not found, try to find platform-level grade
    if (!grade) {
      grade = await prisma.grade.findFirst({
        where: {
          name: gradeName,
          schoolId: null
        }
      });
    }
    
    // If platform-level grade exists, create school-specific version
    if (grade && grade.schoolId !== schoolId) {
      grade = await prisma.grade.create({
        data: {
          name: grade.name,
          description: grade.description || `Grade ${grade.name}`,
          schoolId: schoolId,
          level: grade.level,
          order: grade.order
        }
      });
    }
    
    return grade;
  } catch (error) {
    console.error('❌ Error getting or creating school grade:', error);
    throw error;
  }
} 