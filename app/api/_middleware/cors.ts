import { NextRequest, NextResponse } from 'next/server'

export async function corsMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    
    response.status = 200
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }
  
  return response
}