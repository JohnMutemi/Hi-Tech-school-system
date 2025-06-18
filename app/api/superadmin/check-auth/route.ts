import { NextResponse } from 'next/server';

export async function GET() {
  // For development, always return authenticated
  // In production, you would verify the token from localStorage
  return NextResponse.json({ 
    authenticated: true,
    user: {
      email: 'admin@hitechsms.co.ke',
      name: 'Super Admin',
      role: 'super_admin'
    }
  });
} 