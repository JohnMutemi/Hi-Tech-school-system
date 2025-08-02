# Bulk Import System Guide

## Overview
The Hi-Tech School Management System now includes a comprehensive bulk import system that allows you to import large amounts of data for various entities using Excel or CSV files.

## Supported Entity Types
- **Students** - Import students with parent information
- **Teachers** - Import teachers with qualifications and assignments
- **Classes** - Import classes with grade and teacher assignments
- **Fee Structures** - Import fee structures for different categories
- **Grades** - Import grade levels
- **Subjects** - Import subjects with teacher assignments

## Field Mappings

### Students Import
**Required Fields:**
- `Name` - Student's full name
- `Admission Number` - Unique admission number
- `Parent Name` - Parent's full name
- `Parent Phone` - Parent's phone number

**Optional Fields:**
- `Email` - Student's email address (if not provided, will use admission number + @school.local)
- `Date of Birth` - Student's date of birth (YYYY-MM-DD format)
- `Gender` - Student's gender
- `Address` - Student's address
- `Parent Email` - Parent's email address
- `Class` - Class assignment
- `Status` - Student status (default: 'active')
- `Notes` - Additional notes

**Example Row:**
```
Name,Admission Number,Email,Date of Birth,Gender,Address,Parent Name,Parent Email,Parent Phone,Class,Status,Notes
John Doe,ADM001,john.doe@school.com,2010-05-15,Male,123 Main St,Jane Doe,jane.doe@email.com,+254700000000,Form 1A,active,New student
```

### Teachers Import
**Required Fields:**
- `Name` - Teacher's full name
- `Email` - Teacher's email address
- `Phone` - Teacher's phone number (with country code, e.g., +254700000001)

**Optional Fields:**
- `Employee ID` - Employee identification number
- `Qualification` - Teacher's qualification
- `Date Joined` - Date teacher joined (YYYY-MM-DD format or Excel date)
- `Assigned Class` - Class assignment
- `Academic Year` - Academic year
- `Status` - Teacher status (default: 'active')

**Example Row:**
```
Name,Email,Phone,Employee ID,Qualification,Date Joined,Assigned Class,Academic Year,Status
Jane Smith,jane.smith@school.com,+254700000001,EMP001,B.Ed Mathematics,2024-01-15,Form 1A,2024,active
```

**Important Notes:**
- Phone numbers should include country code (e.g., +254 for Kenya)
- If phone number doesn't include country code, the system will automatically add +254
- Dates can be in YYYY-MM-DD format or Excel date format

### Classes Import
**Required Fields:**
- `Name` - Class name
- `Grade` - Grade level (must exist in the system)
- `Academic Year` - Academic year

**Optional Fields:**
- `Teacher Email` - Email of assigned teacher (must exist in the system)
- `Is Active` - Whether class is active (TRUE/FALSE)

**Example Row:**
```
Name,Grade,Teacher Email,Academic Year,Is Active
Form 1A,Form 1,jane.smith@school.com,2024,TRUE
```

### Fee Structures Import
**Required Fields:**
- `Name` - Fee structure name
- `Amount` - Fee amount (numeric value)
- `Frequency` - Payment frequency (monthly, termly, yearly, etc.)

**Optional Fields:**
- `Description` - Fee description
- `Due Date` - Due date (YYYY-MM-DD format)
- `Is Active` - Whether fee structure is active (TRUE/FALSE)

**Example Row:**
```
Name,Description,Amount,Frequency,Due Date,Is Active
Tuition Fee,Monthly tuition fee,5000,monthly,2024-02-01,TRUE
```

### Grades Import
**Required Fields:**
- `Name` - Grade name

**Optional Fields:**
- `Is Alumni` - Whether this is an alumni grade (TRUE/FALSE)

**Example Row:**
```
Name,Is Alumni
Form 1,FALSE
Form 2,FALSE
Form 3,FALSE
Form 4,TRUE
```

### Subjects Import
**Required Fields:**
- `Name` - Subject name
- `Code` - Subject code

**Optional Fields:**
- `Description` - Subject description
- `Teacher Email` - Email of assigned teacher (must exist in the system)

**Example Row:**
```
Name,Code,Description,Teacher Email
Mathematics,MATH101,Core mathematics subject,jane.smith@school.com
English,ENG101,Core English subject,john.doe@school.com
```

## How to Use

### 1. Download Template
1. Click the "Import [Entity Type]" button
2. Click "Download Template" to get the correct Excel format
3. The template will contain example data and the correct headers

### 2. Prepare Your Data
1. Open the downloaded template
2. Replace the example data with your actual data
3. Ensure all required fields are filled
4. Save the file as Excel (.xlsx) or CSV format

### 3. Import Data
1. Click "Import [Entity Type]" button
2. Click "Choose File" or drag and drop your file
3. Review the data preview (first 5 rows)
4. Click "Import" to start the process
5. Monitor the progress bar
6. Review the results showing successful imports and any errors

## Important Notes

### Field Consistency
- **Always use the exact field names** as shown in the templates
- Field names are case-sensitive
- Do not add extra spaces or special characters to field names

### Data Validation
- Required fields must be filled
- Email addresses must be valid format
- Phone numbers should include country code
- Dates should be in YYYY-MM-DD format
- Boolean values (Is Active, Is Alumni) should be TRUE/FALSE

### Error Handling
- If a record fails to import, the system will show the specific error
- Common errors include:
  - Missing required fields
  - Invalid email format
  - Duplicate records
  - Referenced entities not found (e.g., teacher email doesn't exist)

### File Format Support
- **Excel files**: .xlsx, .xls
- **CSV files**: .csv
- Maximum file size: 10MB
- Maximum rows: 10,000 per import

## Troubleshooting

### Common Issues

1. **"Missing required fields" error**
   - Check that all required fields are filled
   - Ensure field names match exactly

2. **"Email already exists" error**
   - The email address is already in use
   - Use a different email address

3. **"Grade not found" error**
   - The grade name doesn't exist in the system
   - Import grades first, then classes

4. **"Teacher not found" error**
   - The teacher email doesn't exist in the system
   - Import teachers first, then classes/subjects

### Best Practices

1. **Import in Order**
   - Grades → Teachers → Classes → Students
   - This ensures all references exist

2. **Test with Small Files**
   - Start with a few records to test the format
   - Then import larger files

3. **Backup Data**
   - Always backup existing data before bulk imports
   - Import during off-peak hours

4. **Review Results**
   - Always check the import results
   - Download error reports if needed
   - Fix errors and re-import if necessary

## API Endpoints

The bulk import system uses the following API endpoints:

- `POST /api/schools/{schoolCode}/students/import`
- `POST /api/schools/{schoolCode}/teachers/import`
- `POST /api/schools/{schoolCode}/classes/import`
- `POST /api/schools/{schoolCode}/fee-structure/import`
- `POST /api/schools/{schoolCode}/grades/import`
- `POST /api/schools/{schoolCode}/subjects/import`

## Support

If you encounter issues with the bulk import system:

1. Check the error messages in the import results
2. Verify your data format matches the templates
3. Ensure all required fields are filled
4. Check that referenced entities exist in the system
5. Contact system administrator for technical support 