// Test script to verify fee structure API
const testFeeAPI = async () => {
  try {
    // Test the fee structure API with gradeId parameter
    const response = await fetch('http://localhost:3000/api/schools/alliance/fee-structure?term=Term 1&year=2024&gradeId=test-grade-id');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Fee structures:', data);
    } else {
      console.log('Error response:', await response.text());
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testFeeAPI(); 