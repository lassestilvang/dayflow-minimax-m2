import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/data-access'

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
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
    const { action, ids, updates } = body

    // Validate required parameters
    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActions = ['update', 'delete', 'complete']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    let result
    if (action === 'update') {
      if (!updates) {
        return NextResponse.json(
          { error: 'Updates object required for update action' },
          { status: 400 }
        )
      }
      result = await taskRepository.bulkUpdate({ ids, updates })
    } else {
      // For delete and complete actions, perform the operation
      for (const id of ids) {
        if (action === 'delete') {
          await taskRepository.delete(id)
        } else if (action === 'complete') {
          await taskRepository.update(id, { status: 'completed' })
        }
      }
      result = { success: true, count: ids.length }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}