import bcrypt from "bcryptjs";

// Default passwords for first-time logins
export const DEFAULT_PASSWORDS = {
  STUDENT: 'student123',
  PARENT: 'parent123',
  TEACHER: 'teacher123',
  SCHOOL_ADMIN: 'school123',
  BURSAR: 'bursar123',
} as const;

export type UserRole = keyof typeof DEFAULT_PASSWORDS;

/**
 * Get the default password for a user role
 */
export function getDefaultPassword(role: UserRole): string {
  return DEFAULT_PASSWORDS[role];
}

/**
 * Hash a default password for storage
 */
export async function hashDefaultPassword(role: UserRole): Promise<string> {
  const password = getDefaultPassword(role);
  return await bcrypt.hash(password, 12);
}

/**
 * Check if a password matches the default password for a role
 */
export async function isDefaultPassword(password: string, role: UserRole): Promise<boolean> {
  const defaultPassword = getDefaultPassword(role);
  return password === defaultPassword;
}

/**
 * Get the default password for a user role based on the role string
 */
export function getDefaultPasswordByRole(role: string): string {
  switch (role.toLowerCase()) {
    case 'student':
      return DEFAULT_PASSWORDS.STUDENT;
    case 'parent':
      return DEFAULT_PASSWORDS.PARENT;
    case 'teacher':
      return DEFAULT_PASSWORDS.TEACHER;
    case 'admin':
      return DEFAULT_PASSWORDS.SCHOOL_ADMIN;
    case 'bursar':
      return DEFAULT_PASSWORDS.BURSAR;
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

/**
 * Hash a default password for storage based on role string
 */
export async function hashDefaultPasswordByRole(role: string): Promise<string> {
  const password = getDefaultPasswordByRole(role);
  return await bcrypt.hash(password, 12);
}
