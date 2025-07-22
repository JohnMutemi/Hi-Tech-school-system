// Test script for the new payment form logic
const testPayment = async () => {
  const schoolCode = 'demo-school';
  const studentId = 'test-student-id';
  
  const paymentData = {
    studentId,
    amount: 5000,
    paymentMethod: 'mpesa',
    feeType: 'Tuition',
    academicYear: '2025', // Using name instead of ID
    term: 'Term 1', // Using name instead of ID
    description: 'Tuition - Term 1 2025',
    phoneNumber: '254700000000'
  };

  console.log('Testing payment with data:', paymentData);

  try {
    const response = await fetch(`http://localhost:3000/api/schools/${schoolCode}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment successful:', result);
    } else {
      console.log('❌ Payment failed:', result);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testPayment();
}

module.exports = { testPayment }; 