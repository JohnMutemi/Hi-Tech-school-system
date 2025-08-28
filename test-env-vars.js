// Test script to check environment variables
require('dotenv').config();

console.log('🔍 Environment Variables Test:');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test the URL generation logic
let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const schoolCode = 'mal9148';
const receiptNumber = 'RCP-1756284891817-1GRZ8S';

console.log('\n🔍 URL Generation Test:');
console.log('Original baseUrl:', baseUrl);
console.log('Has trailing slash:', baseUrl.endsWith('/'));

// Remove trailing slash to avoid double slashes
baseUrl = baseUrl.replace(/\/$/, '');
console.log('Cleaned baseUrl:', baseUrl);

const generatedUrl = `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/view`;
console.log('generatedUrl:', generatedUrl);
