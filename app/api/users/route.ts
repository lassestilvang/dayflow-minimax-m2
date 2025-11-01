import { NextRequest, NextResponse } from 'next/server'
import { userRepository } from '@/lib/data-access'
import { validateUserData } from '@/lib/validations/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateUserData(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: validation.error?.message },
        { status: 400 }
      )
    }

    // Create user
    const user = await userRepository.create(validation.data)
    
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}