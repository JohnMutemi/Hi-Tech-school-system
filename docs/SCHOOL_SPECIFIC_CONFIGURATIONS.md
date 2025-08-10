# School-Specific Configurations Guide

## Overview

This guide explains how to ensure that all data and configurations in your SaaS school management system are properly scoped to individual schools, preventing data leakage between different school tenants.

## Current Architecture

Your application is correctly designed with a multi-tenant architecture where:

- Each school has a unique `schoolCode`
- All major entities have a `schoolId` field that links them to a specific school
- Database relationships ensure data isolation

## Key Components

### 1. School Context Manager (`/lib/school-context.ts`)

The `SchoolDataManager` class provides utilities to ensure school-specific data isolation:

```typescript
import { withSchoolContext } from '@/lib/school-context';

// Initialize school context
const schoolManager = withSchoolContext(schoolCode);
const schoolContext = await schoolManager.initialize();

// Get school-specific data
const teachers = await schoolManager.getTeachers();
const students = await schoolManager.getStudents();
const classes = await schoolManager.getClasses();
```

### 2. Database Schema

All entities that should be school-specific have a `schoolId` field:

- `User` (teachers, admins, parents)
- `Student`
- `Class`
- `Subject`
- `Grade`
- `FeeStructure`
- `TermlyFeeStructure`
- `PromotionCriteria`
- `AcademicYear`
- `Term`

## Implementation Checklist

### ✅ API Endpoints

Ensure all API endpoints use the school context manager:

1. **Teachers API** (`/api/schools/[schoolCode]/teachers/route.ts`)
   - ✅ Updated to use `SchoolDataManager`
   - ✅ Validates school ownership before updates/deletes
   - ✅ Filters teachers by `schoolId`

2. **Students API** (`/api/schools/[schoolCode]/students/route.ts`)
   - ✅ Updated to use `SchoolDataManager`
   - ✅ Filters students by `schoolId`

3. **Classes API** (`/api/schools/[schoolCode]/classes/route.ts`)
   - ✅ Should filter classes by `schoolId`

4. **Subjects API** (`/api/schools/[schoolCode]/subjects/route.ts`)
   - ✅ Should filter subjects by `schoolId`

5. **Fee Structures API** (`/api/schools/[schoolCode]/fee-structure/route.ts`)
   - ✅ Should filter fee structures by `schoolId`

### 🔄 Frontend Components

Update frontend components to ensure they only display school-specific data:

1. **Dashboard Components**
   - ✅ `SchoolSetupDashboard` - Uses `schoolCode` for API calls
   - ✅ `StaffSection` - Fetches teachers for specific school
   - ✅ `StudentsSection` - Fetches students for specific school
   - ✅ `SubjectsClassesSection` - Fetches classes/subjects for specific school

2. **Settings Components**
   - ✅ `AdmissionNumberSettings` - Updates school-specific admission settings
   - ✅ `FeeManagement` - Manages school-specific fee structures

### 🔄 Database Queries

Always include school-specific filtering in database queries:

```typescript
// ✅ Correct - School-specific query
const students = await prisma.student.findMany({
  where: {
    schoolId: schoolContext.schoolId,
    isActive: true
  }
});

// ❌ Incorrect - No school filtering
const students = await prisma.student.findMany({
  where: { isActive: true }
});
```

## Common Issues and Solutions

### Issue 1: Teachers Available Across All Schools

**Problem**: Teachers created in one school appear in another school's teacher list.

**Solution**: 
- ✅ Updated teachers API to filter by `schoolId`
- ✅ Added school ownership validation for updates/deletes
- ✅ Ensure frontend only displays teachers for the current school

### Issue 2: Admission Settings Applied Globally

**Problem**: Admission number settings from one school affect other schools.

**Solution**:
- ✅ Admission settings are stored per school in the `School` model
- ✅ `lastAdmissionNumber`, `admissionNumberFormat`, `admissionNumberAutoIncrement` are school-specific
- ✅ API endpoints update only the current school's settings

### Issue 3: Fee Structures Shared Between Schools

