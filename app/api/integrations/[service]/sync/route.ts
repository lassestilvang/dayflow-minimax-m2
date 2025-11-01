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
    const { syncType = 'incremental', lastSync } = body

    // Simulate sync operation
    const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Mock sync results
    const result = {
      syncId,
      service: params.service,
      syncType,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 5000).toISOString(), // 5 seconds later
      stats: {
        tasksCreated: 5,
        tasksUpdated: 12,
        tasksDeleted: 2,
        eventsCreated: 3,
        eventsUpdated: 8,
        eventsDeleted: 1
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error performing sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}