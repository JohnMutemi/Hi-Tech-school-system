import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  console.log('🔍 GET /api/schools/[schoolCode]/promotions/test called');
  console.log('📋 Params:', params);
  console.log('🔗 URL:', request.url);
  
  return NextResponse.json({
    success: true,
    message: 'Promotions test route is working',
    schoolCode: params.schoolCode,
    timestamp: new Date().toISOString()
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  console.log('🔍 POST /api/schools/[schoolCode]/promotions/test called');
  console.log('📋 Params:', params);
  console.log('🔗 URL:', request.url);
  
  const body = await request.json();
  console.log('📦 Request body:', body);
  
  return NextResponse.json({
    success: true,
    message: 'Promotions test POST route is working',
    schoolCode: params.schoolCode,
    receivedData: body,
    timestamp: new Date().toISOString()
  });
} 