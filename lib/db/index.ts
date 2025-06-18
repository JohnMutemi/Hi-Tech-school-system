import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// PostgreSQL connection configuration using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create the database instance
export const db = drizzle(pool, { schema });

// Export the pool for direct access if needed
export { pool };

// Function to get database instance
export function getDb() {
  return db;
}

// Client-safe database functions that call API routes
export async function getSchool(schoolCode: string) {
  try {
    const response = await fetch(`/api/schools/${schoolCode}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error fetching school:', error)
    return null
  }
}

export async function getSchools() {
  try {
    const response = await fetch('/api/schools')
    if (!response.ok) return []
    const data = await response.json()
    return data.schools || []
  } catch (error) {
    console.error('Error fetching schools:', error)
    return []
  }
}

export async function getStudentByAdmissionNumber(admissionNumber: string) {
  try {
    const response = await fetch(`/api/students/${admissionNumber}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error fetching student:', error)
    return null
  }
}

export async function getStudentFees(admissionNumber: string) {
  try {
    const response = await fetch(`/api/students/${admissionNumber}/fees`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error fetching student fees:', error)
    return []
  }
}

export async function getPayments(admissionNumber: string) {
  try {
    const response = await fetch(`/api/students/${admissionNumber}/fees`)
    if (!response.ok) return []
    const data = await response.json()
    return data.payments || []
  } catch (error) {
    console.error('Error fetching payments:', error)
    return []
  }
}

export async function getReceipts(admissionNumber: string) {
  try {
    const response = await fetch(`/api/students/${admissionNumber}/fees`)
    if (!response.ok) return []
    const data = await response.json()
    return data.receipts || []
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return []
  }
}

export async function getStudentsByParent(parentId: string) {
  try {
    const response = await fetch(`/api/parents/${parentId}/children`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error fetching children:', error)
    return []
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}

// Mock sql function for development
export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  console.log('Mock sql query:', strings, values);
  // Simulate a database query result
  return [{ id: '1', email: 'admin@hitechsms.co.ke', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQN3JQRwqKPi', role: 'super_admin' }];
};
