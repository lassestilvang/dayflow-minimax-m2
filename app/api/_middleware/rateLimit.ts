import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting (for testing purposes)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const WINDOW_SIZE = 60000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute

export async function rateLimitMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'
  
  const now = Date.now()
  const clientData = rateLimitMap.get(clientIp)
  
  if (!clientData || now > clientData.resetTime) {
    // New window or expired window
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + WINDOW_SIZE
    })
    return response
  }
  
  clientData.count++
  
  if (clientData.count > MAX_REQUESTS) {
    response.status = 429
    response.headers.set('Retry-After', Math.ceil((clientData.resetTime - now) / 1000).toString())
    response.body = JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Max ${MAX_REQUESTS} requests per ${WINDOW_SIZE / 60000} minute.`
    })
    return response
  }
  
  return response
}