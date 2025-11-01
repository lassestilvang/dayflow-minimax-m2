/**
 * Notion API Integration
 * Implements task management integration with Notion workspaces
 */

import { BaseIntegrationService, IntegrationConfig, ExternalTask, TaskData, SyncResult, IntegrationError, RateLimitError, ValidationError } from './base'
import { RateLimiter, DataTransformer, ConflictDetector, RetryHandler, WebhookUtils, OAuthUtils } from './utils'
import { Task } from '../db/schema'
import { db } from '../db'
import { externalItems } from '../db/integrations-schema'
import { eq, and } from 'drizzle-orm'

interface NotionTask {
  id: string
  properties: {
    Name: {
      title: Array<{ text: { content: string } }>
    }
    Status?: {
      select: { name: string }
    }
    Priority?: {
      select: { name: string }
    }
    Due?: {
      date: { start: string } | null
    }
    Description?: {
      rich_text: Array<{ text: { content: string } }>
    }
    Tags?: {
      multi_select: Array<{ name: string; color: string }>
    }
  }
  created_time: string
  last_edited_time: string
  url: string
}

interface NotionDatabase {
  id: string
  title: Array<{ text: { content: string } }>
  url: string
}

interface NotionUser {
  id: string
  name: string
  avatar_url?: string
}

interface NotionOAuthTokenResponse {
  access_token: string
  token_type: string
  bot_id: string
  workspace_id: string
  workspace_name?: string
  workspace_icon?: string
}

export class NotionIntegration extends BaseIntegrationService {
  readonly serviceName = 'notion'
  readonly displayName = 'Notion'
  readonly type = 'task_management'
  readonly scopes = ['read', 'write']
  readonly authUrl = 'https://api.notion.com/v1/oauth/authorize'
  readonly tokenUrl = 'https://api.notion.com/v1/oauth/token'
  readonly apiBaseUrl = 'https://api.notion.com/v1'

  private databaseId?: string
  private rateLimiter: RateLimiter

  constructor(config: Partial<IntegrationConfig> = {}) {
    super(config)
    this.rateLimiter = new RateLimiter(60, 300) // 60 per minute, 300 per hour
  }

  async initialize(): Promise<void> {
    // Get the database ID from configuration
    this.databaseId = this.config?.fieldMapping?.databaseId
    if (!this.databaseId) {
      throw new ValidationError('Notion database ID is required', 'databaseId')
    }

    // Test the connection
    await this.testConnection()
  }

  async authenticate(accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void> {
    this.accessToken = accessToken
    this.refreshTokenValue = refreshToken
    this.expiresAt = expiresAt
    await this.initialize()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/users/me')
      return true
    } catch (error) {
      console.error('Notion connection test failed:', error)
      throw new IntegrationError('Failed to connect to Notion', 'CONNECTION_FAILED')
    }
  }

  async refreshToken(): Promise<void> {
    // Notion doesn't require token refresh for their OAuth implementation
    // Access tokens are valid for 1 year
    return
  }

  async syncTasks(): Promise<SyncResult> {
    const operationId = `notion-sync-${Date.now()}`
    const startTime = new Date()

    try {
      await this.ensureAuthenticated()
      
      // Get tasks from external service
      const externalTasks = await this.fetchExternalTasks()
      
      // Get existing DayFlow tasks
      // Implementation would fetch tasks from database
      
      const result: SyncResult = {
        operationId,
        status: 'success',
        itemsProcessed: externalTasks.length,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        conflicts: [],
        errors: [],
        startedAt: startTime,
        completedAt: new Date()
      }

      return result
    } catch (error) {
      return {
        operationId,
        status: 'error',
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        conflicts: [],
        errors: [{
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }],
        startedAt: startTime,
        completedAt: new Date()
      }
    }
  }

  async syncEvents(): Promise<SyncResult> {
    // Notion doesn't have calendar events, only tasks
    return {
      operationId: `notion-events-${Date.now()}`,
      status: 'success',
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      conflicts: [],
      errors: [],
      startedAt: new Date(),
      completedAt: new Date()
    }
  }

  async fullSync(): Promise<SyncResult> {
    return this.syncTasks()
  }

  async createTask(task: TaskData): Promise<ExternalTask> {
    this.validateTaskData(task)
    await this.ensureAuthenticated()

    const notionTask = {
      parent: { database_id: this.databaseId },
      properties: {
        Name: {
          title: [{ text: { content: task.title } }]
        },
        Status: {
          select: { name: this.mapStatusToNotion(task.status) }
        },
        Priority: {
          select: { name: this.mapPriorityToNotion(task.priority) }
        },
        ...(task.dueDate && {
          Due: { date: { start: task.dueDate.toISOString() } }
        }),
        ...(task.description && {
          Description: {
            rich_text: [{ text: { content: task.description } }]
          }
        }),
        ...(task.tags && task.tags.length > 0 && {
          Tags: {
            multi_select: task.tags.map(tag => ({ name: tag, color: 'blue' }))
          }
        })
      }
    }

    const response = await this.makeRequest('POST', '/pages', notionTask)
    
    return this.mapNotionTaskToExternal(response)
  }

