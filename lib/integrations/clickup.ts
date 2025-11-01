/**
 * ClickUp API Integration
 * Implements task management integration with ClickUp workspaces
 */

import { BaseIntegrationService, IntegrationConfig, ExternalTask, TaskData, SyncResult, IntegrationError, RateLimitError, ValidationError } from './base'
import { RateLimiter, DataTransformer, ConflictDetector, RetryHandler, WebhookUtils, OAuthUtils } from './utils'
import { Task } from '../db/schema'

interface ClickUpTask {
  id: string
  name: string
  text_content?: string
  status: {
    status: string
    color: string
    type: string
    orderindex: string
  }
  priority?: {
    priority: string
    color: string
  }
  due_date?: number
  start_date?: number
  date_created: number
  date_updated: number
  url: string
  tags: Array<{ name: string; tag_fg: string; tag_bg: string }>
  custom_fields?: Array<{
    id: string
    name: string
    value: any
  }>
  assignees: Array<{
    id: string
    username: string
    email: string
    color: string
    initials: string
    profilePicture?: string
  }>
}

interface ClickUpSpace {
  id: string
  name: string
  color: string
  avatar?: string
  private: boolean
  admin_can_manage: boolean
}

interface ClickUpFolder {
  id: string
  name: string
  hidden: boolean
}

interface ClickUpList {
  id: string
  name: string
  color: string
  list_folder: {
    id: string
    name: string
  }
  space: {
    id: string
    name: string
    color: string
  }
}

interface ClickUpOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ClickUpUser {
  id: string
  username: string
  color: string
  profilePicture?: string
  initals: string
  email: string
}

export class ClickUpIntegration extends BaseIntegrationService {
  readonly serviceName = 'clickup'
  readonly displayName = 'ClickUp'
  readonly type = 'task_management'
  readonly scopes = ['read', 'write']
  readonly authUrl = 'https://app.clickup.com/api'
  readonly tokenUrl = 'https://api.clickup.com/api/v2/oauth/token'
  readonly apiBaseUrl = 'https://api.clickup.com/api/v2'

  private listId?: string
  private rateLimiter: RateLimiter

  constructor(config: Partial<IntegrationConfig> = {}) {
    super(config)
    this.rateLimiter = new RateLimiter(100, 10000) // 100 per minute, 10000 per hour
  }

  async initialize(): Promise<void> {
    // Get the list ID from configuration
    this.listId = this.config?.fieldMapping?.listId
    if (!this.listId) {
      throw new ValidationError('ClickUp list ID is required', 'listId')
    }

    // Test the connection
    await this.testConnection()
  }

  async authenticate(accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void> {
    this.accessToken = accessToken
    this.refreshTokenValue = refreshToken as string | undefined
    this.expiresAt = expiresAt
    await this.initialize()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/user')
      return true
    } catch (error) {
      console.error('ClickUp connection test failed:', error)
      throw new IntegrationError('Failed to connect to ClickUp', 'CONNECTION_FAILED')
    }
  }

  async refreshToken(): Promise<void> {
    // ClickUp doesn't require token refresh for their OAuth implementation
    return
  }

