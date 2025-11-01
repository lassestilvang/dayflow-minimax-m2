import { NextRequest, NextResponse } from 'next/server'

export async function authMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  // Check for required authentication header
  const userId = request.headers.get('x-user-id')
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Add user info to request for downstream handlers
  request.headers.set('x-user-id', userId)
  
  return response
}