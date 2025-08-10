# Quick Fix Guide: School-Specific Configurations

## 🚨 Immediate Issues to Fix

Your SaaS application has data isolation issues where settings and data from one school are affecting other schools. Here's how to fix it immediately:

## ✅ What's Already Fixed

1. **Teachers API** - Updated to use school context manager
2. **Students API** - Updated to use school context manager  
3. **School Context Manager** - Created utility for proper data isolation
4. **Audit Script** - Created to identify and fix orphaned records

## 🔧 Immediate Actions Required

### 1. Run the Audit Script

```bash
# Install tsx if not already installed
npm install -g tsx

# Run the audit script
npm run audit:school-isolation
```

This will:
- Identify orphaned records without `schoolId`
- Show you exactly what data is leaking between schools
- Optionally fix the issues automatically

### 2. Update Remaining API Endpoints

The following API endpoints need to be updated to use the school context manager:

- `/api/schools/[schoolCode]/classes/route.ts`
- `/api/schools/[schoolCode]/subjects/route.ts`
- `/api/schools/[schoolCode]/fee-structure/route.ts`
- `/api/schools/[schoolCode]/grades/route.ts`

### 3. Check Frontend Components

Ensure these components are using school-specific API calls:

- `StaffSection` - ✅ Already fixed
- `StudentsSection` - ✅ Already fixed
- `SubjectsClassesSection` - Needs verification
- `FeeManagement` - Needs verification

## 🎯 Key Problems Solved

### Problem 1: Teachers Available Across All Schools
**Status**: ✅ FIXED
- Teachers API now filters by `schoolId`
- School ownership validation added
- Teachers are now school-specific

### Problem 2: Admission Settings Applied Globally  
**Status**: ✅ ALREADY CORRECT
- Admission settings are stored per school in the `School` model
- `lastAdmissionNumber`, `admissionNumberFormat` are school-specific
- No changes needed

### Problem 3: Fee Structures Shared Between Schools
**Status**: 🔄 NEEDS VERIFICATION
- Fee structures have `schoolId` field in schema
- Need to verify API endpoints filter by school

### Problem 4: Students Visible Across Schools
**Status**: ✅ FIXED
- Students API now filters by `schoolId`
- Students are now school-specific

## 🧪 Testing Your Fixes

### Test 1: Create Two Test Schools
```sql
INSERT INTO schools (code, name, address, phone, email) 
VALUES 
  ('TEST1', 'Test School 1', 'Address 1', '1234567890', 'school1@test.com'),
  ('TEST2', 'Test School 2', 'Address 2', '0987654321', 'school2@test.com');
```

### Test 2: Add Teachers to School 1
- Go to School 1's dashboard
- Add a teacher
- Verify the teacher only appears in School 1's teacher list

### Test 3: Check School 2
- Go to School 2's dashboard
- Verify the teacher from School 1 does NOT appear in School 2's teacher list

### Test 4: Test Admission Settings
- Set admission number format in School 1
- Verify it doesn't affect School 2's admission numbers

## 📋 Checklist

- [ ] Run audit script: `npm run audit:school-isolation`
- [ ] Update remaining API endpoints to use school context
- [ ] Test teacher isolation between schools
- [ ] Test student isolation between schools  
- [ ] Test admission settings isolation
- [ ] Test fee structure isolation
- [ ] Verify frontend components use school-specific data

## 🆘 If You Still See Issues

1. **Check Database**: Look for records with `schoolId = NULL`
2. **Check API Logs**: Ensure endpoints are filtering by school
3. **Check Frontend**: Ensure components are passing `schoolCode` to APIs
4. **Run Audit Again**: The audit script will show you exactly what's wrong

## 📞 Next Steps

After running the audit script and fixing the immediate issues:

1. Read the full guide: `docs/SCHOOL_SPECIFIC_CONFIGURATIONS.md`
2. Implement the remaining API endpoint updates
3. Add monitoring to prevent future data leaks
4. Set up regular audits to catch issues early

## 🎉 Expected Results

After implementing these fixes:

- ✅ Teachers will only be visible in their assigned school
- ✅ Students will only be visible in their assigned school  
- ✅ Admission settings will be school-specific
- ✅ Fee structures will be school-specific
- ✅ All data will be properly isolated between schools
- ✅ No more data leakage between tenants 