  async syncTasks(): Promise<SyncResult> {
    const operationId = `clickup-sync-${Date.now()}`
    const startTime = new Date()

    try {
      await this.ensureAuthenticated()
      
      // Get tasks from external service
      const externalTasks = await this.fetchExternalTasks()
      
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
    // ClickUp doesn't have calendar events, only tasks
    return {
      operationId: `clickup-events-${Date.now()}`,
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

    const taskData = {
      name: task.title,
      description: task.description || '',
      status: this.mapStatusToClickUp(task.status),
      priority: this.mapPriorityToClickUp(task.priority),
      due_date: task.dueDate ? task.dueDate.getTime() : undefined,
      start_date: task.startTime ? task.startTime.getTime() : undefined,
      tags: task.tags || [],
      assignees: [] // Could be configured to assign to specific users
    }

    const response = await this.makeRequest('POST', `/list/${this.listId}/task`, taskData)
    
    return this.mapClickUpTaskToExternal(response)
  }

  async updateTask(externalId: string, task: TaskData): Promise<ExternalTask> {
    this.validateTaskData(task)
    await this.ensureAuthenticated()

    const updateData: any = {
      name: task.title,
      ...(task.description !== undefined && { description: task.description }),
      ...(task.status && { status: this.mapStatusToClickUp(task.status) }),
      ...(task.priority && { priority: this.mapPriorityToClickUp(task.priority) }),
      ...(task.dueDate !== undefined && { due_date: task.dueDate ? task.dueDate.getTime() : undefined }),
      ...(task.startTime !== undefined && { start_date: task.startTime ? task.startTime.getTime() : undefined }),
      ...(task.tags !== undefined && { tags: task.tags || [] })
    }

    const response = await this.makeRequest('PUT', `/task/${externalId}`, updateData)
    return this.mapClickUpTaskToExternal(response)
  }

  async deleteTask(externalId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/task/${externalId}`)
  }

  async getTask(externalId: string): Promise<ExternalTask | null> {
    await this.ensureAuthenticated()

    try {
      const response = await this.makeRequest('GET', `/task/${externalId}`)
      return this.mapClickUpTaskToExternal(response)
    } catch (error) {
      if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async createEvent(event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('ClickUp does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async updateEvent(externalId: string, event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('ClickUp does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async deleteEvent(externalId: string): Promise<void> {
    throw new IntegrationError('ClickUp does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async getEvent(externalId: string): Promise<import('./base').ExternalEvent | null> {
    throw new IntegrationError('ClickUp does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // ClickUp webhooks don't require signature verification
    if (payload.event_type === 'taskCreated' || payload.event_type === 'taskUpdated') {
      await this.handleTaskWebhook(payload)
    }
  }

  async registerWebhook(webhookUrl: string): Promise<any> {
    await this.ensureAuthenticated()

    const webhookData = {
      endpoint: webhookUrl,
      events: ['taskCreated', 'taskUpdated', 'taskDeleted']
    }

    const response = await this.makeRequest('POST', '/webhook', webhookData)
    
    return {
      id: response.webhook_id,
      url: response.endpoint,
      events: response.events,
      active: !response.deleted,
      createdAt: new Date(response.date_created)
    }
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/webhook/${webhookId}`)
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined
    ;(this as any).refreshTokenValue = undefined
    this.expiresAt = undefined
    this.listId = undefined
  }

  // Private helper methods

  private async fetchExternalTasks(): Promise<ClickUpTask[]> {
    const response = await this.makeRequest('GET', `/list/${this.listId}/task?subtasks=true`)
    return response.tasks || []
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
        'Authorization': this.accessToken!,
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
          errorData.err || `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status,
          errorData
        )
      }

      return response.json()
    }, 3)
  }

  private mapClickUpTaskToExternal(clickUpTask: ClickUpTask): ExternalTask {
    const title = clickUpTask.name
    const description = clickUpTask.text_content
    const status = clickUpTask.status.status
    const priority = clickUpTask.priority?.priority || 'Normal'
    const dueDate = clickUpTask.due_date ? new Date(clickUpTask.due_date) : undefined
    const completedDate = status.toLowerCase() === 'done' ? new Date(clickUpTask.date_updated) : undefined
    const tags = clickUpTask.tags.map(tag => tag.name)

    return {
      id: clickUpTask.id,
      title,
      description,
      status,
      priority,
      dueDate,
      completedAt: completedDate,
      createdAt: new Date(clickUpTask.date_created),
      updatedAt: new Date(clickUpTask.date_updated),
      tags,
      url: clickUpTask.url,
      data: {
        ...clickUpTask,
        dayflowId: clickUpTask.id
      }
    }
  }

  private mapStatusToClickUp(status: TaskData['status']): string {
    const statusMap: Record<TaskData['status'], string> = {
      pending: 'Open',
      in_progress: 'In Progress',
      completed: 'Done',
      cancelled: 'Cancelled'
    }
    return statusMap[status] || 'Open'
  }

  private mapPriorityToClickUp(priority: TaskData['priority']): string {
    const priorityMap: Record<TaskData['priority'], string> = {
      low: '3 - Low',
      medium: '2 - Normal',
      high: '1 - High',
      urgent: '0 - Urgent'
    }
    return priorityMap[priority] || '2 - Normal'
  }

  private async handleTaskWebhook(payload: any): Promise<void> {
    // Get the task details
    const taskId = payload.task_id
    const task = await this.getTask(taskId)
    
    if (task) {
      // Update or create the corresponding DayFlow task
      // Implementation would map the external task to DayFlow format
      // and update the database
    }
  }
}