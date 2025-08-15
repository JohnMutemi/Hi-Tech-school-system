// Debug script to check email configuration URLs
// Run this in browser console to debug the issue

console.log('🔍 DEBUGGING EMAIL CONFIG URLS');

// Test the correct URL structure
const schoolCode = 'mal9148';
const correctGetUrl = `/api/schools/${schoolCode}/email-config`;
const correctPutUrl = `/api/schools/${schoolCode}/email-config`;

console.log('✅ Correct GET URL:', correctGetUrl);
console.log('✅ Correct PUT URL:', correctPutUrl);

// Test fetch to see if the endpoint responds
fetch(correctGetUrl)
  .then(response => {
    console.log('📡 GET Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📧 Email config data:', data);
  })
  .catch(error => {
    console.error('❌ GET Error:', error);
  });

// Check if there are any cached URLs
console.log('🧹 Clear any cached URLs by hard refresh: Ctrl+F5');



