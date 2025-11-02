import { NextRequest, NextResponse } from 'next/server'

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ service: string }> }
) {
  const { service } = await context.params
  try {
    const userId = getUserId(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate service parameter
    const validServices = ['google-calendar', 'outlook', 'apple-calendar', 'todoist', 'clickup']
    if (!validServices.includes(service)) {
      return NextResponse.json(
        { error: 'Invalid service parameter' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { redirectUri, scopes } = body

    // Simulate OAuth flow initiation
    const authUrl = `https://auth.${service}.com/oauth/authorize?` +
      `client_id=mock-client-id&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes?.join(' ') || '')}&` +
      `response_type=code&` +
      `state=${userId}`

    return NextResponse.json({
      authUrl,
      service,
      message: 'OAuth flow initiated successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Error initiating OAuth flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}