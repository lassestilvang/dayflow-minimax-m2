import { NextRequest, NextResponse } from 'next/server'

export async function corsMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    
    const corsResponse = NextResponse.json({}, { status: 200 })
    corsResponse.headers.set('Access-Control-Allow-Origin', origin || '*')
    corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id')
    corsResponse.headers.set('Access-Control-Max-Age', '86400')
    
    return corsResponse
  }
  
  return response
}