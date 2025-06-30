// Test script to verify payment API
const testPaymentAPI = async () => {
  try {
    // Test the payment API with sample data
    const paymentData = {
      studentId: "test-student-id",
      amount: 5000,
      paymentMethod: "mpesa",
      feeType: "School Fees",
      term: "Term 2",
      academicYear: "2025",
      phoneNumber: "254700000000",
      description: "School Fees - Term 2 2025"
    };

    console.log('Testing payment API with data:', paymentData);
    
    const response = await fetch('http://localhost:3000/api/schools/alliance/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Payment successful:', data);
    } else {
      const errorData = await response.text();
      console.log('Payment failed:', errorData);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testPaymentAPI(); 