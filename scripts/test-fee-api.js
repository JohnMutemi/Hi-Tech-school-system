const fetch = require('node-fetch');

async function testFeeStructureAPI() {
  const schoolCode = 'demo'; // Replace with your actual school code
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing Fee Structure API...\n');
  
  try {
    // Test 1: GET fee structures
    console.log('1. Testing GET /api/schools/${schoolCode}/fee-structure');
    const getResponse = await fetch(`${baseUrl}/api/schools/${schoolCode}/fee-structure`);
    console.log('Status:', getResponse.status);
    
    if (getResponse.ok) {
      const feeStructures = await getResponse.json();
      console.log('Fee structures found:', feeStructures.length);
      console.log('Sample fee structure:', feeStructures[0] || 'None');
    } else {
      const error = await getResponse.text();
      console.log('Error:', error);
    }
    
    console.log('\n2. Testing GET with filters');
    const filteredResponse = await fetch(
      `${baseUrl}/api/schools/${schoolCode}/fee-structure?term=Term 1&year=2024&classLevel=Grade 1`
    );
    console.log('Filtered Status:', filteredResponse.status);
    
    if (filteredResponse.ok) {
      const filteredFees = await filteredResponse.json();
      console.log('Filtered fee structures:', filteredFees.length);
    } else {
      const error = await filteredResponse.text();
      console.log('Filtered Error:', error);
    }
    
    console.log('\n3. Testing POST (create fee structure)');
    const testFeeData = {
      term: "Term 1",
      year: 2024,
      classLevel: "Grade 1",
      totalAmount: 50000,
      breakdown: {
        tuition: 30000,
        books: 10000,
        lunch: 5000,
        uniform: 3000,
        transport: 1500,
        other: 500
      },
      isActive: true
    };
    
    const postResponse = await fetch(`${baseUrl}/api/schools/${schoolCode}/fee-structure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testFeeData)
    });
    
    console.log('POST Status:', postResponse.status);
    
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('Created fee structure:', result);
    } else {
      const error = await postResponse.text();
      console.log('POST Error:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testFeeStructureAPI(); 