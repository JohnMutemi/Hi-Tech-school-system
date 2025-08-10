// Test script for teachers import
const fs = require('fs');
const XLSX = require('xlsx');

// Create test data
const testData = [
  {
    'Name': 'Test Teacher 1',
    'Email': 'test1@school.com',
    'Phone': '+254700000001',
    'Employee ID': 'EMP001',
    'Qualification': 'B.Ed Mathematics',
    'Date Joined': '2024-01-15',
    'Assigned Class': 'Form 1A',
    'Academic Year': '2024',
    'Status': 'active'
  },
  {
    'Name': 'Test Teacher 2',
    'Email': 'test2@school.com',
    'Phone': '+254700000002',
    'Employee ID': 'EMP002',
    'Qualification': 'B.Ed English',
    'Date Joined': '2024-01-16',
    'Assigned Class': 'Form 1B',
    'Academic Year': '2024',
    'Status': 'active'
  }
];

// Create workbook
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(testData);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');

// Write to file
XLSX.writeFile(workbook, 'test-teachers-import.xlsx');

console.log('Test file created: test-teachers-import.xlsx');
console.log('Test data:', testData); 