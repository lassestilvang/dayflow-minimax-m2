import { NextRequest, NextResponse } from 'next/server'

const MAX_REQUEST_SIZE = 1024 * 1024 // 1MB

export async function sizeMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  // Check Content-Length header
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const sizeInBytes = parseInt(contentLength, 10)
    
    if (sizeInBytes > MAX_REQUEST_SIZE) {
      response.status = 413
      response.body = JSON.stringify({ 
        error: 'Payload too large',
        message: `Request body exceeds ${MAX_REQUEST_SIZE / (1024 * 1024)}MB limit`
      })
      return response
    }
  }
  
  return response
}