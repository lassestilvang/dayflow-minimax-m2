/**
 * Integration Framework Example
 * Demonstrates how to use the integration framework to connect and sync with external services
 */

import { NextRequest } from 'next/server'
import { oauthManager } from '@/lib/integrations/oauth'
import { syncEngine, startFullSync } from '@/lib/integrations/sync-engine'
import { webhookManager } from '@/lib/integrations/webhooks'
import { auditLogger } from '@/lib/integrations/audit'
import { NotionIntegration } from '@/lib/integrations/notion'
import { ClickUpIntegration } from '@/lib/integrations/clickup'
import { GoogleCalendarIntegration } from '@/lib/integrations/google-calendar'

/**
 * Example 1: Connecting to Notion and syncing tasks
 */
export async function exampleNotionIntegration(userId: string, databaseId: string) {
  try {
    console.log('=== Notion Integration Example ===')

    // Step 1: Get authorization URL
    const { url: authUrl, state } = await oauthManager.getAuthorizationUrl('notion', userId)
    console.log('1. Redirect user to:', authUrl)

    // Step 2: Handle OAuth callback (after user authorizes)
    // In a real app, this would be handled by the OAuth callback route
    const tokens = await oauthManager.handleCallback('notion', 'auth_code', state, userId)
    console.log('2. Received tokens:', { 
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      expiresAt: tokens.expiresAt 
    })

    // Step 3: Create integration instance
    const notion = new NotionIntegration({
      fieldMapping: { databaseId },
      conflictResolution: 'manual',
      syncDirection: 'two_way',
      autoSync: true,
      syncInterval: 15
    })

    // Step 4: Authenticate with tokens
    await notion.authenticate(tokens.accessToken, tokens.refreshToken, tokens.expiresAt)
    console.log('3. Authentication successful')

    // Step 5: Test connection
    const isConnected = await notion.testConnection()
    console.log('4. Connection test:', isConnected)

    // Step 6: Create a sample task
    const sampleTask = {
      title: 'Example Task from Integration Framework',
      description: 'This task was created via the integration framework',
      status: 'pending' as const,
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      tags: ['integration', 'example']
    }

    const createdTask = await notion.createTask(sampleTask)
    console.log('5. Created task:', { 
      id: createdTask.id, 
      title: createdTask.title 
    })

    // Step 7: Sync tasks
    const syncResult = await notion.syncTasks()
    console.log('6. Sync result:', {
      status: syncResult.status,
      itemsProcessed: syncResult.itemsProcessed,
      itemsCreated: syncResult.itemsCreated,
      conflicts: syncResult.conflicts.length
    })

    return { success: true, integration: notion, syncResult }

  } catch (error) {
    console.error('Notion integration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Example 2: ClickUp integration with calendar events
 */
export async function exampleClickUpIntegration(userId: string, listId: string) {
  try {
    console.log('=== ClickUp Integration Example ===')

    // Initialize ClickUp integration
    const clickup = new ClickUpIntegration({
      fieldMapping: { listId },
      syncTasks: true,
      syncEvents: false,
      autoSync: true,
      conflictResolution: 'latest'
    })

    // Authenticate (would use OAuth flow in real app)
    await clickup.authenticate('clickup_access_token')
    console.log('1. ClickUp authentication successful')

    // Test connection
    const isConnected = await clickup.testConnection()
    console.log('2. Connection test:', isConnected)

    // Create multiple tasks for batch operation
    const tasks = [
      {
        title: 'Task 1 - Planning Phase',
        description: 'Initial planning and requirements gathering',
        status: 'pending' as const,
        priority: 'high' as const
      },
      {
        title: 'Task 2 - Development',
        description: 'Core feature implementation',
        status: 'in_progress' as const,
        priority: 'medium' as const
      },
      {
        title: 'Task 3 - Testing',
        description: 'QA and testing phase',
        status: 'pending' as const,
        priority: 'low' as const
      }
    ]

    const createdTasks = []
    for (const task of tasks) {
      const created = await clickup.createTask(task)
      createdTasks.push(created)
      console.log(`3. Created task: ${created.title}`)
    }

    // Perform full sync
    const syncResult = await clickup.fullSync()
    console.log('4. Full sync completed:', {
      status: syncResult.status,
      itemsProcessed: syncResult.itemsProcessed,
      totalDuration: syncResult.completedAt && syncResult.startedAt 
        ? syncResult.completedAt.getTime() - syncResult.startedAt.getTime() 
        : 0
    })

    return { success: true, integration: clickup, tasks: createdTasks, syncResult }

  } catch (error) {
    console.error('ClickUp integration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Example 3: Google Calendar integration with webhook handling
 */
export async function exampleGoogleCalendarIntegration(userId: string, calendarId: string) {
  try {
    console.log('=== Google Calendar Integration Example ===')

    // Initialize Google Calendar integration
    const googleCalendar = new GoogleCalendarIntegration({
      fieldMapping: { calendarId },
      syncEvents: true,
      syncTasks: false,
      autoSync: true,
      conflictResolution: 'merge'
    })

    // Authenticate with Google OAuth
    await googleCalendar.authenticate('google_access_token')
    console.log('1. Google Calendar authentication successful')

    // Test connection
    const isConnected = await googleCalendar.testConnection()
    console.log('2. Connection test:', isConnected)

    // Create a sample event
    const sampleEvent = {
      title: 'Integration Framework Demo Meeting',
      description: 'Demonstration of the DayFlow integration framework',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      isAllDay: false,
      location: 'Conference Room A',
      attendees: [
        { email: 'user@example.com', name: 'Demo User' },
        { email: 'team@example.com', name: 'Development Team' }
      ]
    }

    const createdEvent = await googleCalendar.createEvent(sampleEvent)
    console.log('3. Created event:', { 
      id: createdEvent.id, 
      title: createdEvent.title,
      startTime: createdEvent.startTime
    })

    // Register webhook for real-time updates
    const webhookUrl = 'https://your-app.com/api/webhooks/google-calendar'
    const webhook = await googleCalendar.registerWebhook(webhookUrl)
    console.log('4. Webhook registered:', { 
      id: webhook.id, 
      url: webhook.url 
    })

    // Sync events
    const syncResult = await googleCalendar.syncEvents()
    console.log('5. Event sync result:', {
      status: syncResult.status,
      itemsProcessed: syncResult.itemsProcessed,
      itemsCreated: syncResult.itemsCreated
    })

    // Simulate webhook event handling
    const webhookEvent = {
      resource: {
        method: 'events',
        id: createdEvent.id
      },
      data: createdEvent
    }

    await googleCalendar.handleWebhook(webhookEvent)
    console.log('6. Webhook event processed successfully')

    return { 
      success: true, 
      integration: googleCalendar, 
      event: createdEvent, 
      webhook,
      syncResult 
    }

  } catch (error) {
    console.error('Google Calendar integration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Example 4: Multi-service synchronization with conflict resolution
 */
export async function exampleMultiServiceSync(userId: string) {
  try {
    console.log('=== Multi-Service Sync Example ===')

    // Connect to multiple services
    const services = {
      notion: new NotionIntegration({ fieldMapping: { databaseId: 'notion-db-123' } }),
      clickup: new ClickUpIntegration({ fieldMapping: { listId: 'clickup-list-456' } }),
      googleCalendar: new GoogleCalendarIntegration({ fieldMapping: { calendarId: 'google-cal-789' } })
    }

    // Authenticate all services
    for (const [name, service] of Object.entries(services)) {
      await service.authenticate(`${name}_access_token`)
      console.log(`✓ ${name} authenticated`)
    }

    // Start full synchronization for each service
    const syncJobs = []
    for (const [name, service] of Object.entries(services)) {
      try {
        const jobId = await syncEngine.startFullSync({
          id: `${name}-integration`,
          userId,
          serviceName: name,
          displayName: name,
          isActive: true,
          accessToken: `${name}_access_token`,
          refreshToken: null,
          tokenExpiresAt: null,
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncDirection: 'two_way',
            syncTasks: true,
            syncEvents: true,
            conflictResolution: 'manual',
            fieldMapping: {}
          }
        }, {
          syncTasks: name !== 'google-calendar', // Skip tasks for calendar service
          syncEvents: name !== 'notion' && name !== 'clickup' // Skip events for task services
        })

        syncJobs.push({ service: name, jobId })
        console.log(`✓ ${name} sync started: ${jobId}`)
      } catch (error) {
        console.error(`✗ ${name} sync failed:`, error)
      }
    }

    // Monitor sync jobs
    console.log('Monitoring sync jobs...')
    const jobStatuses = {}
    
    for (const { service, jobId } of syncJobs) {
      // Poll job status
      for (let i = 0; i < 10; i++) { // Poll for up to 10 iterations
        const job = syncEngine.getJobStatus(jobId)
        jobStatuses[service] = job?.status || 'unknown'
        
        console.log(`Job ${jobId} (${service}): ${job?.status}`)
        
        if (job && (job.status === 'completed' || job.status === 'failed')) {
          break
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      }
    }

    return { 
      success: true, 
      syncJobs,
      finalStatuses: jobStatuses
    }

  } catch (error) {
    console.error('Multi-service sync failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Example 5: Webhook processing and real-time updates
 */
export async function exampleWebhookProcessing() {
  try {
    console.log('=== Webhook Processing Example ===')

    // Register webhook processors
    await webhookManager.registerWebhook('user-int-123', 'notion', ['page.created', 'page.updated'])
    await webhookManager.registerWebhook('user-int-456', 'clickup', ['taskCreated', 'taskUpdated'])
    await webhookManager.registerWebhook('user-int-789', 'google-calendar', ['calendar.events.created'])
    
    console.log('1. Webhooks registered')

    // Simulate incoming webhook events
    const webhookEvents = [
      {
        service: 'notion',
        payload: {
          object: 'page',
          event_type: 'page.created',
          data: {
            id: 'notion-page-123',
            title: 'New Task from Notion',
            properties: {
              Status: { select: { name: 'Not started' } },
              Priority: { select: { name: 'Normal' } }
            }
          }
        },
        headers: { 'x-signature': 'webhook-signature' }
      },
      {
        service: 'clickup',
        payload: {
          event_type: 'taskCreated',
          task_id: 'clickup-task-456',
          task: {
            id: 'clickup-task-456',
            name: 'ClickUp Task',
            status: 'Open',
            priority: '2 - Normal'
          }
        },
        headers: {}
      }
    ]

    // Process each webhook event
    for (const event of webhookEvents) {
      try {
        await webhookManager.handleWebhookEvent(event.service, event.payload, event.headers)
        console.log(`✓ Processed ${event.service} webhook: ${event.payload.event_type || event.payload.object}`)
      } catch (error) {
        console.error(`✗ Failed to process ${event.service} webhook:`, error)
      }
    }

    // Check webhook queue status
    const queueStatus = webhookManager.getDeliveryQueueStatus()
    console.log('2. Webhook queue status:', queueStatus)

    return { success: true, processedEvents: webhookEvents.length, queueStatus }

  } catch (error) {
    console.error('Webhook processing failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Example 6: Audit logging and security monitoring
 */
export async function exampleAuditAndSecurity(userId: string) {
  try {
    console.log('=== Audit & Security Example ===')

    // Log various integration events
    await auditLogger.logEvent({
      userIntegrationId: 'integration-123',
      userId,
      action: 'integration_connected',
      resource: 'notion',
      details: { databaseId: 'notion-db-123' },
      ipAddress: '192.168.1.100',
      userAgent: 'DayFlow-Client/1.0',
      success: true
    })
    console.log('1. Connection event logged')

    await auditLogger.logDataAccess(
      userId,
      'integration-123',
      'tasks',
      'read',
      'task-456',
      { count: 50, filters: { status: 'pending' } }
    )
    console.log('2. Data access logged')

    await auditLogger.logSync(
      userId,
      'integration-123',
      'full_sync',
      true,
      { itemsProcessed: 150, itemsCreated: 10, itemsUpdated: 5, conflicts: 2 }
    )
    console.log('3. Sync event logged')

    await auditLogger.recordComplianceEvent(
      userId,
      'integration-123',
      'tasks',
      'accessed',
      'User requested task synchronization',
      'consent',
      true,
      30 // 30 days retention
    )
    console.log('4. Compliance event logged')

    // Get audit trail
    const auditTrail = await auditLogger.getAuditTrail('integration-123', 10)
    console.log('5. Retrieved audit trail:', {
      events: auditTrail.length,
      latestAction: auditTrail[0]?.action
    })

    // Get security status
    const securityStatus = auditLogger.getSecurityStatus()
    console.log('6. Security status:', securityStatus)

    return { 
      success: true, 
      auditTrail,
      securityStatus
    }

  } catch (error) {
    console.error('Audit and security example failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Main demonstration function
 */
export async function runIntegrationFrameworkDemo() {
  console.log('🚀 Starting DayFlow Integration Framework Demo\n')

  const userId = 'demo-user-123'
  const results = []

  // Run all examples
  results.push(await exampleNotionIntegration(userId, 'demo-notion-db'))
  results.push(await exampleClickUpIntegration(userId, 'demo-clickup-list'))
  results.push(await exampleGoogleCalendarIntegration(userId, 'demo-google-cal'))
  results.push(await exampleMultiServiceSync(userId))
  results.push(await exampleWebhookProcessing())
  results.push(await exampleAuditAndSecurity(userId))

  // Summary
  console.log('\n📊 Demo Summary')
  console.log('='.repeat(50))
  
  let successful = 0
  let failed = 0

  results.forEach((result, index) => {
    const exampleNum = index + 1
    if (result.success) {
      successful++
      console.log(`✓ Example ${exampleNum}: SUCCESS`)
    } else {
      failed++
      console.log(`✗ Example ${exampleNum}: FAILED - ${result.error}`)
    }
  })

  console.log(`\n🎯 Results: ${successful}/${results.length} examples successful`)
  console.log(`🔒 Framework ready for production use!`)
  
  return {
    total: results.length,
    successful,
    failed,
    details: results
  }
}

// Export individual examples for testing
export {
  exampleNotionIntegration,
  exampleClickUpIntegration,
  exampleGoogleCalendarIntegration,
  exampleMultiServiceSync,
  exampleWebhookProcessing,
  exampleAuditAndSecurity
}