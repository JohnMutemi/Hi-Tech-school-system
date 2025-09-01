const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFeeStructures() {
  try {
    console.log('🔧 Fixing fee structures - removing test/mock data...');

    // 1. Get all active fee structures
    const allFeeStructures = await prisma.termlyFeeStructure.findMany({
      where: { isActive: true },
      include: {
        grade: true
      },
      orderBy: [
        { year: 'desc' },
        { term: 'asc' }
      ]
    });

    console.log(`📊 Found ${allFeeStructures.length} active fee structures`);

    // 2. Group by grade and year to identify duplicates
    const grouped = {};
    allFeeStructures.forEach(fs => {
      const key = `${fs.gradeId}-${fs.year}-${fs.term}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(fs);
    });

    // 3. For each group, keep only the most recent one and deactivate others
    let deactivatedCount = 0;
    for (const [key, structures] of Object.entries(grouped)) {
      if (structures.length > 1) {
        console.log(`\n🔍 Found ${structures.length} duplicate structures for ${key}:`);
        
        // Sort by creation date (most recent first)
        structures.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        structures.forEach((fs, index) => {
          console.log(`  ${index + 1}. ID: ${fs.id}, Amount: ${fs.totalAmount}, Created: ${fs.createdAt}`);
        });

        // Keep the first (most recent), deactivate the rest
        for (let i = 1; i < structures.length; i++) {
          await prisma.termlyFeeStructure.update({
            where: { id: structures[i].id },
            data: { isActive: false }
          });
          console.log(`  ❌ Deactivated old structure: ${structures[i].id}`);
          deactivatedCount++;
        }
        
        console.log(`  ✅ Kept most recent structure: ${structures[0].id} (Amount: ${structures[0].totalAmount})`);
      }
    }

    // 4. Set realistic fee amounts for the remaining active structures
    console.log('\n💰 Setting realistic fee amounts...');
    
    const realisticAmounts = {
      'Term 1': 15000, // Term 1 is usually the highest
      'Term 2': 12000, // Term 2 moderate
      'Term 3': 10000  // Term 3 lowest (shorter term)
    };

    const activeFeeStructures = await prisma.termlyFeeStructure.findMany({
      where: { isActive: true },
      include: { grade: true }
    });

    let updatedCount = 0;
    for (const fs of activeFeeStructures) {
      const targetAmount = realisticAmounts[fs.term] || 12000; // Default to 12000 if term not found
      
      if (fs.totalAmount !== targetAmount) {
        await prisma.termlyFeeStructure.update({
          where: { id: fs.id },
          data: { 
            totalAmount: targetAmount,
            updatedAt: new Date()
          }
        });
        
        console.log(`  ✅ Updated ${fs.grade?.name} ${fs.term} ${fs.year}: ${fs.totalAmount} → ${targetAmount}`);
        updatedCount++;
      } else {
        console.log(`  ✓ ${fs.grade?.name} ${fs.term} ${fs.year}: Already correct (${targetAmount})`);
      }
    }

    // 5. Summary
    console.log('\n📋 Summary:');
    console.log(`  • Deactivated ${deactivatedCount} duplicate fee structures`);
    console.log(`  • Updated ${updatedCount} fee amounts to realistic values`);
    console.log('  • Realistic fee structure per term:');
    console.log(`    - Term 1: KES ${realisticAmounts['Term 1'].toLocaleString()}`);
    console.log(`    - Term 2: KES ${realisticAmounts['Term 2'].toLocaleString()}`);
    console.log(`    - Term 3: KES ${realisticAmounts['Term 3'].toLocaleString()}`);
    
    // 6. Show final active fee structures
    const finalStructures = await prisma.termlyFeeStructure.findMany({
      where: { isActive: true },
      include: { grade: true },
      orderBy: [
        { year: 'desc' },
        { term: 'asc' }
      ]
    });

    console.log(`\n✅ Final active fee structures (${finalStructures.length}):`);
    finalStructures.forEach(fs => {
      console.log(`  • ${fs.grade?.name || 'Unknown Grade'} - ${fs.term} ${fs.year}: KES ${fs.totalAmount?.toLocaleString()}`);
    });

    console.log('\n🎉 Fee structures fixed successfully!');
    console.log('💡 Refresh your browser to see the updated amounts.');

  } catch (error) {
    console.error('❌ Error fixing fee structures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFeeStructures();
