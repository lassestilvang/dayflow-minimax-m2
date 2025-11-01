/**
 * Integrations API Route
 * Handles integration management operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { integrationServices, userIntegrations } from '@/lib/db/integrations-schema'
import { oauthManager } from '@/lib/integrations/oauth'
import { syncEngine } from '@/lib/integrations/sync-engine'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const serviceName = searchParams.get('service')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (serviceName) {
      // Get specific service info
      const service = await db.select().from(integrationServices)
        .where(eq(integrationServices.name, serviceName))
        .limit(1)

      if (!service[0]) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        )
      }

      // Get user's integration for this service
      const userIntegration = await db.select().from(userIntegrations)
        .where(and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.serviceName, serviceName)
        ))
        .limit(1)

      return NextResponse.json({
        service: service[0],
        integration: userIntegration[0] || null
      })
    }

    // Get all services with user integrations
    const services = await db.select().from(integrationServices)
    const integrations = await db.select().from(userIntegrations)
      .where(eq(userIntegrations.userId, userId))

    const serviceMap = new Map(services.map((s: any) => [s.name, s]))
    const userIntegrationsByService = new Map(
      integrations.map((i: any) => [i.serviceName, i])
    )

    const result = services.map((service: any) => ({
      ...service,
      integration: userIntegrationsByService.get(service.name) || null
    }))

    return NextResponse.json({ services: result })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, serviceName, config } = body

    if (!action || !userId || !serviceName) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId, serviceName' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'authorize':
        // Generate OAuth authorization URL
        const { url: authUrl, state } = await oauthManager.getAuthorizationUrl(
          serviceName,
          userId
        )

        return NextResponse.json({
          authUrl,
          state
        })

      case 'connect':
        // Connect integration after OAuth callback
        const { code, state: callbackState } = body
        if (!code || !callbackState) {
          return NextResponse.json(
            { error: 'Authorization code and state are required' },
            { status: 400 }
          )
        }

        try {
          const tokens = await oauthManager.handleCallback(
            serviceName,
            code,
            callbackState,
            userId
          )

          // Get service config
          const service = await db.select().from(integrationServices)
            .where(eq(integrationServices.name, serviceName))
            .limit(1)

          if (!service[0]) {
            return NextResponse.json(
              { error: 'Service not found' },
              { status: 404 }
            )
          }

          // Create user integration
          const [newIntegration] = await db.insert(userIntegrations).values({
            userId,
            serviceId: service[0].id,
            serviceName,
            displayName: service[0].displayName,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.expiresAt,
            isActive: true,
            syncSettings: config?.syncSettings || {},
            configuration: config?.configuration || {},
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning()

          // Initialize integration with configuration
          const integrationConfig = {
            fieldMapping: config?.fieldMapping || {},
            ...config
          }

          return NextResponse.json({
            success: true,
            integration: newIntegration
          })

        } catch (oauthError) {
          console.error('OAuth callback error:', oauthError)
          return NextResponse.json(
            { 
              error: 'Failed to connect service',
              details: oauthError instanceof Error ? oauthError.message : 'Unknown error'
            },
            { status: 400 }
          )
        }

      case 'sync':
        // Start synchronization
        const { operation = 'full_sync', options = {} } = body

        const [integration] = await db.select().from(userIntegrations)
          .where(and(
            eq(userIntegrations.userId, userId),
            eq(userIntegrations.serviceName, serviceName)
          ))
          .limit(1)

        if (!integration) {
          return NextResponse.json(
            { error: 'Integration not found' },
            { status: 404 }
          )
        }

        let jobId: string
        switch (operation) {
          case 'full_sync':
            jobId = await syncEngine.startFullSync(integration, options)
            break
          case 'incremental_sync':
            jobId = await syncEngine.startIncrementalSync(integration, options)
            break
          case 'task_sync':
            jobId = await syncEngine.startTaskSync(integration, options)
            break
          case 'event_sync':
            jobId = await syncEngine.startEventSync(integration, options)
            break
          default:
            return NextResponse.json(
              { error: 'Invalid sync operation' },
              { status: 400 }
            )
        }

        return NextResponse.json({
          success: true,
          jobId
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in integrations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { integrationId, userId, updates } = body

    if (!integrationId || !userId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: integrationId, userId, updates' },
        { status: 400 }
      )
    }

    // Update user integration
    const [updatedIntegration] = await db.update(userIntegrations)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(userIntegrations.id, integrationId),
        eq(userIntegrations.userId, userId)
      ))
      .returning()

    if (!updatedIntegration) {
      return NextResponse.json(
        { error: 'Integration not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      integration: updatedIntegration
    })

  } catch (error) {
    console.error('Error updating integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('integrationId')
    const userId = searchParams.get('userId')

    if (!integrationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: integrationId, userId' },
        { status: 400 }
      )
    }

    // Delete user integration
    const [deletedIntegration] = await db.delete(userIntegrations)
      .where(and(
        eq(userIntegrations.id, integrationId),
        eq(userIntegrations.userId, userId)
      ))
      .returning()

    if (!deletedIntegration) {
      return NextResponse.json(
        { error: 'Integration not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error deleting integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}