const fetch = require('node-fetch');

async function testFeeAPI() {
  try {
    console.log('🔍 Testing fee structure API...');
    
    // Test with Dismas Primary School which we know has fee structures
    const schoolCode = 'dis8651';
    const url = `http://localhost:3000/api/schools/${schoolCode}/fee-structure`;
    
    console.log(`📡 Calling API: ${url}`);
    
    const response = await fetch(url);
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API returned ${data.length} fee structures`);
      
      if (data.length > 0) {
        data.forEach((fee, index) => {
          console.log(`\n${index + 1}. Fee Structure:`);
          console.log(`   - ID: ${fee.id}`);
          console.log(`   - Grade: ${fee.gradeName || fee.grade?.name}`);
          console.log(`   - Term: ${fee.term}`);
          console.log(`   - Year: ${fee.year}`);
          console.log(`   - Total Amount: ${fee.totalAmount}`);
          console.log(`   - Is Active: ${fee.isActive}`);
          console.log(`   - Creator: ${fee.creator?.name}`);
          console.log(`   - Academic Year: ${fee.academicYear?.name}`);
          console.log(`   - Term Ref: ${fee.termRef?.name}`);
        });
      } else {
        console.log('❌ No fee structures returned');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testFeeAPI(); 