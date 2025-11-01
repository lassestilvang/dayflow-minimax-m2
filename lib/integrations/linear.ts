/**
 * Linear API Integration
 * Implements task management integration with Linear workspaces
 */

import { BaseIntegrationService, IntegrationConfig, ExternalTask, TaskData, SyncResult, IntegrationError, RateLimitError, ValidationError } from './base'
import { RateLimiter, DataTransformer, ConflictDetector, RetryHandler, WebhookUtils, OAuthUtils } from './utils'
import { Task } from '../db/schema'

interface LinearIssue {
  id: string
  identifier: string
  title: string
  description?: string
  state: {
    id: string
    name: string
    color: string
    type: string
  }
  priority: number
  priorityLabel: string
  assignee?: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  labels: Array<{
    id: string
    name: string
    color: string
  }>
  createdAt: string
  updatedAt: string
  url: string
  dueDate?: string
  startedAt?: string
  completedAt?: string
  canceledAt?: string
}

interface LinearTeam {
  id: string
  name: string
  key: string
  color: string
  description?: string
}

interface LinearUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface LinearOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface LinearWebhook {
  id: string
  url: string
  secret: string
  all_public_teams: boolean
  resource_types: string[]
  team_id?: string
  createdAt: string
}

export class LinearIntegration extends BaseIntegrationService {
  readonly serviceName = 'linear'
  readonly displayName = 'Linear'
  readonly type = 'task_management'
  readonly scopes = ['read', 'write']
  readonly authUrl = 'https://linear.app/oauth/authorize'
  readonly tokenUrl = 'https://api.linear.app/oauth/token'
  readonly apiBaseUrl = 'https://api.linear.app/graphql'

  private teamId?: string
  private rateLimiter: RateLimiter

  constructor(config: Partial<IntegrationConfig> = {}) {
    super(config)
    this.rateLimiter = new RateLimiter(100, 1000) // 100 per minute, 1000 per hour
  }

  async initialize(): Promise<void> {
    // Get the team ID from configuration
    this.teamId = this.config?.fieldMapping?.teamId
    if (!this.teamId) {
      throw new ValidationError('Linear team ID is required', 'teamId')
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
      await this.makeGraphQLRequest(`
        query {
          viewer {
            id
            name
            email
          }
        }
      `)
      return true
    } catch (error) {
      console.error('Linear connection test failed:', error)
      throw new IntegrationError('Failed to connect to Linear', 'CONNECTION_FAILED')
    }
  }

  async refreshToken(): Promise<void> {
    // Linear doesn't require token refresh for their OAuth implementation
    return
  }

  async syncTasks(): Promise<SyncResult> {
    const operationId = `linear-sync-${Date.now()}`
    const startTime = new Date()

    try {
      await this.ensureAuthenticated()
      
      // Get issues from external service
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
    // Linear doesn't have calendar events, only issues
    return {
      operationId: `linear-events-${Date.now()}`,
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

    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            state {
              id
              name
              color
              type
            }
            priority
            priorityLabel
            labels {
              id
              name
              color
            }
            createdAt
            updatedAt
            url
            dueDate
          }
        }
      }
    `

    const input = {
      teamId: this.teamId,
      title: task.title,
      description: task.description,
      priority: this.mapPriorityToLinear(task.priority),
      ...(task.dueDate && { dueDate: task.dueDate.toISOString().split('T')[0] }),
      ...(task.tags && task.tags.length > 0 && {
        labelIds: await this.getLabelIds(task.tags)
      })
    }

    const response = await this.makeGraphQLRequest(mutation, { input })
    
    if (!response.issueCreate.success) {
      throw new IntegrationError('Failed to create Linear issue', 'CREATE_FAILED')
    }

    return this.mapLinearIssueToExternal(response.issueCreate.issue)
  }

  async updateTask(externalId: string, task: TaskData): Promise<ExternalTask> {
    this.validateTaskData(task)
    await this.ensureAuthenticated()

    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            state {
              id
              name
              color
              type
            }
            priority
            priorityLabel
            labels {
              id
              name
              color
            }
            createdAt
            updatedAt
            url
            dueDate
          }
        }
      }
    `

