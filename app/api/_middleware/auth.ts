import { NextRequest, NextResponse } from 'next/server'

export async function authMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  // Check for required authentication header
  const userId = request.headers.get('x-user-id')
  
  if (!userId) {
    response.status = 401
    response.body = JSON.stringify({ error: 'Unauthorized' })
    return response
  }

  // Add user info to request for downstream handlers
  request.headers.set('x-user-id', userId)
  
  return response
}