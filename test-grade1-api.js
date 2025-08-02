const fetch = require('node-fetch');

async function testGrade1API() {
  try {
    console.log('🌐 TESTING GRADE 1 API ENDPOINTS');
    console.log('==================================\n');

    const schoolCode = 'commodo excepteur te';
    const baseUrl = 'http://localhost:3000';

    // 1. Test school info
    console.log('1️⃣ Testing School Info:');
    console.log(`GET ${baseUrl}/api/schools/${schoolCode}`);
    
    try {
      const schoolRes = await fetch(`${baseUrl}/api/schools/${schoolCode}`);
      if (schoolRes.ok) {
        const schoolData = await schoolRes.json();
        console.log('✅ School found:', schoolData.name);
        console.log('   School ID:', schoolData.id);
      } else {
        console.log('❌ School not found');
        return;
      }
    } catch (error) {
      console.log('❌ Error fetching school:', error.message);
      return;
    }
    console.log('');

    // 2. Test academic years
    console.log('2️⃣ Testing Academic Years:');
    console.log(`GET ${baseUrl}/api/schools/${schoolCode}/academic-years`);
    
    try {
      const yearsRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/academic-years`);
      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        console.log('✅ Academic years found:', yearsData.length);
        yearsData.forEach((year, index) => {
          console.log(`   ${index + 1}. ${year.name} (ID: ${year.id}) - Current: ${year.isCurrent}`);
        });
      } else {
        console.log('❌ Failed to fetch academic years');
      }
    } catch (error) {
      console.log('❌ Error fetching academic years:', error.message);
    }
    console.log('');

    // 3. Test terms for current year
    console.log('3️⃣ Testing Terms:');
    console.log(`GET ${baseUrl}/api/schools/${schoolCode}/terms?yearId=CURRENT_YEAR_ID`);
    
    try {
      // First get current year
      const yearsRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/academic-years`);
      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        const currentYear = yearsData.find(y => y.isCurrent);
        
        if (currentYear) {
          const termsRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/terms?yearId=${currentYear.id}`);
          if (termsRes.ok) {
            const termsData = await termsRes.json();
            console.log('✅ Terms found:', termsData.length);
            termsData.forEach((term, index) => {
              console.log(`   ${index + 1}. ${term.name} (ID: ${term.id}) - Current: ${term.isCurrent}`);
            });
          } else {
            console.log('❌ Failed to fetch terms');
          }
        } else {
          console.log('❌ No current academic year found');
        }
      }
    } catch (error) {
      console.log('❌ Error fetching terms:', error.message);
    }
    console.log('');

    // 4. Test fee structures for Grade 1
    console.log('4️⃣ Testing Fee Structures:');
    console.log(`GET ${baseUrl}/api/schools/${schoolCode}/fee-structure?gradeId=GRADE_1_ID&year=2025`);
    
    try {
      // We'll test with different grade patterns
      const gradePatterns = ['1', 'Grade 1', 'grade 1', 'GRADE 1'];
      
      for (const pattern of gradePatterns) {
        console.log(`   Testing pattern: "${pattern}"`);
        
        // Test with year parameter
        const feeRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/fee-structure?year=2025&gradeId=${pattern}`);
        if (feeRes.ok) {
          const feeData = await feeRes.json();
          console.log(`   ✅ Found ${feeData.length} fee structures for pattern "${pattern}"`);
          feeData.forEach((fee, index) => {
            console.log(`      ${index + 1}. ${fee.term} ${fee.year} - KES ${fee.totalAmount?.toLocaleString() || '0'}`);
            console.log(`         Grade: ${fee.gradeName || fee.grade?.name || 'N/A'}`);
            console.log(`         Active: ${fee.isActive}`);
          });
        } else {
          console.log(`   ❌ No fee structures found for pattern "${pattern}"`);
        }
      }
    } catch (error) {
      console.log('❌ Error fetching fee structures:', error.message);
    }
    console.log('');

    // 5. Test parent login to get students
    console.log('5️⃣ Testing Parent Login:');
    console.log(`POST ${baseUrl}/api/schools/${schoolCode}/parents/login`);
    
    try {
      const loginRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/parents/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'hedyhywi@mailinator.com',
          password: 'password123' // You might need to adjust this
        })
      });
      
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        console.log('✅ Parent login successful');
        console.log('   Parent ID:', loginData.parent?.id);
        console.log('   Students count:', loginData.students?.length || 0);
        
        // 6. Test student fees for each student
        if (loginData.students && loginData.students.length > 0) {
          console.log('');
          console.log('6️⃣ Testing Student Fees:');
          
          for (const student of loginData.students) {
            console.log(`   Testing fees for: ${student.name || student.user?.name} (ID: ${student.id})`);
            console.log(`   GET ${baseUrl}/api/schools/${schoolCode}/students/${student.id}/fees`);
            
            try {
              const feesRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/students/${student.id}/fees`);
              if (feesRes.ok) {
                const feesData = await feesRes.json();
                console.log(`   ✅ Fees data retrieved for ${student.name || student.user?.name}`);
                console.log(`      Student: ${feesData.student?.name || 'N/A'}`);
                console.log(`      Grade: ${feesData.student?.gradeName || 'N/A'}`);
                console.log(`      Class: ${feesData.student?.className || 'N/A'}`);
                console.log(`      Term Balances: ${feesData.termBalances?.length || 0}`);
                console.log(`      Academic Year Outstanding: KES ${feesData.academicYearOutstanding?.toLocaleString() || '0'}`);
                console.log(`      Total Outstanding: KES ${feesData.outstanding?.toLocaleString() || '0'}`);
                
                if (feesData.termBalances && feesData.termBalances.length > 0) {
                  console.log(`      Term Breakdown:`);
                  feesData.termBalances.forEach((term, index) => {
                    console.log(`        ${index + 1}. ${term.term} ${term.year} - KES ${term.totalAmount?.toLocaleString() || '0'} (Balance: KES ${term.balance?.toLocaleString() || '0'})`);
                  });
                }
                
                console.log(`      Payment History: ${feesData.paymentHistory?.length || 0} payments`);
              } else {
                const errorData = await feesRes.json();
                console.log(`   ❌ Failed to get fees: ${errorData.error || feesRes.statusText}`);
              }
            } catch (error) {
              console.log(`   ❌ Error fetching fees: ${error.message}`);
            }
            console.log('');
          }
        }
      } else {
        console.log('❌ Parent login failed');
        const errorData = await loginRes.json();
        console.log('   Error:', errorData.error || loginRes.statusText);
      }
    } catch (error) {
      console.log('❌ Error during parent login:', error.message);
    }

    console.log('✅ API TESTING COMPLETE');

  } catch (error) {
    console.error('❌ Error during API testing:', error);
  }
}

// Run the API test
testGrade1API(); 