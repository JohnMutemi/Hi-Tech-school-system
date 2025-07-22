const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePromotionCriteria() {
  try {
    console.log('Updating Merit Promotion criteria...');
    
    // Find the Merit Promotion criteria
    const criteria = await prisma.promotionCriteria.findFirst({
      where: {
        name: 'Merit Promotion',
        isActive: true
      }
    });

    if (!criteria) {
      console.log('Merit Promotion criteria not found');
      return;
    }

    console.log('Current criteria:', {
      id: criteria.id,
      name: criteria.name,
      classLevel: criteria.classLevel,
      maxOutstandingBalance: criteria.maxOutstandingBalance,
      requireFullPayment: criteria.requireFullPayment
    });

    // Update the criteria to set maxOutstandingBalance to 19000
    const updatedCriteria = await prisma.promotionCriteria.update({
      where: { id: criteria.id },
      data: {
        maxOutstandingBalance: 19000,
        requireFullPayment: false // Ensure this is false so it uses maxOutstandingBalance
      }
    });

    console.log('Updated criteria:', {
      id: updatedCriteria.id,
      name: updatedCriteria.name,
      classLevel: updatedCriteria.classLevel,
      maxOutstandingBalance: updatedCriteria.maxOutstandingBalance,
      requireFullPayment: updatedCriteria.requireFullPayment
    });

    console.log('✅ Successfully updated Merit Promotion criteria');
  } catch (error) {
    console.error('Error updating criteria:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePromotionCriteria(); 