**Problem**: Fee structures created in one school are visible in other schools.

**Solution**:
- ✅ Fee structures have `schoolId` field
- ✅ API endpoints filter fee structures by `schoolId`
- ✅ Frontend components fetch only school-specific fee structures

### Issue 4: Students Visible Across Schools

**Problem**: Students from one school appear in another school's student list.

**Solution**:
- ✅ Students have `schoolId` field
- ✅ API endpoints filter students by `schoolId`
- ✅ Frontend components fetch only school-specific students

## Best Practices

### 1. Always Use School Context

```typescript
// ✅ Use school context manager
const schoolManager = withSchoolContext(schoolCode);
await schoolManager.initialize();

// ✅ Get school-specific data
const data = await schoolManager.getSpecificData();
```

### 2. Validate School Ownership

```typescript
// ✅ Validate before updates/deletes
const isValid = await schoolManager.validateSchoolOwnership(resourceId, model);
if (!isValid) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

### 3. Use School-Specific Where Clauses

```typescript
// ✅ Always include schoolId in queries
const whereClause = {
  schoolId: schoolContext.schoolId,
  // ... other filters
};
```

### 4. Frontend Data Fetching

```typescript
// ✅ Fetch data for specific school
const response = await fetch(`/api/schools/${schoolCode}/teachers`);
const teachers = await response.json();
```

## Testing School Isolation

### 1. Create Test Schools

```sql
-- Create test schools
INSERT INTO schools (code, name, address, phone, email) 
VALUES 
  ('SCHOOL1', 'Test School 1', 'Address 1', '1234567890', 'school1@test.com'),
  ('SCHOOL2', 'Test School 2', 'Address 2', '0987654321', 'school2@test.com');
```

### 2. Test Data Isolation

1. Create teachers in School 1
2. Verify they don't appear in School 2's teacher list
3. Create students in School 1
4. Verify they don't appear in School 2's student list
5. Set admission settings in School 1
6. Verify they don't affect School 2's admission numbers

### 3. Test API Endpoints

```bash
# Test school-specific teacher listing
curl -X GET "http://localhost:3000/api/schools/SCHOOL1/teachers"
curl -X GET "http://localhost:3000/api/schools/SCHOOL2/teachers"

# Verify different results
```

## Monitoring and Maintenance

### 1. Database Auditing

Regularly audit database queries to ensure school filtering:

```sql
-- Check for queries without school filtering
SELECT * FROM students WHERE schoolId IS NULL;
SELECT * FROM users WHERE schoolId IS NULL;
```

### 2. API Monitoring

Monitor API endpoints to ensure they return only school-specific data:

```typescript
// Add logging to track school context usage
console.log(`[${schoolCode}] Fetching teachers`);
```

### 3. Frontend Validation

Add frontend validation to ensure school context is always present:

```typescript
// Validate school context in components
if (!schoolCode) {
  throw new Error('School context is required');
}
```

## Migration Guide

If you have existing data that needs to be properly scoped:

### 1. Identify Orphaned Records

```sql
-- Find records without schoolId
SELECT * FROM users WHERE schoolId IS NULL;
SELECT * FROM students WHERE schoolId IS NULL;
```

### 2. Assign School IDs

```sql
-- Assign school IDs to orphaned records (example)
UPDATE users SET schoolId = 'default-school-id' WHERE schoolId IS NULL;
```

### 3. Verify Data Integrity

```sql
-- Verify all records have schoolId
SELECT COUNT(*) FROM users WHERE schoolId IS NULL;
SELECT COUNT(*) FROM students WHERE schoolId IS NULL;
```

## Conclusion

By following this guide and using the `SchoolDataManager`, you ensure that:

1. ✅ All data is properly scoped to individual schools
2. ✅ No data leakage between school tenants
3. ✅ Proper validation of school ownership
4. ✅ Consistent school-specific filtering across the application
5. ✅ Maintainable and scalable multi-tenant architecture

The key is to always use the school context manager and ensure every database query includes school-specific filtering. 