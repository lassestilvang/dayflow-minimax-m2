import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/data-access'
import { validateTaskData } from '@/lib/validations/schemas'

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

    const tasks = await taskRepository.findByUserId(userId)
    return NextResponse.json(tasks, { status: 200 })
  } catch (error) {
    console.error('Error fetching tasks:', error)
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
    const validation = validateTaskData(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: validation.error?.message },
        { status: 400 }
      )
    }

    const task = await taskRepository.create({
      ...validation.data,
      userId
    })
    
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}