import { NextRequest, NextResponse } from 'next/server'

interface Params {
  params: {
    path: string[]
  }
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  // Handle undefined routes with 404
  return NextResponse.json(
    { error: 'Not found', message: `Route ${params.path.join('/')} not found` },
    { status: 404 }
  )
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  return NextResponse.json(
    { error: 'Not found', message: `Route ${params.path.join('/')} not found` },
    { status: 404 }
  )
}

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  return NextResponse.json(
    { error: 'Not found', message: `Route ${params.path.join('/')} not found` },
    { status: 404 }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  return NextResponse.json(
    { error: 'Not found', message: `Route ${params.path.join('/')} not found` },
    { status: 404 }
  )
}