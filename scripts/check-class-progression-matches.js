// Script: check-class-progression-matches.js
// Checks for mismatches between ClassProgression.toClass and Class.name

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({ where: { isActive: true } });
  const progressions = await prisma.classProgression.findMany({ where: { isActive: true } });

  const classNames = new Set(classes.map(c => c.name));
  const toClassNames = new Set(progressions.map(p => p.toClass));

  // 1. Progression toClass with no matching class
  const missingClasses = Array.from(toClassNames).filter(name => !classNames.has(name));
  if (missingClasses.length) {
    console.log('Progression rules with toClass not found in Class table:');
    for (const name of missingClasses) {
      console.log(`  toClass: "${name}"`);
    }
  } else {
    console.log('All progression toClass values have matching Class records.');
  }

  // 2. Classes not referenced by any progression rule
  const unusedClasses = Array.from(classNames).filter(name => !toClassNames.has(name));
  if (unusedClasses.length) {
    console.log('\nClasses not referenced by any progression rule:');
    for (const name of unusedClasses) {
      console.log(`  class: "${name}"`);
    }
  } else {
    console.log('All classes are referenced by at least one progression rule.');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 