import { NextResponse } from 'next/server';

// Single super admin credentials
const SUPER_ADMIN = {
  email: 'admin@hitechsms.co.ke',
  password: 'admin123',
  name: 'Super Admin',
  role: 'super_admin'
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Simple credential check for super admin only
    if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
      // Return success immediately with user data
      return NextResponse.json({
        success: true,
        user: {
          email: SUPER_ADMIN.email,
          name: SUPER_ADMIN.name,
          role: SUPER_ADMIN.role
        }
      });
    }

    // Return error for invalid credentials
    return NextResponse.json(
      { error: 'Invalid super admin credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Super admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}