import { NextRequest, NextResponse } from 'next/server'

interface Params {
  params: {
    service: string
  }
}

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
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
    if (!validServices.includes(params.service)) {
      return NextResponse.json(
        { error: 'Invalid service parameter' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { redirectUri, scopes } = body

    // Simulate OAuth flow initiation
    const authUrl = `https://auth.${params.service}.com/oauth/authorize?` +
      `client_id=mock-client-id&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes?.join(' ') || '')}&` +
      `response_type=code&` +
      `state=${userId}`

    return NextResponse.json({
      authUrl,
      service: params.service,
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