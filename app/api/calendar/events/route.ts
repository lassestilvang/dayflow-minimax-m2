import { NextRequest, NextResponse } from 'next/server'
import { calendarEventRepository } from '@/lib/data-access'
import { validateEventData } from '@/lib/validations/schemas'

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const events = await calendarEventRepository.findByUserId(userId)
    return NextResponse.json(events, { status: 200 })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = validateEventData(body)
    
    if (!validation.success) {
      const errorMessage = validation.error instanceof Error ? validation.error.message : 'Validation failed'
      return NextResponse.json(
        { error: 'Validation failed', message: errorMessage },
        { status: 400 }
      )
    }

    // Check for conflicts
    const conflicts = await calendarEventRepository.findConflicts(
      userId,
      (validation as any).data.startTime,
      (validation as any).data.endTime
    )

    // Create the event (conflicts are handled by the client)
    const event = await calendarEventRepository.create({
      ...(validation as any).data,
      userId
    })
    
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}