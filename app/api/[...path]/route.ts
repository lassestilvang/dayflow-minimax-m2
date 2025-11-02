import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  // Handle undefined routes with 404
  return NextResponse.json(
    { error: 'Not found', message: `Route ${path.join('/')} not found` },
    { status: 404 }
  )
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return NextResponse.json(
    { error: 'Not found', message: `Route ${path.join('/')} not found` },
    { status: 404 }
  )
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return NextResponse.json(
    { error: 'Not found', message: `Route ${path.join('/')} not found` },
    { status: 404 }
  )
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return NextResponse.json(
    { error: 'Not found', message: `Route ${path.join('/')} not found` },
    { status: 404 }
  )
}