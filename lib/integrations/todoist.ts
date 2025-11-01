/**
 * Todoist API Integration
 * Implements task management integration with Todoist workspaces
 */

import { BaseIntegrationService, IntegrationConfig, ExternalTask, TaskData, SyncResult, IntegrationError, RateLimitError, ValidationError } from './base'
import { RateLimiter, DataTransformer, ConflictDetector, RetryHandler, WebhookUtils, OAuthUtils } from './utils'
import { Task } from '../db/schema'

interface TodoistTask {
  id: string
  project_id: string
  content: string
  description?: string
  priority: number
  due_date?: string
  due_date_time?: boolean
  due_datetime?: string
  duration?: number
  duration_unit?: string
  assignee_id?: string
  assigner_id?: string
  url?: string
  comment_count: number
  created_at: string
  creator_id: string
  created_by_id: string
  is_deleted: boolean
  sync_id?: string
  order: number
  labels: string[]
  parent_id?: string
  section_id?: string
  date_added: string
  date_modified: string
  checked: boolean
  date_completed?: string
  url_overrides?: Record<string, string>
}

interface TodoistProject {
  id: string
  name: string
  color: string
  parent_id?: string
  comment_count: number
  order: number
  is_archived: boolean
  is_deleted: boolean
  is_favorite: boolean
  view_style: string
}

interface TodoistUser {
  id: string
  email: string
  name: string
  avatar?: string
  avatar_big?: string
  default_project_id?: string
  date_format: number
  email_verified: boolean
  full_name: string
  lang: string
  mobile_host: string
  premium_until?: string
  start_of_week: number
  team_id?: string
  theme: string
  timezone: string
  is_onboarding_user: boolean
  invited_by?: Record<string, any>
}

interface TodoistOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface TodoistWebhook {
  id: string
  secret: string
  url: string
  type: string
  project_id?: string
  is_active: boolean
  version: string
  simple: boolean
  cert_validation: boolean
  creation_date: number
}

export class TodoistIntegration extends BaseIntegrationService {
  readonly serviceName = 'todoist'
  readonly displayName = 'Todoist'
  readonly type = 'task_management'
  readonly scopes = ['read', 'write']
  readonly authUrl = 'https://todoist.com/oauth2/authorize'
  readonly tokenUrl = 'https://todoist.com/oauth2/access_token'
  readonly apiBaseUrl = 'https://api.todoist.com/rest/v2'

  private projectId?: string
  private rateLimiter: RateLimiter

  constructor(config: Partial<IntegrationConfig> = {}) {
    super(config)
    this.rateLimiter = new RateLimiter(75, 1500) // 75 per minute, 1500 per hour
  }

