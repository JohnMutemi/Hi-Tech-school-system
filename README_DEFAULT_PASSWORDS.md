# Default Password System

## Overview
This system implements common default passwords for first-time logins across all user types.

## Default Passwords
- **Students**: `student123`
- **Parents**: `parent123` 
- **Teachers**: `teacher123`
- **School Admins**: `school123`

## Implementation
- All new users get `mustChangePassword: true` in database
- Users must change password on first login
- Default passwords are hashed before storage
- Plain text passwords shown to admins after user creation

## Files Updated
- `lib/utils/default-passwords.ts` - Utility functions
- `app/api/schools/[schoolCode]/students/route.ts` - Student creation
- `app/api/schools/[schoolCode]/teachers/route.ts` - Teacher creation  
- `app/api/schools/route.ts` - School admin creation
- `lib/actions/school-actions.ts` - School creation client
- `components/school-portal/school-setup-dashboard.tsx` - Frontend updates

## Security
- Passwords hashed with bcrypt (12 rounds)
- First-time login enforcement
- Password reset functionality available 