    const input: any = {
      title: task.title,
    }

    if (task.description !== undefined) {
      input.description = task.description
    }

    if (task.status) {
      input.stateId = await this.getStateId(task.status)
    }

    if (task.priority) {
      input.priority = this.mapPriorityToLinear(task.priority)
    }

    if (task.dueDate !== undefined) {
      input.dueDate = task.dueDate ? task.dueDate.toISOString().split('T')[0] : null
    }

    if (task.tags !== undefined) {
      input.labelIds = task.tags.length > 0 ? await this.getLabelIds(task.tags) : []
    }

    const response = await this.makeGraphQLRequest(mutation, { id: externalId, input })
    
    if (!response.issueUpdate.success) {
      throw new IntegrationError('Failed to update Linear issue', 'UPDATE_FAILED')
    }

    return this.mapLinearIssueToExternal(response.issueUpdate.issue)
  }

  async deleteTask(externalId: string): Promise<void> {
    await this.ensureAuthenticated()

    const mutation = `
      mutation DeleteIssue($id: String!) {
        issueDelete(id: $id) {
          success
        }
      }
    `

    const response = await this.makeGraphQLRequest(mutation, { id: externalId })
    
    if (!response.issueDelete.success) {
      throw new IntegrationError('Failed to delete Linear issue', 'DELETE_FAILED')
    }
  }

  async getTask(externalId: string): Promise<ExternalTask | null> {
    await this.ensureAuthenticated()

    try {
      const query = `
        query GetIssue($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            description
            state {
              id
              name
              color
              type
            }
            priority
            priorityLabel
            assignee {
              id
              name
              email
              avatarUrl
            }
            labels {
              id
              name
              color
            }
            createdAt
            updatedAt
            url
            dueDate
            startedAt
            completedAt
            canceledAt
          }
        }
      `

      const response = await this.makeGraphQLRequest(query, { id: externalId })
      return response.issue ? this.mapLinearIssueToExternal(response.issue) : null
    } catch (error) {
      if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async createEvent(event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('Linear does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async updateEvent(externalId: string, event: import('./base').EventData): Promise<import('./base').ExternalEvent> {
    throw new IntegrationError('Linear does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async deleteEvent(externalId: string): Promise<void> {
    throw new IntegrationError('Linear does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async getEvent(externalId: string): Promise<import('./base').ExternalEvent | null> {
    throw new IntegrationError('Linear does not support calendar events', 'UNSUPPORTED_OPERATION')
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // Linear webhooks are handled through GraphQL subscriptions
    // This would typically be handled by a webhook server
    if (payload.type === 'Issue' && (payload.action === 'create' || payload.action === 'update')) {
      await this.handleIssueWebhook(payload)
    }
  }

  async registerWebhook(webhookUrl: string): Promise<any> {
    await this.ensureAuthenticated()

    const mutation = `
      mutation CreateWebhook($input: WebhookCreateInput!) {
        webhookCreate(input: $input) {
          success
          webhook {
            id
            url
            secret
            allPublicTeams
            resourceTypes
            createdAt
          }
        }
      }
    `

    const input = {
      url: webhookUrl,
      resourceTypes: ['Issue'],
      ...(this.teamId && { teamId: this.teamId })
    }

    const response = await this.makeGraphQLRequest(mutation, { input })
    
    if (!response.webhookCreate.success) {
      throw new IntegrationError('Failed to create Linear webhook', 'WEBHOOK_CREATE_FAILED')
    }

    return {
      id: response.webhookCreate.webhook.id,
      url: response.webhookCreate.webhook.url,
      secret: response.webhookCreate.webhook.secret,
      events: response.webhookCreate.webhook.resourceTypes,
      active: true,
      createdAt: new Date(response.webhookCreate.webhook.createdAt)
    }
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    await this.ensureAuthenticated()

    const mutation = `
      mutation DeleteWebhook($id: String!) {
        webhookDelete(id: $id) {
          success
        }
      }
    `

    const response = await this.makeGraphQLRequest(mutation, { id: webhookId })
    
    if (!response.webhookDelete.success) {
      throw new IntegrationError('Failed to delete Linear webhook', 'WEBHOOK_DELETE_FAILED')
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined
    this.refreshTokenValue = undefined
    this.expiresAt = undefined
    this.teamId = undefined
  }

  // Private helper methods

  private async fetchExternalTasks(): Promise<LinearIssue[]> {
    const query = `
      query GetIssues($teamId: String!) {
        issues(
          filter: {
            team: { id: { eq: $teamId } }
          }
        ) {
          nodes {
            id
            identifier
            title
            description
            state {
              id
              name
              color
              type
            }
            priority
            priorityLabel
            assignee {
              id
              name
              email
              avatarUrl
            }
            labels {
              id
              name
              color
            }
            createdAt
            updatedAt
            url
            dueDate
            startedAt
            completedAt
            canceledAt
          }
        }
      }
    `

    const response = await this.makeGraphQLRequest(query, { teamId: this.teamId })
    return response.issues.nodes || []
  }

  private async makeGraphQLRequest(query: string, variables?: any): Promise<any> {
    await this.rateLimiter.acquire()

    return RetryHandler.withRetry(async () => {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1')
          throw new RateLimitError('Rate limit exceeded', retryAfter)
        }

        if (response.status === 401) {
          throw new IntegrationError('Authentication failed', 'AUTHENTICATION_FAILED', 401)
        }

        throw new IntegrationError(
          `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status
        )
      }

      const data = await response.json()

      if (data.errors && data.errors.length > 0) {
        throw new IntegrationError(
          data.errors[0].message || 'GraphQL error occurred',
          'GRAPHQL_ERROR',
          undefined,
          data.errors
        )
      }

      return data.data
    }, 3)
  }

  private mapLinearIssueToExternal(issue: LinearIssue): ExternalTask {
    const title = issue.title
    const description = issue.description
    const status = issue.state.name
    const priority = issue.priorityLabel
    const dueDate = issue.dueDate ? new Date(issue.dueDate) : undefined
    const completedDate = issue.completedAt ? new Date(issue.completedAt) : undefined
    const tags = issue.labels.map(label => label.name)

    return {
      id: issue.id,
      title,
      description,
      status,
      priority,
      dueDate,
      completedAt: completedDate,
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.updatedAt),
      tags,
      url: issue.url,
      data: {
        identifier: issue.identifier,
        state: issue.state,
        assignee: issue.assignee,
        dayflowId: issue.id
      }
    }
  }

  private mapStatusToLinear(status: TaskData['status']): string {
    const statusMap: Record<TaskData['status'], string> = {
      pending: 'Backlog',
      in_progress: 'In Progress',
      completed: 'Done',
      cancelled: 'Canceled'
    }
    return statusMap[status] || 'Backlog'
  }

  private mapPriorityToLinear(priority: TaskData['priority']): number {
    const priorityMap: Record<TaskData['priority'], number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4
    }
    return priorityMap[priority] || 2
  }

  private async getStateId(status: TaskData['status']): Promise<string> {
    const query = `
      query GetStates($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
            }
          }
        }
      }
    `

    const response = await this.makeGraphQLRequest(query, { teamId: this.teamId })
    const states = response.team.states.nodes
    const targetName = this.mapStatusToLinear(status)
    const state = states.find((s: any) => s.name === targetName)
    
    if (!state) {
      throw new ValidationError(`State not found: ${targetName}`, 'stateId')
    }

    return state.id
  }

  private async getLabelIds(tags: string[]): Promise<string[]> {
    const query = `
      query GetLabels($teamId: String!) {
        team(id: $teamId) {
          labels {
            nodes {
              id
              name
            }
          }
        }
      }
    `

    const response = await this.makeGraphQLRequest(query, { teamId: this.teamId })
    const labels = response.team.labels.nodes
    
    return tags
      .map(tag => labels.find((l: any) => l.name === tag))
      .filter(Boolean)
      .map((label: any) => label.id)
  }

  private async handleIssueWebhook(payload: any): Promise<void> {
    // Get the issue details
    const issueId = payload.data.id
    const issue = await this.getTask(issueId)
    
    if (issue) {
      // Update or create the corresponding DayFlow task
      // Implementation would map the external task to DayFlow format
      // and update the database
    }
  }
}