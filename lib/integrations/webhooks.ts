/**
 * Webhook Handling System
 * Manages webhook endpoints and processing for all integration services
 */

import { WebhookUtils, RetryHandler } from './utils'
import { IntegrationError, ValidationError } from './base'
import { UserIntegration, IntegrationAuditLog } from '../db/integrations-schema'
import { db } from '../db'
import { and, eq, inArray } from 'drizzle-orm'

interface WebhookEvent {
  id: string
  source: string
  type: string
  action: string
  data: any
  timestamp: Date
  signature?: string
  headers: Record<string, string>
}

interface WebhookRegistration {
  id: string
  serviceName: string
  userIntegrationId: string
  url: string
  secret?: string
  events: string[]
  isActive: boolean
  createdAt: Date
  lastTriggeredAt?: Date
  failureCount: number
}

interface WebhookProcessor {
  serviceName: string
  eventType: string
  handler: (event: WebhookEvent, integration: UserIntegration) => Promise<void>
}

interface WebhookDelivery {
  id: string
  webhookId: string
  eventId: string
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  attempts: number
  maxAttempts: number
  nextRetryAt?: Date
  lastError?: string
  createdAt: Date
  deliveredAt?: Date
}

export class WebhookManager {
  private processors: Map<string, WebhookProcessor> = new Map()
  private activeWebhooks: Map<string, WebhookRegistration> = new Map()
  private deliveryQueue: WebhookDelivery[] = []

  constructor() {
    this.initializeProcessors()
  }

  private initializeProcessors(): void {
    // Register webhook processors for each service
    this.registerProcessor({
      serviceName: 'notion',
      eventType: 'page.created',
      handler: this.handleNotionEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'notion',
      eventType: 'page.updated',
      handler: this.handleNotionEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'clickup',
      eventType: 'taskCreated',
      handler: this.handleClickUpEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'clickup',
      eventType: 'taskUpdated',
      handler: this.handleClickUpEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'linear',
      eventType: 'issue.created',
      handler: this.handleLinearEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'linear',
      eventType: 'issue.updated',
      handler: this.handleLinearEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'todoist',
      eventType: 'item.added',
      handler: this.handleTodoistEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'todoist',
      eventType: 'item.updated',
      handler: this.handleTodoistEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'google-calendar',
      eventType: 'calendar.events.created',
      handler: this.handleGoogleCalendarEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'google-calendar',
      eventType: 'calendar.events.updated',
      handler: this.handleGoogleCalendarEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'outlook',
      eventType: 'calendar.event.created',
      handler: this.handleOutlookEvent.bind(this)
    })

    this.registerProcessor({
      serviceName: 'outlook',
      eventType: 'calendar.event.updated',
      handler: this.handleOutlookEvent.bind(this)
    })
  }

  /**
   * Register a webhook processor for a specific service and event type
   */
  registerProcessor(processor: WebhookProcessor): void {
    const key = `${processor.serviceName}.${processor.eventType}`
    this.processors.set(key, processor)
  }

  /**
   * Register a new webhook for a user integration
   */
  async registerWebhook(
    userIntegrationId: string,
    serviceName: string,
    events: string[]
  ): Promise<WebhookRegistration> {
    // Generate webhook URL (would be configured based on environment)
    const webhookUrl = `${process.env.PUBLIC_URL}/api/webhooks/${serviceName}`
    const webhookSecret = WebhookUtils.generateWebhookSecret()

    // Create webhook registration record
    const registration: WebhookRegistration = {
      id: WebhookUtils.generateWebhookId(),
      serviceName,
      userIntegrationId,
      url: webhookUrl,
      secret: webhookSecret,
      events,
      isActive: true,
      createdAt: new Date(),
      failureCount: 0
    }

    // Store in active webhooks
    this.activeWebhooks.set(registration.id, registration)

    return registration
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    const webhook = this.activeWebhooks.get(webhookId)
    if (webhook) {
      webhook.isActive = false
      this.activeWebhooks.delete(webhookId)
    }
  }