  async initialize(): Promise<void> {
    // Get the project ID from configuration
    this.projectId = this.config?.fieldMapping?.projectId
    if (!this.projectId) {
      throw new ValidationError('Todoist project ID is required', 'projectId')
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
      await this.makeRequest('GET', '/user')
      return true
    } catch (error) {
      console.error('Todoist connection test failed:', error)
      throw new IntegrationError('Failed to connect to Todoist', 'CONNECTION_FAILED')
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.refreshTokenValue) {
      throw new ValidationError('No refresh token available', 'refreshToken')
    }

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshTokenValue,
          client_id: process.env.TODOIST_CLIENT_ID || ''
        })
      })

      if (!response.ok) {
        throw new IntegrationError('Failed to refresh Todoist token', 'TOKEN_REFRESH_FAILED')
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.refreshTokenValue = data.refresh_token || this.refreshTokenValue
      this.expiresAt = new Date(Date.now() + (data.expires_in * 1000))
    } catch (error) {
      throw new IntegrationError('Failed to refresh Todoist token', 'TOKEN_REFRESH_FAILED', undefined, error)
    }
  }

  async syncTasks(): Promise<SyncResult> {
    const operationId = `todoist-sync-${Date.now()}`
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
    // Todoist doesn't have calendar events, only tasks
    return {
      operationId: `todoist-events-${Date.now()}`,
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

    const taskData: any = {
      content: task.title,
      project_id: this.projectId,
    }

    if (task.description) {
      taskData.description = task.description
    }

    if (task.dueDate) {
      taskData.due_date = task.dueDate.toISOString().split('T')[0]
      taskData.due_date_time = false
    }

    if (task.priority) {
      taskData.priority = this.mapPriorityToTodoist(task.priority)
    }

    if (task.tags && task.tags.length > 0) {
      taskData.labels = task.tags
    }

    const response = await this.makeRequest('POST', '/tasks', taskData)
    
    return this.mapTodoistTaskToExternal(response)
  }

  async updateTask(externalId: string, task: TaskData): Promise<ExternalTask> {
    this.validateTaskData(task)
    await this.ensureAuthenticated()

    const updateData: any = {
      content: task.title,
    }

    if (task.description !== undefined) {
      updateData.description = task.description
    }

    if (task.status) {
      if (task.status === 'completed') {
        updateData.checked = true
        updateData.date_completed = new Date().toISOString()
      } else {
        updateData.checked = false
        if (task.status === 'pending') {
          updateData.checked = false
        }
      }
    }

    if (task.priority) {
      updateData.priority = this.mapPriorityToTodoist(task.priority)
    }

    if (task.dueDate !== undefined) {
      updateData.due_date = task.dueDate ? task.dueDate.toISOString().split('T')[0] : null
      updateData.due_date_time = false
    }

    if (task.tags !== undefined) {
      updateData.labels = task.tags || []
    }

    const response = await this.makeRequest('POST', `/tasks/${externalId}`, updateData)
    return this.mapTodoistTaskToExternal(response)
  }

  async deleteTask(externalId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/tasks/${externalId}`)
  }

  async getTask(externalId: string): Promise<ExternalTask | null> {
    await this.ensureAuthenticated()

    try {
      const response = await this.makeRequest('GET', `/tasks/${externalId}`)
      return this.mapTodoistTaskToExternal(response)
    } catch (error) {
      if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async createEvent(event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('Todoist does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async updateEvent(externalId: string, event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('Todoist does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async deleteEvent(externalId: string): Promise<void> {
    throw new IntegrationError('Todoist does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async getEvent(externalId: string): Promise<import('./base').ExternalEvent | null> {
    throw new IntegrationError('Todoist does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // Handle different webhook events
    if (payload.event_name === 'added' || payload.event_name === 'updated') {
      await this.handleTaskWebhook(payload)
    }
  }

  async registerWebhook(webhookUrl: string): Promise<any> {
    await this.ensureAuthenticated()

    const webhookData = {
      url: webhookUrl,
      ...(this.projectId && { project_id: this.projectId })
    }

    const response = await this.makeRequest('POST', '/webhooks', webhookData)
    
    return {
      id: response.id,
      url: response.url,
      secret: response.secret,
      events: ['added', 'updated', 'deleted'],
      active: response.is_active,
      createdAt: new Date(response.creation_date * 1000)
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
    this.projectId = undefined
  }

  // Private helper methods

  private async fetchExternalTasks(): Promise<TodoistTask[]> {
    const response = await this.makeRequest('GET', `/tasks?project_id=${this.projectId}&page_size=200`)
    return response || []
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
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status,
          errorData
        )
      }

      return response.json()
    }, 3)
  }

  private mapTodoistTaskToExternal(todoistTask: TodoistTask): ExternalTask {
    const title = todoistTask.content
    const description = todoistTask.description
    const status = todoistTask.checked ? 'Completed' : 'Open'
    const priority = this.mapPriorityFromTodoist(todoistTask.priority)
    const dueDate = todoistTask.due_date ? new Date(todoistTask.due_date) : undefined
    const completedDate = todoistTask.date_completed ? new Date(todoistTask.date_completed) : undefined
    const tags = todoistTask.labels

    return {
      id: todoistTask.id,
      title,
      description,
      status,
      priority,
      dueDate,
      completedAt: completedDate,
      createdAt: new Date(todoistTask.date_added),
      updatedAt: new Date(todoistTask.date_modified),
      tags,
      url: todoistTask.url,
      data: {
        ...todoistTask,
        dayflowId: todoistTask.id
      }
    }
  }

  private mapStatusToTodoist(status: TaskData['status']): boolean {
    return status === 'completed'
  }

  private mapPriorityToTodoist(priority: TaskData['priority']): number {
    const priorityMap: Record<TaskData['priority'], number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4
    }
    return priorityMap[priority] || 1
  }

  private mapPriorityFromTodoist(priority: number): string {
    const priorityMap: Record<number, string> = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'urgent'
    }
    return priorityMap[priority] || 'medium'
  }

  private async handleTaskWebhook(payload: any): Promise<void> {
    // Get the task details
    const taskId = payload.event_data.id
    const task = await this.getTask(taskId)
    
    if (task) {
      // Update or create the corresponding DayFlow task
      // Implementation would map the external task to DayFlow format
      // and update the database
    }
  }
}