  async updateTask(externalId: string, task: TaskData): Promise<ExternalTask> {
    this.validateTaskData(task)
    await this.ensureAuthenticated()

    const updateData: any = {
      properties: {
        Name: {
          title: [{ text: { content: task.title } }]
        },
        ...(task.status && {
          Status: { select: { name: this.mapStatusToNotion(task.status) } }
        }),
        ...(task.priority && {
          Priority: { select: { name: this.mapPriorityToNotion(task.priority) } }
        }),
        ...(task.dueDate !== undefined && {
          Due: task.dueDate ? { date: { start: task.dueDate.toISOString() } } : { date: null }
        }),
        ...(task.description !== undefined && {
          Description: task.description ? {
            rich_text: [{ text: { content: task.description } }]
          } : { rich_text: [] }
        })
      }
    }

    const response = await this.makeRequest('PATCH', `/pages/${externalId}`, updateData)
    return this.mapNotionTaskToExternal(response)
  }

  async deleteTask(externalId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/pages/${externalId}`)
  }

  async getTask(externalId: string): Promise<ExternalTask | null> {
    await this.ensureAuthenticated()

    try {
      const response = await this.makeRequest('GET', `/pages/${externalId}`)
      return this.mapNotionTaskToExternal(response)
    } catch (error) {
      if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async createEvent(event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('Notion does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async updateEvent(externalId: string, event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('Notion does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async deleteEvent(externalId: string): Promise<void> {
    throw new IntegrationError('Notion does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async getEvent(externalId: string): Promise<import('./base').ExternalEvent | null> {
    throw new IntegrationError('Notion does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // Handle different webhook events
    if (payload.type === 'page.created' || payload.type === 'page.updated') {
      // Trigger incremental sync for the affected page
      await this.handlePageWebhook(payload)
    }
  }

  async registerWebhook(webhookUrl: string): Promise<any> {
    await this.ensureAuthenticated()

    const webhookData = {
      url: webhookUrl,
      events: ['page.created', 'page.updated', 'page.archived']
    }

    const response = await this.makeRequest('POST', '/webhooks', webhookData)
    
    return {
      id: response.id,
      url: response.url,
      secret: response.secret,
      events: response.events,
      active: response.active,
      createdAt: new Date(response.created_time)
    }
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/webhooks/${webhookId}`)
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined
    this.refreshTokenValue = undefined
    this.expiresAt = undefined
    this.databaseId = undefined
  }

  // Private helper methods

  private async fetchExternalTasks(): Promise<NotionTask[]> {
    const response = await this.makeRequest('GET', `/databases/${this.databaseId}/query`)
    return response.results || []
  }

  private async makeRequest(
    method: string,
    path: string,
    data?: any
  ): Promise<any> {
    await this.rateLimiter.acquire()

    return RetryHandler.withRetry(async () => {
      const url = `${this.apiBaseUrl}${path}`
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }

      const options: RequestInit = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) })
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1')
          throw new RateLimitError('Rate limit exceeded', retryAfter)
        }

        if (response.status === 401) {
          throw new IntegrationError('Authentication failed', 'AUTHENTICATION_FAILED', 401)
        }

        if (response.status === 404) {
          throw new IntegrationError('Resource not found', 'NOT_FOUND', 404)
        }

        throw new IntegrationError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status,
          errorData
        )
      }

      return response.json()
    }, 3)
  }

  private mapNotionTaskToExternal(notionTask: NotionTask): ExternalTask {
    const properties = notionTask.properties
    const title = properties.Name?.title?.[0]?.text?.content || ''
    const description = properties.Description?.rich_text?.[0]?.text?.content
    const status = properties.Status?.select?.name || 'Not started'
    const priority = properties.Priority?.select?.name || 'Normal'
    const dueDate = properties.Due?.date?.start ? new Date(properties.Due.date.start) : undefined
    const tags = properties.Tags?.multi_select?.map(tag => tag.name) || []

    return {
      id: notionTask.id,
      title,
      description,
      status,
      priority,
      dueDate,
      completedAt: status === 'Done' ? new Date() : undefined,
      createdAt: new Date(notionTask.created_time),
      updatedAt: new Date(notionTask.last_edited_time),
      tags,
      url: notionTask.url,
      data: {
        ...notionTask,
        dayflowId: notionTask.id
      }
    }
  }

  private mapStatusToNotion(status: TaskData['status']): string {
    const statusMap: Record<TaskData['status'], string> = {
      pending: 'Not started',
      in_progress: 'In progress',
      completed: 'Done',
      cancelled: 'Cancelled'
    }
    return statusMap[status] || 'Not started'
  }

  private mapPriorityToNotion(priority: TaskData['priority']): string {
    const priorityMap: Record<TaskData['priority'], string> = {
      low: 'Low',
      medium: 'Normal',
      high: 'High',
      urgent: 'Urgent'
    }
    return priorityMap[priority] || 'Normal'
  }

  private async handlePageWebhook(payload: any): Promise<void> {
    // Get the page details
    const pageId = payload.data.id
    const page = await this.getTask(pageId)
    
    if (page) {
      // Update or create the corresponding DayFlow task
      // Implementation would map the external task to DayFlow format
      // and update the database
    }
  }
}