  /**
   * Handle incoming webhook event
   */
  async handleWebhookEvent(
    serviceName: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<void> {
    // Parse webhook event
    const event = this.parseWebhookEvent(serviceName, payload, headers)
    
    // Find matching webhooks
    const webhooks = Array.from(this.activeWebhooks.values()).filter(w => 
      w.serviceName === serviceName && 
      w.isActive && 
      this.eventMatches(w.events, event.type)
    )

    if (webhooks.length === 0) {
      console.warn(`No active webhooks found for service ${serviceName} and event ${event.type}`)
      return
    }

    // Process event for each matching webhook
    for (const webhook of webhooks) {
      try {
        // Verify signature if provided
        if (headers['x-signature'] && webhook.secret) {
          const isValid = await WebhookUtils.verifyWebhookSignature(
            JSON.stringify(payload),
            headers['x-signature'],
            webhook.secret
          )
          if (!isValid) {
            throw new ValidationError('Invalid webhook signature', 'signature')
          }
        }

        // Get user integration
        const integration = await this.getUserIntegration(webhook.userIntegrationId)
        if (!integration) {
          throw new IntegrationError('User integration not found', 'INTEGRATION_NOT_FOUND')
        }

        // Find and execute processor
        const processor = this.processors.get(`${serviceName}.${event.type}`)
        if (!processor) {
          console.warn(`No processor found for ${serviceName}.${event.type}`)
          continue
        }

        await processor.handler(event, integration)

        // Update webhook trigger timestamp
        webhook.lastTriggeredAt = new Date()
        webhook.failureCount = 0

        // Log successful processing
        await this.logWebhookEvent(webhook.userIntegrationId, event, 'success')

      } catch (error) {
        console.error(`Webhook processing failed for ${webhook.id}:`, error)
        webhook.failureCount++
        
        // Mark webhook as inactive after multiple failures
        if (webhook.failureCount >= 5) {
          webhook.isActive = false
        }

        await this.logWebhookEvent(webhook.userIntegrationId, event, 'failed', error as Error)
      }
    }
  }

  /**
   * Queue webhook delivery for retry
   */
  queueWebhookDelivery(
    webhookId: string,
    eventId: string,
    delay: number = 60000 // 1 minute default
  ): void {
    const delivery: WebhookDelivery = {
      id: WebhookUtils.generateWebhookId(),
      webhookId,
      eventId,
      status: 'retrying',
      attempts: 1,
      maxAttempts: 3,
      nextRetryAt: new Date(Date.now() + delay),
      createdAt: new Date()
    }

    this.deliveryQueue.push(delivery)
  }

  /**
   * Process webhook delivery queue
   */
  async processDeliveryQueue(): Promise<void> {
    const now = new Date()
    const readyDeliveries = this.deliveryQueue.filter(d => 
      d.status === 'retrying' && 
      d.nextRetryAt && 
      d.nextRetryAt <= now &&
      d.attempts < d.maxAttempts
    )

    for (const delivery of readyDeliveries) {
      try {
        await this.deliverWebhook(delivery)
        delivery.status = 'delivered'
        delivery.deliveredAt = new Date()
      } catch (error) {
        delivery.attempts++
        delivery.lastError = (error as Error).message
        
        if (delivery.attempts >= delivery.maxAttempts) {
          delivery.status = 'failed'
        } else {
          // Exponential backoff
          const delay = Math.min(300000, 60000 * Math.pow(2, delivery.attempts))
          delivery.nextRetryAt = new Date(Date.now() + delay)
        }
      }
    }

    // Clean up completed deliveries
    this.deliveryQueue = this.deliveryQueue.filter(d => 
      d.status === 'retrying' || 
      (d.status === 'delivered' && d.deliveredAt && 
       Date.now() - d.deliveredAt.getTime() > 3600000) // 1 hour
    )
  }

  /**
   * Get webhook registration by ID
   */
  getWebhook(registrationId: string): WebhookRegistration | undefined {
    return this.activeWebhooks.get(registrationId)
  }

  /**
   * Get all webhooks for a user integration
   */
  getWebhooksByIntegration(userIntegrationId: string): WebhookRegistration[] {
    return Array.from(this.activeWebhooks.values()).filter(w => w.userIntegrationId === userIntegrationId)
  }

  /**
   * Get webhooks by service
   */
  getWebhooksByService(serviceName: string): WebhookRegistration[] {
    return Array.from(this.activeWebhooks.values()).filter(w => w.serviceName === serviceName)
  }

  /**
   * Get delivery queue status
   */
  getDeliveryQueueStatus(): { pending: number; retrying: number; failed: number } {
    return {
      pending: this.deliveryQueue.filter(d => d.status === 'pending').length,
      retrying: this.deliveryQueue.filter(d => d.status === 'retrying').length,
      failed: this.deliveryQueue.filter(d => d.status === 'failed').length
    }
  }

  // Private methods

  private parseWebhookEvent(
    serviceName: string,
    payload: any,
    headers: Record<string, string>
  ): WebhookEvent {
    const baseEvent: Partial<WebhookEvent> = {
      id: WebhookUtils.generateWebhookId(),
      source: serviceName,
      timestamp: new Date(),
      headers
    }

    // Parse service-specific webhook format
    switch (serviceName) {
      case 'notion':
        return {
          ...baseEvent,
          type: payload.object === 'page' ? 'page.updated' : 'unknown',
          action: payload.event_type || 'updated',
          data: payload
        } as WebhookEvent

      case 'clickup':
        return {
          ...baseEvent,
          type: payload.event_type,
          action: payload.event_type,
          data: payload
        } as WebhookEvent

      case 'linear':
        return {
          ...baseEvent,
          type: `${payload.type}.${payload.action}`,
          action: payload.action,
          data: payload
        } as WebhookEvent

      case 'google-calendar':
        return {
          ...baseEvent,
          type: `calendar.${payload.resource?.method || 'events'}.${payload.resource?.method || 'updated'}`,
          action: payload.resource?.method || 'updated',
          data: payload
        } as WebhookEvent

      case 'outlook':
        return {
          ...baseEvent,
          type: `calendar.${payload.changeType}`,
          action: payload.changeType,
          data: payload
        } as WebhookEvent

      default:
        return {
          ...baseEvent,
          type: 'unknown',
          action: 'unknown',
          data: payload
        } as WebhookEvent
    }
  }

  private eventMatches(webhookEvents: string[], eventType: string): boolean {
    return webhookEvents.includes('*') || webhookEvents.includes(eventType)
  }

  private async getUserIntegration(userIntegrationId: string): Promise<UserIntegration | null> {
    try {
      // This would query the database for the user integration
      // Implementation depends on the database setup
      return null // Placeholder
    } catch (error) {
      throw new IntegrationError('Failed to fetch user integration', 'DATABASE_ERROR', undefined, error)
    }
  }

  private async logWebhookEvent(
    userIntegrationId: string,
    event: WebhookEvent,
    status: 'success' | 'failed',
    error?: Error
  ): Promise<void> {
    try {
      // Log to audit trail
      const auditLog = {
        userIntegrationId,
        userId: undefined, // Would be extracted from userIntegration
        action: `webhook_${status}`,
        resource: event.type,
        resourceId: event.id,
        details: {
          service: event.source,
          eventType: event.type,
          error: error?.message,
          data: event.data
        },
        createdAt: new Date()
      }

      // Insert into audit log table
      // await db.insert(integrationAuditLog).values(auditLog)
      
    } catch (logError) {
      console.error('Failed to log webhook event:', logError)
    }
  }

  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.getWebhook(delivery.webhookId)
    if (!webhook) {
      throw new IntegrationError('Webhook not found', 'WEBHOOK_NOT_FOUND')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'DayFlow-Webhook/1.0'
    }

    if (webhook.secret) {
      const payload = JSON.stringify({ deliveryId: delivery.id })
      const signature = await WebhookUtils.verifyWebhookSignature(payload, '', webhook.secret)
      headers['X-Webhook-Signature'] = signature ? 'valid' : 'invalid'
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventId: delivery.eventId,
        timestamp: new Date().toISOString(),
        data: {} // Webhook event data would be here
      })
    })

    if (!response.ok) {
      throw new IntegrationError(`Webhook delivery failed: ${response.statusText}`, 'DELIVERY_FAILED')
    }
  }

  // Event handlers for different services

  private async handleNotionEvent(event: WebhookEvent, integration: UserIntegration): Promise<void> {
    // Handle Notion page events
    console.log('Handling Notion event:', event.type, event.data)
    // Implementation would trigger sync for the affected page
  }

  private async handleClickUpEvent(event: WebhookEvent, integration: UserIntegration): Promise<void> {
    // Handle ClickUp task events
    console.log('Handling ClickUp event:', event.type, event.data)
    // Implementation would trigger sync for the affected task
  }

  private async handleLinearEvent(event: WebhookEvent, integration: UserIntegration): Promise<void> {
    // Handle Linear issue events
    console.log('Handling Linear event:', event.type, event.data)
    // Implementation would trigger sync for the affected issue
  }

  private async handleTodoistEvent(event: WebhookEvent, integration: UserIntegration): Promise<void> {
    // Handle Todoist task events
    console.log('Handling Todoist event:', event.type, event.data)
    // Implementation would trigger sync for the affected task
  }

  private async handleGoogleCalendarEvent(event: WebhookEvent, integration: UserIntegration): Promise<void> {
    // Handle Google Calendar events
    console.log('Handling Google Calendar event:', event.type, event.data)
    // Implementation would trigger sync for the affected event
  }

  private async handleOutlookEvent(event: WebhookEvent, integration: UserIntegration): Promise<void> {
    // Handle Outlook calendar events
    console.log('Handling Outlook event:', event.type, event.data)
    // Implementation would trigger sync for the affected event
  }
}

// Export singleton instance
export const webhookManager = new WebhookManager()

// Helper function to register webhook
export async function registerServiceWebhook(
  userIntegrationId: string,
  serviceName: string,
  events: string[]
): Promise<WebhookRegistration> {
  return webhookManager.registerWebhook(userIntegrationId, serviceName, events)
}

// Helper function to handle webhook event
export async function handleServiceWebhook(
  serviceName: string,
  payload: any,
  headers: Record<string, string>
): Promise<void> {
  return webhookManager.handleWebhookEvent(serviceName, payload, headers)
}

// Helper function to process delivery queue
export async function processWebhookQueue(): Promise<void> {
  return webhookManager.processDeliveryQueue()
}